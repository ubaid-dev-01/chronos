import { TimeLog } from '@chronos/db';
import ExcelJS from 'exceljs';
import { createObjectCsvStringifier } from 'csv-writer';

interface ReportFilter {
  orgId: string;
  userId?: string;
  projectId?: string;
  startDate: Date;
  endDate: Date;
}

interface TimesheetRow {
  date: string;
  employee: string;
  project: string;
  hoursWorked: number;
  activityScore: number;
  isOffline: boolean;
}

export async function generateTimesheet(filter: ReportFilter): Promise<TimesheetRow[]> {
  const match: any = {
    orgId: filter.orgId,
    startTime: { $gte: filter.startDate.getTime(), $lte: filter.endDate.getTime() },
  };
  if (filter.userId) match.userId = filter.userId;
  if (filter.projectId) match.projectId = filter.projectId;

  const timelogs = await TimeLog.find(match)
    .populate('userId', 'displayName hourlyRate')
    .populate('projectId', 'name')
    .sort({ startTime: 1 })
    .lean();

  return timelogs.map((log: any) => ({
    date: new Date(log.startTime).toISOString().split('T')[0],
    employee: log.userId?.displayName || 'Unknown',
    project: log.projectId?.name || 'Unassigned',
    hoursWorked: log.endTime ? (log.endTime - log.startTime) / 3600000 : 0,
    activityScore: Math.round((log.activityScore || 0) * 100),
    isOffline: log.isOffline || false,
  }));
}

export async function exportCSV(filter: ReportFilter): Promise<string> {
  const rows = await generateTimesheet(filter);
  const csvStringifier = createObjectCsvStringifier({
    header: [
      { id: 'date', title: 'Date' },
      { id: 'employee', title: 'Employee' },
      { id: 'project', title: 'Project' },
      { id: 'hoursWorked', title: 'Hours Worked' },
      { id: 'activityScore', title: 'Activity %' },
      { id: 'isOffline', title: 'Offline' },
    ],
  });
  return csvStringifier.getHeaderString()! + csvStringifier.stringifyRecords(rows);
}

export async function exportExcel(filter: ReportFilter): Promise<Buffer> {
  const rows = await generateTimesheet(filter);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Chronos';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Timesheet');
  sheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Employee', key: 'employee', width: 25 },
    { header: 'Project', key: 'project', width: 25 },
    { header: 'Hours Worked', key: 'hoursWorked', width: 15 },
    { header: 'Activity %', key: 'activityScore', width: 12 },
    { header: 'Offline', key: 'isOffline', width: 10 },
  ];

  // Style header
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = {
    type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6C2BD9' },
  };

  rows.forEach((row) => {
    sheet.addRow({ ...row, hoursWorked: Math.round(row.hoursWorked * 100) / 100 });
  });

  // Summary row
  const totalHours = rows.reduce((s, r) => s + r.hoursWorked, 0);
  const avgActivity = rows.length > 0
    ? rows.reduce((s, r) => s + r.activityScore, 0) / rows.length : 0;

  sheet.addRow({});
  const summary = sheet.addRow({
    date: 'TOTAL', hoursWorked: Math.round(totalHours * 100) / 100,
    activityScore: Math.round(avgActivity),
  });
  summary.font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

import { TimeLog, User } from '@chronos/db';

export interface PayrollItem {
  userId: string;
  email: string;
  displayName: string;
  totalHours: number;
  hourlyRate: number;
  totalAmount: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
}

export class PayrollService {
  async generatePayroll(orgId: string, startDate: Date, endDate: Date): Promise<PayrollItem[]> {
    const users = await User.find({ orgId, isActive: true }).lean() as any[];
    const items: PayrollItem[] = [];

    for (const user of users) {
      const logs = await TimeLog.find({
        userId: user._id,
        startTime: { $gte: startDate.getTime() },
        endTime: { $lte: endDate.getTime() },
      }).lean() as any[];

      const totalMs = logs.reduce((s, l) => s + ((l.endTime || 0) - l.startTime), 0);
      const totalHours = totalMs / 3600000;
      const totalAmount = Math.round(totalHours * (user.hourlyRate || 0) * 100);

      if (totalHours > 0) {
        items.push({
          userId: user._id.toString(),
          email: user.email,
          displayName: user.displayName,
          totalHours: Math.round(totalHours * 100) / 100,
          hourlyRate: user.hourlyRate || 0,
          totalAmount,
          currency: 'USD',
          periodStart: startDate.toISOString().split('T')[0],
          periodEnd: endDate.toISOString().split('T')[0],
        });
      }
    }
    return items;
  }
}

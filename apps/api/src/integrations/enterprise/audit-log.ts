// Use the shared mongoose instance from @chronos/db (the one `connectDB()`
// actually connects) rather than importing `mongoose` directly apps/api has
// no direct dependency on mongoose, and a second, disconnected mongoose
// instance would silently register this model against a connection that's
// never open.
import { mongoose } from '@chronos/db';

const { Schema } = mongoose;

const auditLogSchema = new Schema({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, required: true },
  action: {
    type: String, required: true,
    enum: [
      'user.created', 'user.updated', 'user.deleted', 'user.invited', 'user.invite_revoked',
      'project.created', 'project.updated', 'project.deleted',
      'org.updated', 'org.plan_changed',
      'report.exported', 'screenshot.deleted', 'timelog.deleted',
      'billing.subscription_created', 'billing.subscription_canceled',
      'settings.updated',
    ],
  },
  target: { type: String },
  targetType: { type: String },
  details: { type: Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
});

auditLogSchema.index({ orgId: 1, timestamp: -1 });

export const AuditLog =
  mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);

export async function logAuditEvent(params: {
  orgId: string; userId: string; action: string;
  target?: string; targetType?: string; details?: any;
  ipAddress?: string; userAgent?: string;
}) {
  await AuditLog.create(params);
}

import mongoose, { Schema, Document } from 'mongoose';

export type ApiKeyScope = 'timelogs:read' | 'projects:read' | 'users:read';

export const API_KEY_SCOPES: ApiKeyScope[] = [
  'timelogs:read',
  'projects:read',
  'users:read',
];

export interface ApiKeyDocument extends Document {
  orgId: mongoose.Types.ObjectId;
  name: string;
  keyPrefix: string;
  keyHash: string;
  scopes: ApiKeyScope[];
  createdBy: mongoose.Types.ObjectId;
  lastUsedAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const apiKeySchema = new Schema<ApiKeyDocument>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    // First 12 chars of the raw key (e.g. `ck_live_ab12`), shown in the UI so
    // admins can tell keys apart without ever storing/displaying the secret.
    keyPrefix: { type: String, required: true },
    keyHash: { type: String, required: true, unique: true, select: false },
    scopes: {
      type: [String],
      enum: API_KEY_SCOPES,
      default: () => [...API_KEY_SCOPES],
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastUsedAt: { type: Date },
    revokedAt: { type: Date },
  },
  { timestamps: true }
);

apiKeySchema.index({ orgId: 1, revokedAt: 1 });

export const ApiKey =
  mongoose.models.ApiKey || mongoose.model<ApiKeyDocument>('ApiKey', apiKeySchema);

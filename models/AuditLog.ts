import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IAuditLog extends Document {
  organisationId: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  timestamp: Date;
  source?: string;
  ipAddress?: string;
  requestId?: string;
}

const auditLogSchema = new Schema<IAuditLog>({
  organisationId: { type: String, required: true, index: true },
  actor: { type: String, required: true },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: String, required: true },
  previousValue: { type: Schema.Types.Mixed },
  newValue: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, required: true },
  source: { type: String },
  ipAddress: { type: String },
  requestId: { type: String },
});

auditLogSchema.index({ organisationId: 1, entityType: 1, entityId: 1 });
auditLogSchema.index({ organisationId: 1, timestamp: -1 });
auditLogSchema.index({ organisationId: 1, actor: 1 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ?? mongoose.model<IAuditLog>("AuditLog", auditLogSchema);

export default AuditLog;

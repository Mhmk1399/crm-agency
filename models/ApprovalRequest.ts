import mongoose, { Schema, type Document, type Model } from "mongoose";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface IApprovalRequest extends Document {
  organisationId: mongoose.Types.ObjectId;
  entityType: string;
  entityId: mongoose.Types.ObjectId;
  requestedBy: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId;
  status: ApprovalStatus;
  decision?: string;
  decidedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const approvalRequestSchema = new Schema<IApprovalRequest>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, required: true, enum: ["pending", "approved", "rejected"], default: "pending" },
    decision: { type: String },
    decidedAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

approvalRequestSchema.index({ organisationId: 1, assignedTo: 1, status: 1 });
approvalRequestSchema.index({ organisationId: 1, entityType: 1, entityId: 1 });

const ApprovalRequest: Model<IApprovalRequest> =
  mongoose.models.ApprovalRequest ?? mongoose.model<IApprovalRequest>("ApprovalRequest", approvalRequestSchema);

export default ApprovalRequest;

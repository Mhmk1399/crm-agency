import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IFinancialSnapshot extends Document {
  organisationId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  period: string;
  type: "monthly" | "project" | "quarterly" | "yearly";
  revenue: number;
  directCost: number;
  grossProfit: number;
  grossMarginPercentage: number;
  overhead: number;
  netProfit: number;
  invoicedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  snapshotDate: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const financialSnapshotSchema = new Schema<IFinancialSnapshot>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    period: { type: String, required: true },
    type: { type: String, required: true, enum: ["monthly", "project", "quarterly", "yearly"] },
    revenue: { type: Number, default: 0 },
    directCost: { type: Number, default: 0 },
    grossProfit: { type: Number, default: 0 },
    grossMarginPercentage: { type: Number, default: 0 },
    overhead: { type: Number, default: 0 },
    netProfit: { type: Number, default: 0 },
    invoicedAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    outstandingAmount: { type: Number, default: 0 },
    snapshotDate: { type: Date, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

financialSnapshotSchema.index({ organisationId: 1, type: 1, period: 1 });
financialSnapshotSchema.index({ organisationId: 1, projectId: 1 });

const FinancialSnapshot: Model<IFinancialSnapshot> =
  mongoose.models.FinancialSnapshot ?? mongoose.model<IFinancialSnapshot>("FinancialSnapshot", financialSnapshotSchema);

export default FinancialSnapshot;

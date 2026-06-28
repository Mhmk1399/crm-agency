import mongoose, { Schema, type Document, type Model } from "mongoose";

export type ProposalStatus = "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired" | "cancelled";

export interface IProposalItem {
  serviceId?: mongoose.Types.ObjectId;
  packageId?: mongoose.Types.ObjectId;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  estimatedHours: number;
}

export interface IProposal extends Document {
  organisationId: mongoose.Types.ObjectId;
  leadId?: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId;
  proposalNumber: string;
  title: string;
  description?: string;
  items: IProposalItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  expectedCost: number;
  expectedProfit: number;
  expectedMarginPercentage: number;
  status: ProposalStatus;
  validUntil?: Date;
  sentAt?: Date;
  viewedAt?: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const proposalItemSchema = new Schema<IProposalItem>(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: "Service" },
    packageId: { type: Schema.Types.ObjectId, ref: "ServicePackage" },
    description: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    estimatedHours: { type: Number, default: 0 },
  },
  { _id: false }
);

const proposalSchema = new Schema<IProposal>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true },
    leadId: { type: Schema.Types.ObjectId, ref: "Lead" },
    clientId: { type: Schema.Types.ObjectId, ref: "Client" },
    proposalNumber: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    items: [proposalItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 },
    expectedCost: { type: Number, default: 0 },
    expectedProfit: { type: Number, default: 0 },
    expectedMarginPercentage: { type: Number, default: 0 },
    status: { type: String, required: true, enum: ["draft", "sent", "viewed", "accepted", "rejected", "expired", "cancelled"], default: "draft" },
    validUntil: { type: Date },
    sentAt: { type: Date },
    viewedAt: { type: Date },
    acceptedAt: { type: Date },
    rejectedAt: { type: Date },
    rejectionReason: { type: String },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

proposalSchema.index({ organisationId: 1, proposalNumber: 1 }, { unique: true });
proposalSchema.index({ organisationId: 1, status: 1 });
proposalSchema.index({ organisationId: 1, leadId: 1 });

const Proposal: Model<IProposal> =
  mongoose.models.Proposal ?? mongoose.model<IProposal>("Proposal", proposalSchema);

export default Proposal;

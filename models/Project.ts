import mongoose, { Schema, type Document, type Model } from "mongoose";

export type ProjectStatus = "planned" | "active" | "on_hold" | "client_review" | "completed" | "cancelled";
export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface IProject extends Document {
  organisationId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  proposalId?: mongoose.Types.ObjectId;
  serviceIds: mongoose.Types.ObjectId[];
  name: string;
  projectCode: string;
  description?: string;
  ownerId: mongoose.Types.ObjectId;
  projectManagerId: mongoose.Types.ObjectId;
  status: ProjectStatus;
  startDate?: Date;
  deadline?: Date;
  completedAt?: Date;
  contractValue: number;
  budgetedCost: number;
  estimatedHours: number;
  actualHours: number;
  expectedProfit: number;
  actualCost: number;
  actualProfit: number;
  expectedMarginPercentage: number;
  actualMarginPercentage: number;
  healthScore: number;
  riskLevel: RiskLevel;
  progressPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client" },
    proposalId: { type: Schema.Types.ObjectId, ref: "Proposal" },
    serviceIds: [{ type: Schema.Types.ObjectId, ref: "Service" }],
    name: { type: String, required: true, trim: true },
    projectCode: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    projectManagerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, required: true, enum: ["planned", "active", "on_hold", "client_review", "completed", "cancelled"], default: "planned" },
    startDate: { type: Date },
    deadline: { type: Date },
    completedAt: { type: Date },
    contractValue: { type: Number, default: 0 },
    budgetedCost: { type: Number, default: 0 },
    estimatedHours: { type: Number, default: 0 },
    actualHours: { type: Number, default: 0 },
    expectedProfit: { type: Number, default: 0 },
    actualCost: { type: Number, default: 0 },
    actualProfit: { type: Number, default: 0 },
    expectedMarginPercentage: { type: Number, default: 0 },
    actualMarginPercentage: { type: Number, default: 0 },
    healthScore: { type: Number, default: 100 },
    riskLevel: { type: String, enum: ["low", "medium", "high", "critical"], default: "low" },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

projectSchema.index({ organisationId: 1, projectCode: 1 }, { unique: true });
projectSchema.index({ organisationId: 1, status: 1 });
projectSchema.index({ organisationId: 1, clientId: 1 });
projectSchema.index({ organisationId: 1, projectManagerId: 1 });

if (mongoose.models.Project) {
  delete (mongoose.models as Record<string, unknown>).Project;
}
const Project: Model<IProject> = mongoose.model<IProject>("Project", projectSchema);

export default Project;

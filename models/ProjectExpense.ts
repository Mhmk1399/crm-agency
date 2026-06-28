import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IProjectExpense extends Document {
  organisationId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  description: string;
  category: string;
  currency: "IRR" | "USD" | "GBP";
  amount: number;
  date: Date;
  receipt?: string;
  isApproved: boolean;
  approvedBy?: mongoose.Types.ObjectId;
  submittedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const projectExpenseSchema = new Schema<IProjectExpense>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    currency: { type: String, required: true, enum: ["IRR", "USD", "GBP"], default: "IRR" },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    receipt: { type: String },
    isApproved: { type: Boolean, default: false },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    submittedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

projectExpenseSchema.index({ organisationId: 1, projectId: 1 });

const ProjectExpense: Model<IProjectExpense> =
  mongoose.models.ProjectExpense ?? mongoose.model<IProjectExpense>("ProjectExpense", projectExpenseSchema);

export default ProjectExpense;

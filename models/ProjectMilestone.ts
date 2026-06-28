import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IProjectMilestone extends Document {
  organisationId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  dueDate: Date;
  completedAt?: Date;
  isCompleted: boolean;
  order: number;
  invoiceOnCompletion: boolean;
  invoiceAmount: number;
}

const projectMilestoneSchema = new Schema<IProjectMilestone>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    dueDate: { type: Date, required: true },
    completedAt: { type: Date },
    isCompleted: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    invoiceOnCompletion: { type: Boolean, default: false },
    invoiceAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

projectMilestoneSchema.index({ organisationId: 1, projectId: 1 });

const ProjectMilestone: Model<IProjectMilestone> =
  mongoose.models.ProjectMilestone ?? mongoose.model<IProjectMilestone>("ProjectMilestone", projectMilestoneSchema);

export default ProjectMilestone;

import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IProjectMember extends Document {
  organisationId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: string;
  billingRateSnapshot: number;
  hourlyCostSnapshot: number;
  allocatedHours: number;
  joinedAt: Date;
  leftAt?: Date;
  isActive: boolean;
}

const projectMemberSchema = new Schema<IProjectMember>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, required: true },
    billingRateSnapshot: { type: Number, default: 0 },
    hourlyCostSnapshot: { type: Number, default: 0 },
    allocatedHours: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

projectMemberSchema.index({ organisationId: 1, projectId: 1, userId: 1 }, { unique: true });

const ProjectMember: Model<IProjectMember> =
  mongoose.models.ProjectMember ?? mongoose.model<IProjectMember>("ProjectMember", projectMemberSchema);

export default ProjectMember;

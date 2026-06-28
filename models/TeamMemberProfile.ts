import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ITeamMemberProfile extends Document {
  organisationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  department: string;
  skills: string[];
  startDate: Date;
  endDate?: Date;
  employmentType: "full_time" | "part_time" | "contractor";
  weeklyCapacityHours: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const teamMemberProfileSchema = new Schema<ITeamMemberProfile>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    skills: [{ type: String, trim: true }],
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    employmentType: { type: String, enum: ["full_time", "part_time", "contractor"], default: "full_time" },
    weeklyCapacityHours: { type: Number, default: 44 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

teamMemberProfileSchema.index({ organisationId: 1, userId: 1 }, { unique: true });

const TeamMemberProfile: Model<ITeamMemberProfile> =
  mongoose.models.TeamMemberProfile ?? mongoose.model<ITeamMemberProfile>("TeamMemberProfile", teamMemberProfileSchema);

export default TeamMemberProfile;

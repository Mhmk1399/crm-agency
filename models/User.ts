import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { Role } from "@/lib/permissions";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  avatar?: string;
  organisationId: mongoose.Types.ObjectId;
  role: Role;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    avatar: { type: String },
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true },
    role: {
      type: String,
      required: true,
      enum: ["owner", "admin", "project_manager", "developer", "designer", "sales", "marketing", "finance", "client"],
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ organisationId: 1, email: 1 }, { unique: true });
userSchema.index({ organisationId: 1, role: 1 });
userSchema.index({ email: 1 });

const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", userSchema);

export default User;

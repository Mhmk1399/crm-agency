import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { Role, Permission } from "@/lib/permissions";

export interface IRolePermission extends Document {
  organisationId: mongoose.Types.ObjectId;
  role: Role;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

const rolePermissionSchema = new Schema<IRolePermission>(
  {
    organisationId: {
      type: Schema.Types.ObjectId,
      ref: "Organisation",
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: [
        "owner",
        "admin",
        "project_manager",
        "developer",
        "designer",
        "sales",
        "marketing",
        "finance",
        "client",
      ],
    },
    permissions: [{ type: String, required: true }],
  },
  { timestamps: true }
);

rolePermissionSchema.index({ organisationId: 1, role: 1 }, { unique: true });

const RolePermission: Model<IRolePermission> =
  mongoose.models.RolePermission ??
  mongoose.model<IRolePermission>("RolePermission", rolePermissionSchema);

export default RolePermission;

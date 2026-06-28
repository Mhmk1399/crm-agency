import mongoose, { Schema, type Document, type Model } from "mongoose";

export type PackageTier = "basic" | "standard" | "premium" | "custom";

export interface IServicePackage extends Document {
  organisationId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  name: string;
  tier: PackageTier;
  description: string;
  features: string[];
  price: number;
  estimatedHours: number;
  deliveryDays: number;
  includedRevisions: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const servicePackageSchema = new Schema<IServicePackage>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    name: { type: String, required: true, trim: true },
    tier: { type: String, required: true, enum: ["basic", "standard", "premium", "custom"] },
    description: { type: String, default: "" },
    features: [{ type: String }],
    price: { type: Number, required: true },
    estimatedHours: { type: Number, default: 0 },
    deliveryDays: { type: Number, default: 30 },
    includedRevisions: { type: Number, default: 2 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

servicePackageSchema.index({ organisationId: 1, serviceId: 1, tier: 1 });

const ServicePackage: Model<IServicePackage> =
  mongoose.models.ServicePackage ?? mongoose.model<IServicePackage>("ServicePackage", servicePackageSchema);

export default ServicePackage;

import mongoose, { Schema, type Document, type Model } from "mongoose";

export type PricingType = "fixed" | "hourly" | "retainer" | "milestone";

export interface IService extends Document {
  organisationId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  category: string;
  description: string;
  deliverables: string[];
  excludedWork: string[];
  pricingType: PricingType;
  minimumPrice: number;
  standardPrice: number;
  estimatedMinHours: number;
  estimatedMaxHours: number;
  targetMarginPercentage: number;
  defaultRiskPercentage: number;
  includedRevisions: number;
  deliveryDays: number;
  requiredRoles: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    deliverables: [{ type: String }],
    excludedWork: [{ type: String }],
    pricingType: { type: String, required: true, enum: ["fixed", "hourly", "retainer", "milestone"], default: "fixed" },
    minimumPrice: { type: Number, default: 0 },
    standardPrice: { type: Number, default: 0 },
    estimatedMinHours: { type: Number, default: 0 },
    estimatedMaxHours: { type: Number, default: 0 },
    targetMarginPercentage: { type: Number, default: 50 },
    defaultRiskPercentage: { type: Number, default: 20 },
    includedRevisions: { type: Number, default: 2 },
    deliveryDays: { type: Number, default: 30 },
    requiredRoles: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

serviceSchema.index({ organisationId: 1, slug: 1 }, { unique: true });
serviceSchema.index({ organisationId: 1, category: 1 });

const Service: Model<IService> =
  mongoose.models.Service ?? mongoose.model<IService>("Service", serviceSchema);

export default Service;

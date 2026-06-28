import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ICompensationProfile extends Document {
  organisationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  salary: number;
  employerCosts: number;
  softwareAllocation: number;
  equipmentAllocation: number;
  officeAllocation: number;
  managementAllocation: number;
  otherOverhead: number;
  fullyLoadedMonthlyCost: number;
  realisticBillableHours: number;
  internalHourlyCost: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const compensationProfileSchema = new Schema<ICompensationProfile>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    salary: { type: Number, required: true },
    employerCosts: { type: Number, default: 0 },
    softwareAllocation: { type: Number, default: 0 },
    equipmentAllocation: { type: Number, default: 0 },
    officeAllocation: { type: Number, default: 0 },
    managementAllocation: { type: Number, default: 0 },
    otherOverhead: { type: Number, default: 0 },
    fullyLoadedMonthlyCost: { type: Number, required: true },
    realisticBillableHours: { type: Number, required: true },
    internalHourlyCost: { type: Number, required: true },
    effectiveFrom: { type: Date, required: true },
    effectiveTo: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

compensationProfileSchema.index({ organisationId: 1, userId: 1, effectiveFrom: -1 });

const CompensationProfile: Model<ICompensationProfile> =
  mongoose.models.CompensationProfile ?? mongoose.model<ICompensationProfile>("CompensationProfile", compensationProfileSchema);

export default CompensationProfile;

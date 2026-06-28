import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IOrganisation extends Document {
  name: string;
  slug: string;
  domain?: string;
  logo?: string;
  ownerId: mongoose.Types.ObjectId;
  settings: {
    currency: string;
    timezone: string;
    capacitySplit: {
      delivery: number;
      salesMarketing: number;
      internal: number;
      buffer: number;
    };
    defaultWorkingHoursPerWeek: number;
    defaultBillablePercentage: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const organisationSchema = new Schema<IOrganisation>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    domain: { type: String, trim: true },
    logo: { type: String },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    settings: {
      currency: { type: String, default: "IRR" },
      timezone: { type: String, default: "Asia/Tehran" },
      capacitySplit: {
        delivery: { type: Number, default: 70 },
        salesMarketing: { type: Number, default: 15 },
        internal: { type: Number, default: 10 },
        buffer: { type: Number, default: 5 },
      },
      defaultWorkingHoursPerWeek: { type: Number, default: 44 },
      defaultBillablePercentage: { type: Number, default: 75 },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

organisationSchema.index({ slug: 1 }, { unique: true });

const Organisation: Model<IOrganisation> =
  mongoose.models.Organisation ?? mongoose.model<IOrganisation>("Organisation", organisationSchema);

export default Organisation;

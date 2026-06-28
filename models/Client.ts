import mongoose, { Schema, type Document, type Model } from "mongoose";
import { LeadSource } from "./Lead";

export interface IClient extends Document {
  organisationId: mongoose.Types.ObjectId;
  leadId?: mongoose.Types.ObjectId;
  name: string;
  companyName: string;
  email: string;
  phoneNumber?: string;
  website?: string;
  address?: string;
  billingAddress?: string;
  taxId?: string;
  contactPerson: string;
  notes?: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  source: LeadSource;
  
}

const clientSchema = new Schema<IClient>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true },
    leadId: { type: Schema.Types.ObjectId, ref: "Lead" },
    name: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phoneNumber: { type: String, trim: true },
    website: { type: String, trim: true },
    address: { type: String },
    billingAddress: { type: String },
    taxId: { type: String },
    contactPerson: { type: String, required: true, trim: true },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    source: { type: String, required: true, enum: ["website", "referral", "linkedin", "cold_outreach", "event", "advertisement", "other"] },
  },
  { timestamps: true }
);

const Client: Model<IClient> =
  mongoose.models.Client ?? mongoose.model<IClient>("Client", clientSchema);

export default Client;

import mongoose, { Schema, type Document, type Model } from "mongoose";

export type LeadStatus = "new" | "contacted" | "qualified" | "proposal_sent" | "negotiation" | "won" | "lost";
export type LeadSource = "website" | "referral" | "linkedin" | "cold_outreach" | "event" | "advertisement" | "other";

export interface ILead extends Document {
  organisationId: mongoose.Types.ObjectId;
  name: string;
  companyName: string;
  email: string;
  phoneNumber?: string;
  website?: string;
  source: LeadSource;
  status: LeadStatus;
  ownerId: mongoose.Types.ObjectId;
  estimatedValue: number;
  probability: number;
  expectedCloseDate?: Date;
  nextFollowUpAt?: Date;
  lostReason?: string;
  tags: string[];
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true },
    name: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phoneNumber: { type: String, trim: true },
    website: { type: String, trim: true },
    source: { type: String, required: true, enum: ["website", "referral", "linkedin", "cold_outreach", "event", "advertisement", "other"] },
    status: { type: String, required: true, enum: ["new", "contacted", "qualified", "proposal_sent", "negotiation", "won", "lost"], default: "new" },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    estimatedValue: { type: Number, default: 0 },
    probability: { type: Number, default: 0, min: 0, max: 100 },
    expectedCloseDate: { type: Date },
    nextFollowUpAt: { type: Date },
    lostReason: { type: String },
    tags: [{ type: String, trim: true }],
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

leadSchema.index({ organisationId: 1, status: 1 });
leadSchema.index({ organisationId: 1, ownerId: 1, status: 1 });
leadSchema.index({ organisationId: 1, nextFollowUpAt: 1 });
leadSchema.index({ organisationId: 1, email: 1 });

const Lead: Model<ILead> =
  mongoose.models.Lead ?? mongoose.model<ILead>("Lead", leadSchema);

export default Lead;

import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IPayment extends Document {
  organisationId: mongoose.Types.ObjectId;
  invoiceId: mongoose.Types.ObjectId;
  currency: "IRR" | "USD" | "GBP";
  amount: number;
  method: string;
  reference?: string;
  paidAt: Date;
  notes?: string;
  recordedBy: mongoose.Types.ObjectId;
  idempotencyKey: string;
  createdAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", required: true },
    currency: { type: String, required: true, enum: ["IRR", "USD", "GBP"], default: "IRR" },
    amount: { type: Number, required: true },
    method: { type: String, required: true },
    reference: { type: String },
    paidAt: { type: Date, required: true },
    notes: { type: String },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    idempotencyKey: { type: String, default: () => `pay_${Date.now()}_${Math.random().toString(36).slice(2)}` },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

paymentSchema.index({ organisationId: 1, invoiceId: 1 });
paymentSchema.index({ organisationId: 1, idempotencyKey: 1 }, { unique: true });

if (mongoose.models.Payment) {
  delete (mongoose.models as Record<string, unknown>).Payment;
}
const Payment: Model<IPayment> = mongoose.model<IPayment>("Payment", paymentSchema);

export default Payment;

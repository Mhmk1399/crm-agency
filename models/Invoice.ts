import mongoose, { Schema, type Document, type Model } from "mongoose";

export type InvoiceStatus = "draft" | "sent" | "partially_paid" | "paid" | "overdue" | "cancelled";

export interface IInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IInvoice extends Document {
  organisationId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  milestoneId?: mongoose.Types.ObjectId;
  invoiceNumber: string;
  currency: "IRR" | "USD" | "GBP";
  items: IInvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  outstandingAmount: number;
  status: InvoiceStatus;
  issuedDate: Date;
  dueDate: Date;
  paidAt?: Date;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceItemSchema = new Schema<IInvoiceItem>(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
  },
  { _id: false }
);

const invoiceSchema = new Schema<IInvoice>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    clientId: { type: Schema.Types.ObjectId, ref: "Client" },
    milestoneId: { type: Schema.Types.ObjectId, ref: "ProjectMilestone" },
    invoiceNumber: { type: String, required: true },
    currency: { type: String, required: true, enum: ["IRR", "USD", "GBP"], default: "IRR" },
    items: [invoiceItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 },
    paidAmount: { type: Number, default: 0 },
    outstandingAmount: { type: Number, default: 0 },
    status: { type: String, required: true, enum: ["draft", "sent", "partially_paid", "paid", "overdue", "cancelled"], default: "draft" },
    issuedDate: { type: Date, default: Date.now },
    dueDate: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    paidAt: { type: Date },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

invoiceSchema.index({ organisationId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ organisationId: 1, status: 1 });
invoiceSchema.index({ organisationId: 1, clientId: 1 });
invoiceSchema.index({ organisationId: 1, dueDate: 1, status: 1 });

if (mongoose.models.Invoice) {
  delete (mongoose.models as Record<string, unknown>).Invoice;
}
const Invoice: Model<IInvoice> = mongoose.model<IInvoice>("Invoice", invoiceSchema);

export default Invoice;

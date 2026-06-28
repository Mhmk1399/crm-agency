import mongoose, { Schema, type Document, type Model } from "mongoose";

export type OpExpenseCategory = "rent" | "electricity" | "internet" | "salary" | "insurance" | "software_subscription" | "equipment" | "office_supplies" | "tax" | "other";

export interface IOperationalExpense extends Document {
  organisationId: mongoose.Types.ObjectId;
  description: string;
  category: OpExpenseCategory;
  currency: "IRR" | "USD" | "GBP";
  amount: number;
  date: Date;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const operationalExpenseSchema = new Schema<IOperationalExpense>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: ["rent", "electricity", "internet", "salary", "insurance", "software_subscription", "equipment", "office_supplies", "tax", "other"] },
    currency: { type: String, required: true, enum: ["IRR", "USD", "GBP"], default: "IRR" },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

operationalExpenseSchema.index({ organisationId: 1, date: -1 });
operationalExpenseSchema.index({ organisationId: 1, category: 1 });

const OperationalExpense: Model<IOperationalExpense> =
  mongoose.models.OperationalExpense ?? mongoose.model<IOperationalExpense>("OperationalExpense", operationalExpenseSchema);

export default OperationalExpense;

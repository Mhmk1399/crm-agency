import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IBoardColumn {
  _id: mongoose.Types.ObjectId;
  name: string;
  order: number;
  wipLimit: number;
  color?: string;
}

export interface IBoard extends Document {
  organisationId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  name: string;
  columns: IBoardColumn[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const boardColumnSchema = new Schema<IBoardColumn>({
  name: { type: String, required: true, trim: true },
  order: { type: Number, required: true },
  wipLimit: { type: Number, default: 0 },
  color: { type: String },
});

const boardSchema = new Schema<IBoard>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    name: { type: String, required: true, trim: true },
    columns: [boardColumnSchema],
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

boardSchema.index({ organisationId: 1, projectId: 1 });

export const DEFAULT_COLUMNS: Omit<IBoardColumn, "_id">[] = [
  { name: "Backlog", order: 0, wipLimit: 0 },
  { name: "To Do", order: 1, wipLimit: 0 },
  { name: "In Progress", order: 2, wipLimit: 5 },
  { name: "Review", order: 3, wipLimit: 3 },
  { name: "Blocked", order: 4, wipLimit: 0 },
  { name: "Done", order: 5, wipLimit: 0 },
];

const Board: Model<IBoard> =
  mongoose.models.Board ?? mongoose.model<IBoard>("Board", boardSchema);

export default Board;

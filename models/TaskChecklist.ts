import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ITaskChecklistItem extends Document {
  organisationId: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId;
  title: string;
  isCompleted: boolean;
  order: number;
  completedAt?: Date;
  completedBy?: mongoose.Types.ObjectId;
}

const taskChecklistItemSchema = new Schema<ITaskChecklistItem>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true },
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    title: { type: String, required: true, trim: true },
    isCompleted: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    completedAt: { type: Date },
    completedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

taskChecklistItemSchema.index({ organisationId: 1, taskId: 1, order: 1 });

const TaskChecklistItem: Model<ITaskChecklistItem> =
  mongoose.models.TaskChecklistItem ?? mongoose.model<ITaskChecklistItem>("TaskChecklistItem", taskChecklistItemSchema);

export default TaskChecklistItem;

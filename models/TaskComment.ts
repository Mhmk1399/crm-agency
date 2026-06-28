import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ITaskComment extends Document {
  organisationId: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const taskCommentSchema = new Schema<ITaskComment>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true },
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

taskCommentSchema.index({ organisationId: 1, taskId: 1, createdAt: -1 });

const TaskComment: Model<ITaskComment> =
  mongoose.models.TaskComment ?? mongoose.model<ITaskComment>("TaskComment", taskCommentSchema);

export default TaskComment;

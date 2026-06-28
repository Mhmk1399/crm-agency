import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ITaskAttachment extends Document {
  organisationId: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const taskAttachmentSchema = new Schema<ITaskAttachment>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true },
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

taskAttachmentSchema.index({ organisationId: 1, taskId: 1 });

const TaskAttachment: Model<ITaskAttachment> =
  mongoose.models.TaskAttachment ?? mongoose.model<ITaskAttachment>("TaskAttachment", taskAttachmentSchema);

export default TaskAttachment;

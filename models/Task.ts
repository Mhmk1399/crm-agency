import mongoose, { Schema, type Document, type Model } from "mongoose";

export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "blocked" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskType = "original_scope" | "bug" | "client_revision" | "paid_change_request" | "internal_rework" | "marketing" | "sales" | "administrative" | "support";

export interface ITask extends Document {
  organisationId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  boardId: mongoose.Types.ObjectId;
  columnId: mongoose.Types.ObjectId;
  milestoneId?: mongoose.Types.ObjectId;
  parentTaskId?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  assigneeIds: mongoose.Types.ObjectId[];
  reporterId: mongoose.Types.ObjectId;
  reviewerId?: mongoose.Types.ObjectId;
  priority: TaskPriority;
  status: TaskStatus;
  type: TaskType;
  complexityPoints: number;
  estimatedMinutes: number;
  actualMinutes: number;
  internalHourlyCostSnapshot: number;
  estimatedCost: number;
  actualCost: number;
  isBillable: boolean;
  billableValue: number;
  startDate?: Date;
  dueDate?: Date;
  completedAt?: Date;
  dependencyIds: mongoose.Types.ObjectId[];
  tags: string[];
  revisionNumber: number;
  order: number;
  blockedReason?: string;
  blockedBy?: mongoose.Types.ObjectId;
  blockedSince?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    organisationId: { type: Schema.Types.ObjectId, ref: "Organisation", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    boardId: { type: Schema.Types.ObjectId, ref: "Board" },
    columnId: { type: Schema.Types.ObjectId },
    milestoneId: { type: Schema.Types.ObjectId, ref: "ProjectMilestone" },
    parentTaskId: { type: Schema.Types.ObjectId, ref: "Task" },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    assigneeIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: "User" },
    priority: { type: String, required: true, enum: ["low", "medium", "high", "urgent"], default: "medium" },
    status: { type: String, required: true, enum: ["backlog", "todo", "in_progress", "review", "blocked", "done"], default: "backlog" },
    type: { type: String, required: true, enum: ["original_scope", "bug", "client_revision", "paid_change_request", "internal_rework", "marketing", "sales", "administrative", "support"], default: "original_scope" },
    complexityPoints: { type: Number, default: 0 },
    estimatedMinutes: { type: Number, default: 0 },
    actualMinutes: { type: Number, default: 0 },
    internalHourlyCostSnapshot: { type: Number, default: 0 },
    estimatedCost: { type: Number, default: 0 },
    actualCost: { type: Number, default: 0 },
    isBillable: { type: Boolean, default: true },
    billableValue: { type: Number, default: 0 },
    startDate: { type: Date },
    dueDate: { type: Date },
    completedAt: { type: Date },
    dependencyIds: [{ type: Schema.Types.ObjectId, ref: "Task" }],
    tags: [{ type: String, trim: true }],
    revisionNumber: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
    blockedReason: { type: String },
    blockedBy: { type: Schema.Types.ObjectId, ref: "User" },
    blockedSince: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

taskSchema.index({ organisationId: 1, projectId: 1, status: 1 });
taskSchema.index({ organisationId: 1, boardId: 1, columnId: 1, order: 1 });
taskSchema.index({ organisationId: 1, assigneeIds: 1 });
taskSchema.index({ organisationId: 1, dueDate: 1, status: 1 });

if (mongoose.models.Task) {
  delete (mongoose.models as Record<string, unknown>).Task;
}
const Task: Model<ITask> = mongoose.model<ITask>("Task", taskSchema);

export default Task;

import mongoose, { Document, Schema } from "mongoose";

export interface IApplication extends Document {
  jobId: mongoose.Types.ObjectId;
  seekerId: mongoose.Types.ObjectId;
  recruiterId: mongoose.Types.ObjectId;
  resume: string;
  coverLetter?: string;
  status: "pending" | "reviewing" | "interviewing" | "offered" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    seekerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recruiterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resume: { type: String, required: true }, // URL to resume
    coverLetter: { type: String },
    status: {
      type: String,
      enum: ["pending", "reviewing", "interviewing", "offered", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Prevent applying to the same job twice
applicationSchema.index({ jobId: 1, seekerId: 1 }, { unique: true });

export default mongoose.model<IApplication>("Application", applicationSchema);

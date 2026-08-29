import mongoose, { Document, Schema } from "mongoose";

export interface IJob extends Document {
  title: string;
  description: string;
  company: {
    id?: mongoose.Types.ObjectId;
    name: string;
    logo?: string;
  };
  recruiterId: mongoose.Types.ObjectId;
  category: string;
  type: "Full-time" | "Part-time" | "Contract" | "Internship" | "Freelance";
  workMode: "On-site" | "Remote" | "Hybrid";
  location: string;
  salary: {
    min?: number;
    max?: number;
    currency?: string;
    isNegotiable?: boolean;
  };
  experienceLevel: "Entry Level" | "Mid Level" | "Senior" | "Lead" | "Executive";
  skills: string[];
  requirements: string[];
  benefits: string[];
  applicantsCount: number;
  status: "active" | "expired" | "draft";
  featured?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },

    // Embedded company info for fast performance, plus a ref to the full profile
    company: {
      id: { type: Schema.Types.ObjectId, ref: "Company" },
      name: { type: String, required: true },
      logo: { type: String },
    },

    recruiterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    category: { type: String, required: true }, // e.g. "Design", "Engineering"

    type: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship", "Freelance"],
      default: "Full-time",
    },

    workMode: {
      type: String,
      enum: ["On-site", "Remote", "Hybrid"],
      required: true,
    },

    location: { type: String, required: true },

    salary: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: "USD" },
      isNegotiable: { type: Boolean, default: false },
    },

    experienceLevel: {
      type: String,
      enum: ["Entry Level", "Mid Level", "Senior", "Lead", "Executive"],
      required: true,
    },

    skills: [{ type: String }], // Array of strings for tags
    requirements: [{ type: String }], // Bullet points
    benefits: [{ type: String }], // Bullet points

    applicantsCount: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["active", "expired", "draft"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IJob>("Job", jobSchema);

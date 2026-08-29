import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  role: "seeker" | "recruiter";
  location?: string;
  bio?: string;
  avatar?: string;
  resume?: string;
  skills?: string[];
  companyName?: string;
  companyWebsite?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["seeker", "recruiter"], default: "seeker" },
    location: String,
    bio: String,
    avatar: String,
    // Seeker specific
    resume: String,
    skills: [String],
    // Recruiter specific
    companyName: String,
    companyWebsite: String,
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);

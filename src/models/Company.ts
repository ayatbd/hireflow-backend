import mongoose, { Document, Schema } from "mongoose";

export interface ICompany extends Document {
  name: string;
  logo?: string;
  website?: string;
  location: string;
  industry: string;
  description?: string;
  ownerId: mongoose.Types.ObjectId;
  admins: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, unique: true },
    logo: { type: String }, // URL to Cloudinary/S3
    website: { type: String },
    location: { type: String, required: true },
    industry: { type: String, required: true },
    description: { type: String },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    admins: [{ type: Schema.Types.ObjectId, ref: "User" }], // Multiple recruiters can manage one company
  },
  { timestamps: true }
);

export default mongoose.model<ICompany>("Company", companySchema);

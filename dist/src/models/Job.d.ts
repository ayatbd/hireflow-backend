import mongoose, { Document } from "mongoose";
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
declare const _default: mongoose.Model<IJob, {}, {}, {}, mongoose.Document<unknown, {}, IJob, {}, {}> & IJob & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Job.d.ts.map
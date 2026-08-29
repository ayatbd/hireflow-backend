import mongoose, { Document } from "mongoose";
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
declare const _default: mongoose.Model<IApplication, {}, {}, {}, mongoose.Document<unknown, {}, IApplication, {}, {}> & IApplication & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Application.d.ts.map
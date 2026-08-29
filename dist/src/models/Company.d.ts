import mongoose, { Document } from "mongoose";
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
declare const _default: mongoose.Model<ICompany, {}, {}, {}, mongoose.Document<unknown, {}, ICompany, {}, {}> & ICompany & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Company.d.ts.map
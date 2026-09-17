import mongoose, { Schema, Document } from "mongoose";
import { string } from "zod";

export interface ISession extends Document {
    userId: mongoose.Types.ObjectId;
    tokenId: string;
    familyId: string;
    issuedAt: Date;
    expiresAt: Date;
    revokedAt: Date;
    userAgent: string;
}

const sessionSchema = new Schema<ISession>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    
 },
 tokenId: {
    type: String,
    required: true,
    unique: true,
    index: true,
 },
 familyId: {
    type: String,
    required: true,
    index: true,
 },
 issuedAt: {
    type: Date,
    required: true,
 },
 expiresAt: {
    type: Date,
    required: true,
 },
 revokedAt: {
    type: Date,
 },
 userAgent: {
    type: String,
 },

}, 
{
    timestamps: false
}
);

const session = mongoose.model<ISession>("Session", sessionSchema);

export default session;
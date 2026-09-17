import mongoose, { Schema,Document } from "mongoose";

export interface IUser extends Document {
    
    phone: string;
    countryCode: string;
    email: string;
    passwordHash: string;
    avatarKey?: string;
    name: string;
    address?: string;
    dateOfBirth?: Date;
    status: "active" | "deleted";
    deletedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>({

    phone: {
        type: String,
        required: true,
    },
    
    countryCode: {
        type: String,
        required: true,
    },

    email: {
        type: String,
        required: true,
    },

    passwordHash: {
        type: String,
        required: true,
    },

    avatarKey: {
        type: String,
    },

    name: {
        type: String,
        required: true,
    },

    address: {
        type: String,
    },

    dateOfBirth: {
        type: Date,
    },

    status: {
        type: String,
        enum: ["active", "deleted"],
        default: "active", 
    },

    deletedAt: {
        type: Date,
    },

    },
    {
        timestamps: true,
    }

);

const User = mongoose.model<IUser>("User", userSchema);

export default User;
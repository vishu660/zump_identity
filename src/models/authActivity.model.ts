import { create } from "domain";
import mongoose, { Schema, Document } from "mongoose";
import { success } from "zod";


export interface IAuthActivity extends Document {
    userId: mongoose.Types.ObjectId;
    event: string;
    success: boolean;
    ipAddress?: string | undefined;
    userAgent?: string;
    createdAt: Date;
}

const authActivitySchema = new Schema<IAuthActivity>({

    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    event: {
        type: String,
        required: true,
    },
    success: {
        type: Boolean,
        required: true,
    },
    ipAddress: {
        type: String,
    },
    userAgent: {
        type: String,
    },

},
{
    timestamps: {
        createdAt:true,
        updatedAt: false,
    }
}
);

authActivitySchema.index({
    userId: 1,
    success: 1,
    event: 1,
    createdAt: -1,
});

const AuthActivity = mongoose.model<IAuthActivity>(
    "authActivity",
    authActivitySchema
);

export default AuthActivity;

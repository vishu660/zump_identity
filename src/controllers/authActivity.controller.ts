import type { Response, Request } from "express";
import mongoose from "mongoose";
import AuthActivity from "../models/authActivity.model.js";

export const getAuthActivity = async (
    req: Request,
    res: Response,
) => {
    try {
        const userId = req.params.id as string;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                error: {
                    code: "INVALID_USER_ID",
                    message: "Invalid user ID",
                    details: {},
                },
            });
        }

        const { event, from, to } = req.query;
        
        const match: Record<string, unknown> ={
            userId: new mongoose.Types.ObjectId(userId),
            success: true,
            event: {
                $in: ["login_password", "login_otp"],
            },
        };

        if (event) {
            if (
                event !== "login_password" && 
                event !== "login_otp"
            ) {
                return res.status(400).json({
                    error: {
                        code: "INVALID_EVENT",
                        message: "Invalid authentication event",
                        details: {},
                    },
                });
            }

            match.event = event;
        }

        if (from || to ) {
            const createdAt: Record<string, Date> = {};

            if (from) {
                const fromDate = new Date(String(from));

                if (Number.isNaN(fromDate.getTime())) {
                    return res.status(400).json({
                        error: {
                            code: "INVALID_FROM_DATE",
                            message: "Invalid from date",
                            details: {},
                        },
                    });
                }

                createdAt.$gte = fromDate;
            }

            if (to) {
                const toDate = new Date(String(to));

                if (Number.isNaN(toDate.getTime())) {
                    return res.status(400).json({
                        error: {
                            code: "INVALID_TO_DATE",
                            message: "Invalid to date",
                            details: {},
                        },
                    });
                }

                createdAt.$lte = toDate;
            }

            match.createdAt = createdAt;
        }

        const result = await AuthActivity.aggregate([
            {
                $match: match,
            },
            {
                $facet: {
                    summary: [
                        {
                            $count: "totalSuccessfulLogins",
                        },
                    ],
                    logins: [
                        {
                            $sort: {
                                createdAt: -1,
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                event: 1,
                                createdAt:1,
                            },
                        },
                    ],
                },
            },
        ]);

        const totalSuccessfulLogins = result[0]?.summary[0]?.totalSuccessfulLogins ?? 0;

        const logins = result[0]?.logins ?? [];

        return res.status(200).json({
            data: {
                totalSuccessfulLogins,
                logins,
            },
        });
    } catch (error) {
        console.log("Get auth activity error:", error);

        return res.status(500).json({
            data: {
                code: "AUTH_ACTIVITY_FETCH_FAILED",
                message: "Unable to fetch authentication history",
                details: {},
            },
        });
    }
};
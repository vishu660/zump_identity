import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AccessTokenPayload {
    userId: string,
}

export interface AuthenticatedRequest extends Request {
    userId?: string,
}

export const authenticate = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
) => {
    const authorization = req.headers.authorization;
    
    if (!authorization?.startsWith("Bearer ")) {
        return res.status(401).json({
             error: {
                code: "UNAUTHORIZED",
                message: "Authentication required",
                details: {},
            },
        });
    }

    const token = authorization.substring(7);

     try {
    const payload = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET!
    ) as AccessTokenPayload;

    req.userId = payload.userId;

    next();
  } catch {
    return res.status(401).json({
      error: {
        code: "INVALID_ACCESS_TOKEN",
        message: "Invalid or expired access token",
        details: {},
      },
    });
  }
};
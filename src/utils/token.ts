import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

interface AccessTokenPayload {
  userId: string;
}

interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  familyId: string;
}

export const generateTokens = (userId: string) => {
  const tokenId = randomUUID();
  const familyId = randomUUID();

  const accessToken = jwt.sign(
    {
      userId,
    } satisfies AccessTokenPayload,
    process.env.JWT_ACCESS_SECRET!,
    {
      expiresIn: "15m",
    }
  );

  const refreshToken = jwt.sign(
    {
      userId,
      tokenId,
      familyId,
    } satisfies RefreshTokenPayload,
    process.env.JWT_REFRESH_SECRET!,
    {
      expiresIn: "7d",
    }
  );

  return {
    accessToken,
    refreshToken,
    tokenId,
    familyId,
  };
};
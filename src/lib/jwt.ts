import jwt from "jsonwebtoken";
import { env } from "./env";

export interface JwtPayload {
  sub: string;   // user id
  email: string;
  role: "admin" | "client";
  provider?: "local" | "google";
}

export const signAccessToken = (payload: JwtPayload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);

export const signRefreshToken = (payload: Pick<JwtPayload, "sub">) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions);

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.JWT_SECRET) as JwtPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as Pick<JwtPayload, "sub">;

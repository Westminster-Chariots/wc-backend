import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { verifyAccessToken, type JwtPayload } from "../lib/jwt";

type AuthEnv = { Variables: { user: JwtPayload } };

export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const cookie = getCookie(c, "access_token");
  const bearer = c.req.header("Authorization")?.replace("Bearer ", "");
  const token = cookie ?? bearer;

  if (!token) return c.json({ error: "Unauthorized" }, 401);

  try {
    c.set("user", verifyAccessToken(token));
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
});

export const requireAdmin = createMiddleware<AuthEnv>(async (c, next) => {
  const cookie = getCookie(c, "access_token");
  const bearer = c.req.header("Authorization")?.replace("Bearer ", "");
  const token = cookie ?? bearer;

  if (!token) return c.json({ error: "Unauthorized" }, 401);

  try {
    const user = verifyAccessToken(token);
    if (user.role !== "admin") return c.json({ error: "Forbidden" }, 403);
    c.set("user", user);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
});

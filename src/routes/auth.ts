import { Hono } from "hono";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "../db";
import { users, userRoles, profiles } from "../db/schema";
import { signAccessToken, signRefreshToken, verifyRefreshToken, verifyAccessToken } from "../lib/jwt";
import { buildPasswordResetHtml } from "../lib/email";
import { requireAuth } from "../middleware/auth";
import { env } from "../lib/env";
import { googleAuthService, GoogleAuthService } from "../services/googleAuth";
import crypto from "crypto";

const auth = new Hono();
const resend = new Resend(env.RESEND_API_KEY);

const COOKIE_OPTS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "Lax" as const,
  path: "/",
};

// POST /api/v1/auth/register
auth.post("/register", async (c) => {
  const body = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
    phone: z.string().optional(),
  }).safeParse(await c.req.json());

  if (!body.success) return c.json({ error: body.error.flatten() }, 400);
  const { email, password, name, phone } = body.data;

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    return c.json({ 
      error: "This email is already registered. Please log in instead.",
      code: "EMAIL_EXISTS"
    }, 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db.insert(users).values({ email, passwordHash }).returning();
  await db.insert(userRoles).values({ userId: user.id, role: "client" });
  
  // Create verification token (use access token but note it in email)
  const verificationToken = signAccessToken({ sub: user.id, email: user.email, role: "client" });
  const verificationUrl = `${env.FRONTEND_URL}/auth/verify-email?token=${verificationToken}`;

  await db.insert(profiles).values({ userId: user.id, displayName: name, email, phone });

  // Send verification email
  const emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:#1a1a1a;padding:28px 32px;text-align:center;">
    <h1 style="margin:0;color:#c8a45e;font-size:22px;letter-spacing:3px;">WESTMINSTER CHARIOTS</h1>
    <p style="margin:6px 0 0;color:#999;font-size:10px;letter-spacing:2px;">Travel in Luxury · Arrive in Style</p>
  </div>
  <div style="padding:36px 32px;">
    <p style="margin:0 0 4px;color:#999;font-size:13px;">Hello ${name},</p>
    <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:26px;font-weight:700;">Verify Your Email</h2>
    <div style="width:50px;height:3px;background:#c8a45e;margin:0 0 24px;border-radius:2px;"></div>
    <p style="margin:0 0 12px;color:#333;font-size:15px;line-height:1.6;">Welcome to Westminster Chariots! Thank you for signing up. Please verify your email address to complete your registration and access your booking.</p>
    <p style="margin:0 0 24px;color:#333;font-size:15px;line-height:1.6;">Click the button below to verify your email. This link expires in 15 minutes.</p>
    <div style="text-align:center;margin:36px 0 16px;">
      <a href="${verificationUrl}" style="display:inline-block;background:#c8a45e;color:#fff;padding:14px 44px;text-decoration:none;border-radius:6px;font-size:15px;font-weight:600;">Verify Email</a>
    </div>
    <p style="margin:24px 0 0;color:#999;font-size:13px;">If you did not create this account, please ignore this email.</p>
  </div>
  <div style="background:#fafafa;padding:24px 32px;text-align:center;border-top:1px solid #eee;">
    <p style="margin:0;color:#999;font-size:11px;">Westminster Chariots · Washington, DC</p>
  </div>
</div></body></html>`;

  try {
    await resend.emails.send({
      from: "Westminster Chariots <no-reply@westminsterchariots.com>",
      to: email,
      subject: "Verify Your Email - Westminster Chariots",
      html: emailHtml,
    });
  } catch (emailError) {
    console.error("Failed to send verification email:", emailError);
    // Still allow registration to proceed, but log the error
  }

  return c.json({ message: "Account created. Check your email to verify and complete registration." }, 201);
});

// POST /api/v1/auth/login
auth.post("/login", async (c) => {
  const body = z.object({
    email: z.string().email(),
    password: z.string(),
  }).safeParse(await c.req.json());

  if (!body.success) return c.json({ error: body.error.flatten() }, 400);
  const { email, password } = body.data;

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) return c.json({ error: "Invalid credentials" }, 401);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return c.json({ error: "Invalid credentials" }, 401);

  const roleRow = await db.query.userRoles.findFirst({ where: eq(userRoles.userId, user.id) });
  const role = roleRow?.role ?? "client";

  const accessToken = signAccessToken({ sub: user.id, email: user.email, role });
  const refreshToken = signRefreshToken({ sub: user.id });

  // Always return tokens in response body (works for both web and mobile)
  return c.json({ 
    accessToken, 
    refreshToken,
    user: { id: user.id, email: user.email, role } 
  });
});

// POST /api/v1/auth/logout
auth.post("/logout", (c) => {
  deleteCookie(c, "access_token", { path: "/" });
  deleteCookie(c, "refresh_token", { path: "/" });
  return c.json({ message: "Logged out" });
});

// GET /api/v1/auth/verify-email
auth.get("/verify-email", async (c) => {
  const token = c.req.query("token");
  if (!token) return c.json({ error: "No verification token provided" }, 400);

  try {
    const { sub } = verifyAccessToken(token);
    const user = await db.query.users.findFirst({ where: eq(users.id, sub) });
    if (!user) return c.json({ error: "User not found" }, 404);

    // Email is verified - they can now login
    return c.json({ message: "Email verified successfully. You can now log in.", verified: true });
  } catch {
    return c.json({ error: "Invalid or expired verification link" }, 401);
  }
});

// POST /api/v1/auth/refresh
auth.post("/refresh", async (c) => {
  const token = getCookie(c, "refresh_token");
  if (!token) return c.json({ error: "No refresh token" }, 401);

  try {
    const { sub } = verifyRefreshToken(token);
    const user = await db.query.users.findFirst({ where: eq(users.id, sub) });
    if (!user) return c.json({ error: "User not found" }, 401);

    const roleRow = await db.query.userRoles.findFirst({ where: eq(userRoles.userId, user.id) });
    const role = roleRow?.role ?? "client";

    const accessToken = signAccessToken({ sub: user.id, email: user.email, role });
    setCookie(c, "access_token", accessToken, { ...COOKIE_OPTS, maxAge: 60 * 15 });

    return c.json({ user: { id: user.id, email: user.email, role } });
  } catch {
    return c.json({ error: "Invalid or expired refresh token" }, 401);
  }
});

// POST /api/v1/auth/forgot-password
auth.post("/forgot-password", async (c) => {
  const body = z.object({ email: z.string().email() }).safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  const user = await db.query.users.findFirst({ where: eq(users.email, body.data.email) });
  // Always return 200 to avoid email enumeration
  if (!user) return c.json({ message: "If that email exists, a reset link has been sent." });

  // Get user's display name from profile
  const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, user.id) });
  const displayName = profile?.displayName || user.email.split("@")[0];

  // Sign a short-lived reset token
  const resetToken = signAccessToken({ sub: user.id, email: user.email, role: "client" });
  const resetUrl = `${env.FRONTEND_URL}/reset-password#token=${resetToken}`;

  try {
    await resend.emails.send({
      from: "Westminster Chariots <no-reply@westminsterchariots.com>",
      to: user.email,
      subject: "Reset Your Password - Westminster Chariots",
      html: buildPasswordResetHtml(displayName, resetUrl),
    });
  } catch (emailError) {
    console.error("Failed to send password reset email:", emailError);
    // Still return success to avoid email enumeration
  }

  return c.json({ message: "If that email exists, a reset link has been sent." });
});

// POST /api/v1/auth/reset-password
auth.post("/reset-password", async (c) => {
  const body = z.object({
    token: z.string(),
    password: z.string().min(6),
  }).safeParse(await c.req.json());

  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  try {
    const { sub } = verifyAccessToken(body.data.token);
    const passwordHash = await bcrypt.hash(body.data.password, 12);
    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, sub));
    return c.json({ message: "Password updated. You can now sign in." });
  } catch {
    return c.json({ error: "Invalid or expired reset token" }, 401);
  }
});

// GET /api/v1/auth/me
auth.get("/me", requireAuth, async (c) => {
  const { sub } = c.get("user");
  const user = await db.query.users.findFirst({ where: eq(users.id, sub) });
  if (!user) return c.json({ error: "User not found" }, 404);

  const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, sub) });
  const roleRow = await db.query.userRoles.findFirst({ where: eq(userRoles.userId, sub) });

  return c.json({
    id: user.id,
    email: user.email,
    role: roleRow?.role ?? "client",
    profile,
  });
});

// PATCH /api/v1/auth/profile
auth.patch("/profile", requireAuth, async (c) => {
  const { sub } = c.get("user");
  
  const body = z.object({
    displayName: z.string().min(1).optional(),
    phone: z.string().optional(),
  }).safeParse(await c.req.json());

  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  const updateData: any = { updatedAt: new Date() };
  if (body.data.displayName !== undefined) updateData.displayName = body.data.displayName;
  if (body.data.phone !== undefined) updateData.phone = body.data.phone;

  await db.update(profiles).set(updateData).where(eq(profiles.userId, sub));

  return c.json({ message: "Profile updated successfully" });
});

// POST /api/v1/auth/push-token
auth.post("/push-token", requireAuth, async (c) => {
  const { sub } = c.get("user");
  
  const body = z.object({
    token: z.string(),
  }).safeParse(await c.req.json());

  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  // Store push token in user record
  await db.update(users).set({ 
    pushToken: body.data.token,
    updatedAt: new Date() 
  }).where(eq(users.id, sub));

  return c.json({ message: "Push token saved successfully" });
});

// ============================================
// GOOGLE OAUTH ROUTES
// ============================================

// GET /api/v1/auth/google
auth.get("/google", (c) => {
  const state = crypto.randomBytes(32).toString("hex");
  const authUrl = googleAuthService.getAuthUrl(state);
  
  // Store state in cookie for CSRF protection
  // Must be SameSite=None because Google redirects back cross-site
  setCookie(c, "oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  return c.redirect(authUrl);
});

// GET /api/v1/auth/google/callback
auth.get("/google/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const storedState = getCookie(c, "oauth_state");

  if (!code || !state || state !== storedState) {
    return c.json({ error: "Invalid OAuth state" }, 400);
  }

  // Clear state cookie
  deleteCookie(c, "oauth_state", { path: "/" });

  try {
    // Exchange code for tokens
    const tokens = await googleAuthService.exchangeCodeForTokens(code);
    const googleUser = await googleAuthService.getUserInfo(tokens.access_token);

    if (!googleUser.verified_email) {
      return c.json({ error: "Email not verified with Google" }, 400);
    }

    // Check if user exists
    let user = await db.query.users.findFirst({ 
      where: eq(users.email, googleUser.email) 
    });

    if (user) {
      // Update existing user with Google ID if not set
      if (!user.googleId) {
        await db.update(users).set({
          googleId: googleUser.id,
          provider: "google",
          avatarUrl: googleUser.picture,
          updatedAt: new Date(),
        }).where(eq(users.id, user.id));
      }
    } else {
      // Create new user
      const [newUser] = await db.insert(users).values({
        email: googleUser.email,
        googleId: googleUser.id,
        provider: "google",
        avatarUrl: googleUser.picture,
        passwordHash: null,
      }).returning();

      user = newUser;

      // Create user role
      await db.insert(userRoles).values({
        userId: user.id,
        role: "client",
      });

      // Create profile
      await db.insert(profiles).values({
        userId: user.id,
        displayName: googleUser.name,
        email: googleUser.email,
      });
    }

    // Get user role
    const roleRow = await db.query.userRoles.findFirst({ 
      where: eq(userRoles.userId, user.id) 
    });
    const role = roleRow?.role ?? "client";

    // Generate JWT tokens
    const accessToken = signAccessToken({ 
      sub: user.id, 
      email: user.email, 
      role,
      provider: "google"
    });
    const refreshToken = signRefreshToken({ sub: user.id });

    // Store refresh token
    await db.update(users).set({ 
      refreshToken,
      updatedAt: new Date() 
    }).where(eq(users.id, user.id));

    const redirectUrl = `${env.FRONTEND_URL}/auth/callback?access_token=${accessToken}&refresh_token=${refreshToken}`;
    return c.redirect(redirectUrl);
  } catch (error) {
    console.error("Google OAuth error:", error);
    return c.json({ error: "Authentication failed", detail: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// POST /api/v1/auth/google/mobile
auth.post("/google/mobile", async (c) => {
  const body = z.object({
    idToken: z.string(),
    clientId: z.string(),
  }).safeParse(await c.req.json());

  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  const { idToken, clientId } = body.data;

  // Verify the client ID is one of our registered clients
  const validClientIds = [
    env.GOOGLE_WEB_CLIENT_ID,
    env.GOOGLE_IOS_CLIENT_ID,
    env.GOOGLE_ANDROID_CLIENT_ID,
  ];

  if (!validClientIds.includes(clientId)) {
    return c.json({ error: "Invalid client ID" }, 400);
  }

  try {
    // Verify ID token
    const googleUser = await googleAuthService.verifyIdToken(idToken, clientId);

    if (!googleUser.verified_email) {
      return c.json({ error: "Email not verified with Google" }, 400);
    }

    // Check if user exists
    let user = await db.query.users.findFirst({ 
      where: eq(users.email, googleUser.email) 
    });

    if (user) {
      // Update existing user with Google ID if not set
      if (!user.googleId) {
        await db.update(users).set({
          googleId: googleUser.id,
          provider: "google",
          avatarUrl: googleUser.picture,
          updatedAt: new Date(),
        }).where(eq(users.id, user.id));
      }
    } else {
      // Create new user
      const [newUser] = await db.insert(users).values({
        email: googleUser.email,
        googleId: googleUser.id,
        provider: "google",
        avatarUrl: googleUser.picture,
        passwordHash: null,
      }).returning();

      user = newUser;

      // Create user role
      await db.insert(userRoles).values({
        userId: user.id,
        role: "client",
      });

      // Create profile
      await db.insert(profiles).values({
        userId: user.id,
        displayName: googleUser.name,
        email: googleUser.email,
      });
    }

    // Get user role
    const roleRow = await db.query.userRoles.findFirst({ 
      where: eq(userRoles.userId, user.id) 
    });
    const role = roleRow?.role ?? "client";

    // Generate JWT tokens
    const accessToken = signAccessToken({ 
      sub: user.id, 
      email: user.email, 
      role,
      provider: "google"
    });
    const refreshToken = signRefreshToken({ sub: user.id });

    // Store refresh token
    await db.update(users).set({ 
      refreshToken,
      updatedAt: new Date() 
    }).where(eq(users.id, user.id));

    return c.json({ 
      accessToken, 
      refreshToken,
      user: { 
        id: user.id, 
        email: user.email, 
        role,
        avatarUrl: user.avatarUrl,
        provider: "google"
      } 
    });
  } catch (error) {
    console.error("Google mobile auth error:", error);
    return c.json({ error: "Authentication failed" }, 500);
  }
});

export default auth;

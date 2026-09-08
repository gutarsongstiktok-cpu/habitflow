import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";

function b64url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function sign(value: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

export function createSession(userId: string, secret: string, ttlSeconds = 60 * 60 * 24 * 30) {
  const payload = b64url(JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + ttlSeconds }));
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySession(token: string, secret: string): string | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub?: string; exp?: number };
    if (!data.sub || !data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data.sub;
  } catch {
    return null;
  }
}

export interface AuthRequest extends Request {
  userId?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return res.status(500).json({ error: "SESSION_SECRET is not configured" });

  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
  const userId = verifySession(token, secret);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  req.userId = userId;
  next();
}

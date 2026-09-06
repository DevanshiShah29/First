import { createHmac } from "crypto";
import { NextResponse } from "next/server";
import { clientIp } from "@/server/contact";
import { prisma } from "@/server/prisma";
import { rateLimited as sharedRateLimited } from "@/server/rate-limit";

const VISITOR_COOKIE = "analytics_vid";
const VISITOR_TTL_SEC = 60 * 60 * 24 * 365;
const COLLECT_SCOPE = "analytics-collect";
const COLLECT_WINDOW_MS = 60 * 1000;
const COLLECT_MAX = 30;
const PATH_MAX = 200;
const REFERRER_MAX = 500;
const UA_MAX = 240;
const DEDUPE_MS = 2_000;

const SKIP_PREFIXES = ["/admin", "/api"];

export type AnalyticsSummary = {
  pageViews: number;
  uniqueVisitors: number;
  todayViews: number;
  todayVisitors: number;
};

export type AnalyticsTopPage = {
  path: string;
  views: number;
};

export type AnalyticsDailyPoint = {
  date: string;
  views: number;
  visitors: number;
};

export type AnalyticsVisitorRow = {
  id: string;
  firstSeenAt: string;
  lastSeenAt: string;
  viewCount: number;
  userAgent: string;
  recentPaths: { path: string; createdAt: string }[];
};

export type AnalyticsReport = {
  days: number;
  summary: AnalyticsSummary;
  topPages: AnalyticsTopPage[];
  daily: AnalyticsDailyPoint[];
  recentVisitors: AnalyticsVisitorRow[];
};

/**
 * True when analytics collect is over the per-IP limit.
 * @example await analyticsRateLimited(ip) // false
 */
export async function analyticsRateLimited(ip: string) {
  return sharedRateLimited(COLLECT_SCOPE, ip || "unknown", COLLECT_MAX, COLLECT_WINDOW_MS);
}

/**
 * Normalizes and validates a public page path for analytics.
 * @example normalizeAnalyticsPath("/craft/") // "/craft"
 */
export function normalizeAnalyticsPath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  if (trimmed.length > PATH_MAX) return null;
  if (/[\u0000-\u001f\s]/.test(trimmed)) return null;
  let path = trimmed.split("?")[0]?.split("#")[0] ?? "";
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  if (!path.startsWith("/")) return null;
  if (SKIP_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return null;
  }
  return path;
}

/**
 * Truncates an optional referrer URL for storage.
 * @example sanitizeReferrer(ref) // "https://…" | ""
 */
export function sanitizeReferrer(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim().slice(0, REFERRER_MAX);
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.toString().slice(0, REFERRER_MAX);
  } catch {
    return "";
  }
}

/**
 * Truncates User-Agent for CMS display.
 * @example sanitizeUserAgent(ua) // "Mozilla/5.0…"
 */
export function sanitizeUserAgent(raw: string | null): string {
  if (!raw) return "";
  return raw.replace(/[\u0000-\u001f]/g, "").trim().slice(0, UA_MAX);
}

/**
 * HMAC of client IP with CMS/analytics secret (never store raw IP).
 * @example hashIp("1.2.3.4") // "a1b2…"
 */
function hashIp(ip: string): string {
  const key =
    process.env.CMS_SECRET?.trim() ||
    process.env.ANALYTICS_SECRET?.trim() ||
    "dev-analytics";
  return createHmac("sha256", key).update(ip || "unknown").digest("hex").slice(0, 32);
}

/**
 * Reads the analytics visitor id from the request Cookie header.
 * @example readVisitorCookie(req) // "clxy…" | ""
 */
function readVisitorCookie(req: Request) {
  const raw = req.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === VISITOR_COOKIE) {
      return decodeURIComponent(rest.join("=").trim());
    }
  }
  return "";
}

/**
 * Records a page view and returns the Set-Cookie response extras.
 * @example await recordPageView(req, "/craft", "") // { visitorId }
 */
export async function recordPageView(req: Request, path: string, referrer: string) {
  const ip = clientIp(req);
  const existing = readVisitorCookie(req);
  const ua = sanitizeUserAgent(req.headers.get("user-agent"));
  const now = new Date();

  let visitorId = existing;
  let visitor =
    visitorId
      ? await prisma.analyticsVisitor.findUnique({ where: { id: visitorId } })
      : null;

  if (!visitor) {
    visitor = await prisma.analyticsVisitor.create({
      data: {
        ipHash: hashIp(ip),
        userAgent: ua,
        firstSeenAt: now,
        lastSeenAt: now,
      },
    });
    visitorId = visitor.id;
  } else {
    const recent = await prisma.analyticsPageView.findFirst({
      where: { visitorId, path },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (recent && now.getTime() - recent.createdAt.getTime() < DEDUPE_MS) {
      return { visitorId, deduped: true as const };
    }
    await prisma.analyticsVisitor.update({
      where: { id: visitorId },
      data: {
        lastSeenAt: now,
        userAgent: ua || visitor.userAgent,
        ipHash: hashIp(ip) || visitor.ipHash,
      },
    });
  }

  await prisma.analyticsPageView.create({
    data: {
      visitorId,
      path,
      referrer,
      createdAt: now,
    },
  });

  return { visitorId, deduped: false as const };
}

/**
 * Attaches the analytics visitor cookie to a JSON response.
 * @example withVisitorCookie(res, id) // NextResponse
 */
export function withVisitorCookie(res: NextResponse, visitorId: string) {
  res.cookies.set(VISITOR_COOKIE, visitorId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: VISITOR_TTL_SEC,
  });
  return res;
}

/**
 * Start of "today" in UTC for summary counts.
 * @example startOfUtcDay(new Date()) // Date
 */
function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * YYYY-MM-DD in UTC.
 * @example utcDateKey(new Date()) // "2026-09-06"
 */
function utcDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

/**
 * Builds the CMS analytics report for the last N days.
 * @example await getAnalyticsReport(30) // AnalyticsReport
 */
export async function getAnalyticsReport(days = 30): Promise<AnalyticsReport> {
  const safeDays = Math.min(90, Math.max(1, Math.floor(days) || 30));
  const since = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);
  const todayStart = startOfUtcDay(new Date());

  const [pageViews, uniqueVisitors, todayViews, todayVisitorGroups, topGrouped, recentViews, visitors] =
    await Promise.all([
      prisma.analyticsPageView.count({ where: { createdAt: { gte: since } } }),
      prisma.analyticsPageView
        .findMany({
          where: { createdAt: { gte: since } },
          distinct: ["visitorId"],
          select: { visitorId: true },
        })
        .then((rows) => rows.length),
      prisma.analyticsPageView.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.analyticsPageView
        .findMany({
          where: { createdAt: { gte: todayStart } },
          distinct: ["visitorId"],
          select: { visitorId: true },
        })
        .then((rows) => rows.length),
      prisma.analyticsPageView.groupBy({
        by: ["path"],
        where: { createdAt: { gte: since } },
        _count: { path: true },
        orderBy: { _count: { path: "desc" } },
        take: 12,
      }),
      prisma.analyticsPageView.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true, visitorId: true },
      }),
      prisma.analyticsVisitor.findMany({
        where: { lastSeenAt: { gte: since } },
        orderBy: { lastSeenAt: "desc" },
        take: 40,
        include: {
          pageViews: {
            orderBy: { createdAt: "desc" },
            take: 8,
            select: { path: true, createdAt: true },
          },
          _count: { select: { pageViews: true } },
        },
      }),
    ]);

  const dailyMap = new Map<string, { views: number; visitors: Set<string> }>();
  for (let i = safeDays - 1; i >= 0; i--) {
    const d = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000);
    dailyMap.set(utcDateKey(d), { views: 0, visitors: new Set() });
  }
  for (const row of recentViews) {
    const key = utcDateKey(row.createdAt);
    const bucket = dailyMap.get(key);
    if (!bucket) continue;
    bucket.views += 1;
    bucket.visitors.add(row.visitorId);
  }

  return {
    days: safeDays,
    summary: {
      pageViews,
      uniqueVisitors,
      todayViews,
      todayVisitors: todayVisitorGroups,
    },
    topPages: topGrouped.map((row) => ({
      path: row.path,
      views: row._count.path,
    })),
    daily: [...dailyMap.entries()].map(([date, bucket]) => ({
      date,
      views: bucket.views,
      visitors: bucket.visitors.size,
    })),
    recentVisitors: visitors.map((v) => ({
      id: v.id,
      firstSeenAt: v.firstSeenAt.toISOString(),
      lastSeenAt: v.lastSeenAt.toISOString(),
      viewCount: v._count.pageViews,
      userAgent: v.userAgent,
      recentPaths: v.pageViews.map((pv) => ({
        path: pv.path,
        createdAt: pv.createdAt.toISOString(),
      })),
    })),
  };
}

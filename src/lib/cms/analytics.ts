import type { ApiResponse } from "@/lib/api-response";

export type CmsAnalyticsReport = {
  days: number;
  summary: {
    pageViews: number;
    uniqueVisitors: number;
    todayViews: number;
    todayVisitors: number;
  };
  topPages: { path: string; views: number }[];
  daily: { date: string; views: number; visitors: number }[];
  recentVisitors: {
    id: string;
    firstSeenAt: string;
    lastSeenAt: string;
    viewCount: number;
    userAgent: string;
    recentPaths: { path: string; createdAt: string }[];
  }[];
};

/**
 * Load CMS analytics (visitors + page views) for the last N days.
 * @example await fetchCmsAnalytics(30) // { ok: true, data: { report } }
 */
export async function fetchCmsAnalytics(
  days = 30,
): Promise<ApiResponse<{ report: CmsAnalyticsReport }>> {
  try {
    const res = await fetch(`/api/cms/analytics?days=${encodeURIComponent(String(days))}`, {
      method: "GET",
      credentials: "same-origin",
    });
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      report?: CmsAnalyticsReport;
    };
    if (!res.ok || !body.report) {
      return {
        ok: false,
        error: body.error || "Could not load analytics.",
      };
    }
    return { ok: true, data: { report: body.report } };
  } catch {
    return {
      ok: false,
      error: "Could not load analytics. Network error.",
    };
  }
}

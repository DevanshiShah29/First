"use client";

// External dependencies
import { useEffect, useMemo, useState } from "react";

// Application services & types
import { fetchCmsAnalytics, type CmsAnalyticsReport } from "@/lib/cms-client";

// UI components
import { Metabox } from "../components/Metabox";

type RangeDays = 7 | 30 | 90;

type ChartPoint = {
  key: string;
  label: string;
  views: number;
  visitors: number;
};

/**
 * Formats an ISO timestamp for the analytics tables.
 * @example formatWhen("2026-09-06T12:00:00.000Z") // "Sep 6, 12:00"
 */
function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Friendly page title for known public routes.
 * @example pageLabel("/craft") // "Craft"
 */
function pageLabel(path: string) {
  if (path === "/") return "Home";
  const known: Record<string, string> = {
    "/craft": "Craft",
    "/memories": "Memory Jar",
    "/memory-jar": "Memory Jar",
    "/reading": "Reading",
  };
  return known[path] || path;
}

/**
 * Best-effort browser/device hint from User-Agent.
 * @example deviceHint(ua) // "Chrome · macOS"
 */
function deviceHint(ua: string) {
  if (!ua) return "Unknown device";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Safari\//.test(ua)
          ? "Safari"
          : "Browser";
  const os = /iPhone|iPad/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Mac OS X/.test(ua)
        ? "macOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Linux/.test(ua)
            ? "Linux"
            : "device";
  return `${browser} · ${os}`;
}

/**
 * Builds chart buckets — daily for ≤30 days, weekly for 90 days.
 * @example toChartPoints(daily, 30) // ChartPoint[]
 */
function toChartPoints(
  daily: CmsAnalyticsReport["daily"],
  days: number,
): ChartPoint[] {
  if (days <= 30) {
    return daily.map((d) => ({
      key: d.date,
      label: d.date.slice(5),
      views: d.views,
      visitors: d.visitors,
    }));
  }

  const buckets: ChartPoint[] = [];
  for (let i = 0; i < daily.length; i += 7) {
    const slice = daily.slice(i, i + 7);
    if (!slice.length) continue;
    const first = slice[0].date;
    buckets.push({
      key: first,
      label: first.slice(5),
      views: slice.reduce((n, d) => n + d.views, 0),
      visitors: slice.reduce((n, d) => n + d.visitors, 0),
    });
  }
  return buckets;
}

const CHART_TRACK_PX = 140;

/**
 * Renders the CMS analytics overview (visitors + pages).
 * @example <AnalyticsScreen />
 */
export function AnalyticsScreen() {
  const [days, setDays] = useState<RangeDays>(30);
  const [report, setReport] = useState<CmsAnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const range = days;
    void (async () => {
      const result = await fetchCmsAnalytics(range);
      if (cancelled) return;
      if (!result.ok) {
        setReport(null);
        setError(result.error);
        setLoading(false);
        return;
      }
      setReport(result.data.report);
      setError("");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [days, reloadToken]);

  const chartPoints = useMemo(
    () => (report ? toChartPoints(report.daily, report.days) : []),
    [report],
  );

  const maxChartViews = useMemo(() => {
    if (!chartPoints.length) return 1;
    return Math.max(1, ...chartPoints.map((d) => d.views));
  }, [chartPoints]);

  /**
   * Switches the report window and shows the loading state.
   * @example chooseRange(7) // void
   */
  function chooseRange(next: RangeDays) {
    if (next === days) return;
    setLoading(true);
    setDays(next);
  }

  /**
   * Re-fetches the current range.
   * @example refresh() // void
   */
  function refresh() {
    setLoading(true);
    setReloadToken((n) => n + 1);
  }

  return (
    <>
      <h1 className="wp-screen-title">
        Analytics
        <button
          type="button"
          className="wp-btn"
          disabled={loading}
          onClick={refresh}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </h1>
      <p className="wp-sub">
        See which visitors browsed the public site and which pages they opened.
        Visitors are anonymous (no names) unless they identify themselves — for
        example by sending a contact message. Admin pages are not tracked.
      </p>

      <div className="wp-analytics-toolbar" role="group" aria-label="Date range">
        <span className="wp-analytics-toolbar-label">Range</span>
        <div className="wp-analytics-segment">
          {([7, 30, 90] as const).map((n) => (
            <button
              key={n}
              type="button"
              className={days === n ? "is-active" : undefined}
              aria-pressed={days === n}
              disabled={loading && days === n}
              onClick={() => chooseRange(n)}
            >
              Last {n} days
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="wp-notice is-error" role="alert">
          {error}
        </div>
      ) : null}

      {loading && !report ? (
        <p className="wp-sub">Loading analytics…</p>
      ) : null}

      {report ? (
        <div className={`wp-analytics-body${loading ? " is-loading" : ""}`}>
          <div className="wp-analytics-metrics">
            <div className="wp-metric">
              <span className="wp-metric-label">Page views</span>
              <strong className="wp-metric-value">{report.summary.pageViews}</strong>
              <span className="wp-metric-hint">Last {report.days} days</span>
            </div>
            <div className="wp-metric">
              <span className="wp-metric-label">Unique visitors</span>
              <strong className="wp-metric-value">{report.summary.uniqueVisitors}</strong>
              <span className="wp-metric-hint">Anonymous browser sessions</span>
            </div>
            <div className="wp-metric">
              <span className="wp-metric-label">Views today</span>
              <strong className="wp-metric-value">{report.summary.todayViews}</strong>
              <span className="wp-metric-hint">UTC calendar day</span>
            </div>
            <div className="wp-metric">
              <span className="wp-metric-label">Visitors today</span>
              <strong className="wp-metric-value">{report.summary.todayVisitors}</strong>
              <span className="wp-metric-hint">UTC calendar day</span>
            </div>
          </div>

          <Metabox
            id="analytics_daily"
            title="Activity"
            badge={days <= 30 ? "Daily" : "Weekly"}
          >
            {chartPoints.every((d) => d.views === 0) ? (
              <p className="wp-sub" style={{ marginBottom: 0 }}>
                No page views in this range yet. Open the public site in another
                tab to generate data.
              </p>
            ) : (
              <div
                className={`wp-analytics-chart${chartPoints.length > 14 ? " is-scrollable" : ""}`}
              >
                <div
                  className="wp-analytics-bars"
                  role="img"
                  aria-label="Page views over time"
                  style={{
                    minWidth:
                      chartPoints.length > 14
                        ? `${chartPoints.length * (days > 30 ? 52 : 36)}px`
                        : undefined,
                  }}
                >
                  {chartPoints.map((d) => {
                    const fillPx =
                      d.views <= 0
                        ? 0
                        : Math.max(
                            8,
                            Math.round((d.views / maxChartViews) * CHART_TRACK_PX),
                          );
                    return (
                      <div
                        key={d.key}
                        className={`wp-analytics-bar${days > 30 ? " is-wide" : ""}`}
                        title={`${d.label}: ${d.views} views, ${d.visitors} visitors`}
                      >
                        <span className="wp-analytics-bar-count">
                          {d.views > 0 ? d.views : ""}
                        </span>
                        <div
                          className="wp-analytics-bar-track"
                          style={{ height: `${CHART_TRACK_PX}px` }}
                        >
                          <div
                            className="wp-analytics-bar-fill"
                            style={{ height: `${fillPx}px` }}
                          />
                        </div>
                        <span className="wp-analytics-bar-label">{d.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Metabox>

          <Metabox
            id="analytics_pages"
            title="Top pages"
            badge={report.topPages.length || undefined}
          >
            {report.topPages.length === 0 ? (
              <p className="wp-sub" style={{ marginBottom: 0 }}>
                No pages recorded yet.
              </p>
            ) : (
              <table className="wp-list-table wp-analytics-compact">
                <thead>
                  <tr>
                    <th scope="col">Page</th>
                    <th scope="col">Path</th>
                    <th scope="col">Views</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topPages.map((row) => (
                    <tr key={row.path}>
                      <td>
                        <strong>{pageLabel(row.path)}</strong>
                      </td>
                      <td>
                        <code className="wp-analytics-path">{row.path}</code>
                      </td>
                      <td>{row.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Metabox>

          <Metabox
            id="analytics_visitors"
            title="Recent visitors"
            badge={report.recentVisitors.length || undefined}
          >
            {report.recentVisitors.length === 0 ? (
              <p className="wp-sub" style={{ marginBottom: 0 }}>
                No visitors in this range yet.
              </p>
            ) : (
              <div className="wp-analytics-table-wrap">
                <table className="wp-list-table">
                  <thead>
                    <tr>
                      <th scope="col">Visitor</th>
                      <th scope="col">Device</th>
                      <th scope="col">Views</th>
                      <th scope="col">Last seen</th>
                      <th scope="col">Pages viewed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.recentVisitors.map((v, index) => (
                      <tr key={v.id}>
                        <td>
                          <strong>Visitor {index + 1}</strong>
                          <div className="wp-row-actions">
                            First seen {formatWhen(v.firstSeenAt)}
                          </div>
                        </td>
                        <td>{deviceHint(v.userAgent)}</td>
                        <td>{v.viewCount}</td>
                        <td>{formatWhen(v.lastSeenAt)}</td>
                        <td>
                          <ul className="wp-analytics-paths">
                            {v.recentPaths.map((pv, i) => (
                              <li key={`${pv.path}-${pv.createdAt}-${i}`}>
                                <span className="wp-analytics-path-name">
                                  {pageLabel(pv.path)}
                                </span>
                                <code className="wp-analytics-path">{pv.path}</code>
                                <span className="wp-analytics-path-when">
                                  {formatWhen(pv.createdAt)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Metabox>

          <p className="wp-sub" style={{ marginTop: 8 }}>
            Real names are not available for anonymous browsing. Google Analytics
            (if configured) also cannot reveal visitor names — only aggregates and
            anonymous client ids. Names appear only when someone submits the
            contact form or otherwise identifies themselves.
          </p>
        </div>
      ) : null}
    </>
  );
}

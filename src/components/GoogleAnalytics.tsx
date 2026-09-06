import Script from "next/script";

/**
 * Reads the public GA4 measurement id from env.
 * @example gaMeasurementId() // "G-XXXX" | ""
 */
export function gaMeasurementId() {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";
}

/**
 * Injects Google Analytics 4 when NEXT_PUBLIC_GA_MEASUREMENT_ID is set.
 * @example <GoogleAnalytics />
 */
export function GoogleAnalytics() {
  const id = gaMeasurementId();
  if (!id) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', ${JSON.stringify(id)}, { anonymize_ip: true });
`}
      </Script>
    </>
  );
}

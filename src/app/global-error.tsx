"use client";

import { useEffect } from "react";

/**
 * Replaces the root layout when it fails, including a CMS load error.
 * @example <GlobalError error={err} retry={retry} />
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "4rem 1.5rem",
          background: "#F7F2E8",
          color: "#1c1917",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <main>
          <p style={{ letterSpacing: "0.14em", textTransform: "uppercase", fontSize: "0.75rem" }}>Error</p>
          <h1 style={{ marginTop: "1rem", fontSize: "2rem", fontWeight: 600 }}>The site didn’t load.</h1>
          <p style={{ marginTop: "0.75rem", maxWidth: "28rem" }}>
            Something went wrong before the page could open. You can try again.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: "2rem",
              border: 0,
              borderRadius: "0.5rem",
              padding: "0.75rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}

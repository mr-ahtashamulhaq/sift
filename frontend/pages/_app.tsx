import "@/styles/globals.css";
import { useEffect } from "react";
import Head from "next/head";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { DemoProvider } from "@/lib/demo";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // #region agent log — H2/H3: backup extension error filter after hydration
    const onError = (ev: ErrorEvent) => {
      const msg = ev.message || "";
      const file = ev.filename || "";
      const isExt =
        msg.includes("addListener") &&
        (file.startsWith("blob:") ||
          file.startsWith("chrome-extension:") ||
          file.startsWith("moz-extension:"));
      if (!isExt) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      fetch("http://127.0.0.1:7942/ingest/ea01c433-7ed9-4b61-a6f1-beb757a05458", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "0f669a" },
        body: JSON.stringify({
          sessionId: "0f669a",
          hypothesisId: "H3",
          location: "_app.tsx:onError",
          message: "extension error caught in app backup",
          data: {
            msg: msg.slice(0, 120),
            file: file.slice(0, 120),
            hasEthereum: typeof (window as Window & { ethereum?: unknown }).ethereum !== "undefined",
          },
          timestamp: Date.now(),
          runId: "pre-fix",
        }),
      }).catch(() => {});
    };
    window.addEventListener("error", onError, true);
    return () => window.removeEventListener("error", onError, true);
    // #endregion
  }, []);

  return (

    <ThemeProvider>

      <Head>

        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

      </Head>

      <AuthProvider>

        <DemoProvider>

          <Component {...pageProps} />

        </DemoProvider>

      </AuthProvider>

    </ThemeProvider>

  );

}


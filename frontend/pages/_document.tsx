import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" data-scroll-behavior="smooth">
      <Head>
        {/* Earliest possible — suppress wallet/ad extension blob errors before other scripts */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            function isExtErr(msg, file) {
              msg = String(msg || '');
              file = String(file || '');
              if (msg.indexOf('addListener') === -1) return false;
              return file.indexOf('blob:') === 0
                || file.indexOf('chrome-extension:') === 0
                || file.indexOf('moz-extension:') === 0;
            }
            function swallow(msg, file) {
              if (!isExtErr(msg, file)) return false;
              if (!window.__sb_ext_warned) {
                window.__sb_ext_warned = true;
                console.warn('[Sift] Ignored a browser-extension script error (addListener on blob URL). Your app is fine — disable wallet/ad extensions on localhost if you want a clean console.');
              }
              return true;
            }
            var prev = window.onerror;
            window.onerror = function(msg, file, line, col, err) {
              if (swallow(msg, file)) return true;
              if (typeof prev === 'function') return prev.apply(this, arguments);
              return false;
            };
            window.addEventListener('error', function(e) {
              if (!isExtErr(e.message, e.filename)) return;
              e.preventDefault();
              e.stopImmediatePropagation();
              swallow(e.message, e.filename);
            }, true);
          })();
        `}} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Sift" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </Head>
      <body>
        {/* Prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('sb_theme') ||
              (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
            document.documentElement.setAttribute('data-theme', t);
          } catch(e) {}
        `}} />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator && '${process.env.NODE_ENV}' === 'production') {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js');
            });
          }
        `}} />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

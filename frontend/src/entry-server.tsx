// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="description" content="Golid — a production-ready Go + SolidJS framework with auth, 70+ components, and Cloud Run deployment." />

          {/* Open Graph / Social Sharing
              NOTE: Update og:url and og:image when custom domain is configured. */}
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Golid" />
          <meta property="og:title" content="Golid — Go + SolidJS Production Framework" />
          <meta property="og:description" content="Auth, 70+ UI components, SSR, real-time SSE, opt-in Redis/OTel/Prometheus, and one-command Cloud Run deployment." />
          <meta property="og:url" content={import.meta.env.VITE_OG_URL || "https://golid.ai"} />

          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Golid — Go + SolidJS Production Framework" />
          <meta name="twitter:description" content="Auth, 70+ UI components, SSR, real-time SSE, and one-command Cloud Run deployment." />

          {/* Favicon - theme-aware (light/dark swap) */}
          <link rel="icon" type="image/svg+xml" href="/images/favicon-light/favicon.svg" id="favicon" />
          <link rel="manifest" href="/images/favicon-light/site.webmanifest" />
          <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
          <meta name="theme-color" content="#0f1923" media="(prefers-color-scheme: dark)" />

          {/* Preconnect to Google Fonts for faster font loading */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />

          {/* Font stylesheets for noscript fallback */}
          <noscript>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Montserrat:wght@400;500;600;700;800;900&family=Nunito:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" />
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />
          </noscript>

          <script>{`
            (function() {
              try {
                var theme = localStorage.getItem('theme');
                var isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (isDark) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
                var fav = document.getElementById('favicon');
                if (fav) fav.href = isDark ? '/images/favicon-dark/favicon.svg' : '/images/favicon-light/favicon.svg';
              } catch (e) {}

              // Async font loading (avoids render-blocking stylesheets)
              var fonts = [
                'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Montserrat:wght@400;500;600;700;800;900&family=Nunito:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap',
                'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap'
              ];
              fonts.forEach(function(href) {
                var link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                document.head.appendChild(link);
              });
            })();
          `}</script>
          {assets}
        </head>
        <body>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));

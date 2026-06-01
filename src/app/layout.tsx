import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import LocaleProvider from "@/components/shared/LocaleProvider";
import ScrollFix from "@/components/shared/ScrollFix";

const iranSans = localFont({
  variable: "--font-vazir",
  src: [
    {
      path: "../../public/fonts/IRANSansWeb_UltraLight.woff2",
      weight: "200",
      style: "normal",
    },
    {
      path: "../../public/fonts/IRANSansWeb_Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/IRANSansWeb.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/IRANSansWeb_Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/IRANSansWeb_Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/IRANSansWeb_Black.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "زرین گلد | خرید و فروش طلای نوین",
  description: "پلتفرم معاملات طلای آنلاین - خرید، فروش و پس‌انداز طلا",
  keywords: ["طلا", "خرید طلا", "فروش طلا", "زرین گلد", "سرمایه‌گذاری طلا", "قیمت طلا"],
  authors: [{ name: "Zarrin Gold" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
    apple: "/icons/icon-192.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#D4AF37",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning className="overflow-fix">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#D4AF37" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="زرین گلد" />
      </head>
      <body className={`${iranSans.variable} ${inter.variable} antialiased bg-background text-foreground`}>
        <ScrollFix />
        <LocaleProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            {children}
            <Toaster />
          </ThemeProvider>
        </LocaleProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if ('serviceWorker' in navigator) {
                  // ALWAYS unregister all service workers first (fixes stuck loading)
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    registrations.forEach(function(reg) {
                      reg.unregister();
                      console.log('[PWA] Unregistered SW:', reg.scope);
                    });
                  });
                  // Clear all caches
                  if (window.caches) {
                    caches.keys().then(function(names) {
                      names.forEach(function(name) { caches.delete(name); });
                    });
                  }
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}

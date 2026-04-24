import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/amanda/theme-provider";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "آماندا کیدز | Amanda Kids - لباس کودک و نوزاد",
  description: "فروشگاه آنلاین لباس کودک و نوزاد آماندا کیدز. بهترین کیفیت با قیمت مناسب. ارسال رایگان برای خریدهای بالای ۵۰۰,۰۰۰ تومان.",
  keywords: ["لباس کودک", "لباس نوزاد", "فروشگاه لباس کودک", "آماندا کیدز", "amanda kids"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        className={`${vazirmatn.variable} antialiased bg-background text-foreground font-[family-name:var(--font-vazirmatn)]`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

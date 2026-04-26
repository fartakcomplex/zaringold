import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "زرین گلد — پلتفرم جامع معاملات طلای هوشمند | Zaringold",
  description:
    "خرید، فروش و سرمایهگذاری طلای دیجیتال با هوش مصنوعی. معاملات لحظهای طلا، کیف پول دوگانه، درگاه پرداخت طلایی و خدمات جامع مالی.",
  keywords: [
    "زرین گلد",
    "طلا",
    "معاملات طلا",
    "سرمایهگذاری طلا",
    "قیمت طلا",
    "فینتک",
    "Zaringold",
    "gold trading",
    "digital gold",
  ],
  authors: [{ name: "Fartak Complex" }],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🪙</text></svg>",
  },
  openGraph: {
    title: "زرین گلد — پلتفرم جامع معاملات طلای هوشمند",
    description:
      "خرید، فروش و سرمایهگذاری طلای دیجیتال با هوش مصنوعی",
    siteName: "Zaringold",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        className={`${vazirmatn.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

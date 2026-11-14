import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ToastProvider } from "@/components/common/Toast";
import { CookieConsent } from "@/components/common/CookieConsent";

// Fonts are bundled locally (no Google Fonts request at build/start)
const body = localFont({ src: "./fonts/work-sans-latin-wght-normal.woff2", variable: "--font-body-src", weight: "100 900", display: "swap" });
const display = localFont({
  src: [
    { path: "./fonts/bricolage-grotesque-latin-600-normal.woff2", weight: "600" },
    { path: "./fonts/bricolage-grotesque-latin-700-normal.woff2", weight: "700" },
    { path: "./fonts/bricolage-grotesque-latin-800-normal.woff2", weight: "800" },
  ],
  variable: "--font-display-src",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Ginnara Cleaning Service London — home & office cleaning",
    template: "%s | Ginnara Cleaning",
  },
  icons: { icon: "/ginnara-logo.webp", apple: "/ginnara-logo.webp" },
  description: "Book vetted, insured home cleaners in minutes. Residential, office, deep, move-in/move-out and special event cleaning in London and across the UK.",
};

export const viewport: Viewport = {
  themeColor: "#1f3f78",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${body.variable} ${display.variable} antialiased`}>
      <body className="min-h-dvh">
        <ToastProvider>
          {children}
          <CookieConsent />
        </ToastProvider>
      </body>
    </html>
  );
}

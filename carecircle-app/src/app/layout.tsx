import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#132A2F",
};

export const metadata: Metadata = {
  title: "CareCircle — Elder Healthcare Platform",
  description: "Elder-Centric Collaborative Healthcare & Medication Management",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CareCircle",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full w-full antialiased`}
    >
      <body className="h-full min-h-screen w-full flex flex-col m-0 p-0 overflow-x-hidden bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}

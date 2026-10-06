import type { Metadata, Viewport } from "next";
import { Google_Sans, Google_Sans_Code, Instrument_Serif } from "next/font/google";
import "./globals.css";

// Body and UI text.
const googleSans = Google_Sans({
  variable: "--font-google-sans",
  subsets: ["latin"],
});

// Headings: a tall, flowing italic serif.
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

// Links and timers.
const googleSansCode = Google_Sans_Code({
  variable: "--font-google-sans-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prayer Live",
  description: "Go live with your prayer and share the link. Anyone can listen.",
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${googleSans.variable} ${googleSansCode.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

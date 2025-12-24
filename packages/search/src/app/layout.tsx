import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/features/search/context/ThemeContext";

export const metadata: Metadata = {
  title: "Wisdom Island - Search",
  description: "A gamified knowledge sharing platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/assets/icon.svg" />
      </head>
      <body className="antialiased m-0 p-0 min-h-screen">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

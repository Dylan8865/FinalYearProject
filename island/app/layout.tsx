import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wisdom Island - Island",
  description: "Build and manage your knowledge island.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased m-0 p-0">
        {children}
      </body>
    </html>
  );
}

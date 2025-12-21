import type { Metadata } from "next";
import "./globals.css";
import "@hackernoon/pixel-icon-library/fonts/iconfont.css";

export const metadata: Metadata = {
  title: "Wisdom Island",
  description: "Build and manage your knowledge island.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/assets/icon.svg" />
      </head>
      <body className="m-0 p-0 antialiased" suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}

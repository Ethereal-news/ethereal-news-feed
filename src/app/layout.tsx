import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ethereal news feed",
  description: "Review tool for Ethereum developer newsletter items",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}

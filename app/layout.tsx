import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kotova SVG Toolbox",
  description:
    "SVG tools for token logos — merge currency × chain, or crop any SVG to a circle.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

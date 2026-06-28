import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "C8L Ruleta - Casino Premium",
  description: "Ruleta Europea de alta gama - Free to Play",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Playfair+Display:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-black overflow-hidden">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "AlphaCode",
  description: "A modern developer interface inspired by Visual Studio Code.",
  icons: {
    icon: [
      {
        url: "/logo_alpha.png",
        sizes: "any",
      },
    ],
    shortcut: "/logo_alpha.png",
    apple: "/logo_alpha.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-code antialiased h-screen overflow-hidden">
        <div className="h-full">{children}</div>
        <Toaster />
      </body>
    </html>
  );
}

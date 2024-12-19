// src/app/layout.tsx
import "./globals.css";
import Header from "./components/Header";
import Script from 'next/script';

export const metadata = {
  title: "Green",
  description: "A decentralized web application",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inconsolata:wght@400;700&display=swap" rel="stylesheet" />
        <Script 
          src="https://s3.tradingview.com/tv.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}

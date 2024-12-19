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

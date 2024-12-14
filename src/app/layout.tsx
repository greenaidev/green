// layout.tsx

import "./globals.css";

export const metadata = {
  title: "Phantom Wallet Integration",
  description: "Connect your Phantom Wallet with ease!",
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

// src/app/layout.tsx
import "./globals.css";
import Header from "./components/Header";

export const metadata = {
  title: "Web3 App",
  description: "A decentralized web application",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}

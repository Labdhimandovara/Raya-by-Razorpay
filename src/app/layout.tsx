import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Raya by Razorpay — Autonomous AI Shopping Agent",
  description: "Next-generation intelligent shopping assistant powered by Razorpay and Google Gemini.",
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
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0C2340]">
        {children}
      </body>
    </html>
  );
}

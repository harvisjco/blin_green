import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://blingreen.harvis-jco.workers.dev";
const title = "블린그린 | 김포·인천 커튼 & 블라인드 맞춤 시공";
const description =
  "김포·인천 방문 상담부터 실측, 맞춤 제작, 설치, 2년 A/S까지. 커튼과 블라인드로 공간에 맞는 빛과 분위기를 제안합니다.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  keywords: ["커튼", "블라인드", "김포 커튼", "인천 커튼", "커튼 시공", "블라인드 시공", "암막커튼", "우드블라인드"],
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "블린그린",
    images: [{ url: "/hero-livingroom.png", width: 1200, height: 800 }],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/hero-livingroom.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

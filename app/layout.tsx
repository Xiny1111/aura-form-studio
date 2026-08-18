import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AURA / FORM — 智能体光晕编辑器",
  description: "改变视频中智能体的形状、光晕颜色与质感，并实时导出。",
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
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

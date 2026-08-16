import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "砺知 · 多学科试卷分析",
  description: "上传试卷与答案，录入错题号，生成个人诊断报告、班级分析、家长话术与答案解析。",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        {/* Applied before paint so the first frame is already in the right theme. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("lizhi-theme");if(t==="light")document.documentElement.setAttribute("data-theme","light")}catch(e){}`,
          }}
        />
        <div className="backdrop" aria-hidden />
        {children}
      </body>
    </html>
  );
}

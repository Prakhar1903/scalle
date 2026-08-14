import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Route 53",
  description: "AWS Route53 Clone",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            const t = localStorage.getItem('theme');
            if (t === 'dark') document.documentElement.dataset.theme = 'dark';
          } catch(e) {}
        ` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

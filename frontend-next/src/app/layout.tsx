import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Providers from './providers';

const headerFont = localFont({
  src: './fonts/header/SceneHeader.otf',
  variable: '--font-header',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'SceneHive', template: '%s | SceneHive' },
  description: '영화 팬을 위한 실시간 토론 공간 — 지금 상영작, 트렌딩 영화, 영화 클럽',
  themeColor: '#04060C',
  openGraph: {
    title: 'SceneHive',
    description: '영화 팬을 위한 실시간 토론 공간',
    type: 'website',
    locale: 'ko_KR',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://image.tmdb.org" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
      </head>
      <body className={`${headerFont.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

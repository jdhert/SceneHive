import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

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
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

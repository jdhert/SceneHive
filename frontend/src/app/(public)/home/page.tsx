'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/providers/user-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import UserMenu from '@/components/layout/user-menu';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
    >
      {/* Header */}
      <header
        className="border-b border-white/10"
        style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="text-2xl">💻</span>
            </div>
            <h1 className="text-xl font-bold text-white">DevCollab</h1>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Button
                  onClick={() => router.push('/workspaces')}
                  className="bg-white/20 hover:bg-white/30 text-white"
                >
                  워크스페이스
                </Button>
                <UserMenu />
              </>
            ) : (
              <>
                <Button
                  onClick={() => router.push('/login')}
                  variant="outline"
                  className="border-white/30 bg-transparent text-white hover:bg-white/20"
                >
                  로그인
                </Button>
                <Button
                  onClick={() => router.push('/register')}
                  className="bg-white text-indigo-600 hover:bg-white/90"
                >
                  회원가입
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold text-white mb-6">
          개발자를 위한
          <br />
          실시간 협업 플랫폼
        </h2>
        <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
          코드 스니펫 공유, 마크다운 메모, 실시간 채팅으로
          <br />
          팀워크를 효율적으로 만들어 보세요.
        </p>
        {user ? (
          <Button
            onClick={() => router.push('/workspaces')}
            size="lg"
            className="bg-white text-indigo-600 hover:bg-white/90 text-lg px-8 py-6"
          >
            워크스페이스 시작하기
          </Button>
        ) : (
          <Button
            onClick={() => router.push('/register')}
            size="lg"
            className="bg-white text-indigo-600 hover:bg-white/90 text-lg px-8 py-6"
          >
            무료로 시작하기
          </Button>
        )}
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h3 className="text-2xl font-bold text-white text-center mb-12">주요 기능</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            className="border-0"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)' }}
          >
            <CardContent className="pt-8 pb-8 text-center">
              <div className="text-4xl mb-4">💬</div>
              <h4 className="text-xl font-bold text-white mb-2">실시간 채팅</h4>
              <p className="text-white/60">
                WebSocket 기반의 실시간 메시징으로
                <br />
                팀원들과 즉시 소통하세요.
              </p>
            </CardContent>
          </Card>

          <Card
            className="border-0"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)' }}
          >
            <CardContent className="pt-8 pb-8 text-center">
              <div className="text-4xl mb-4">🧩</div>
              <h4 className="text-xl font-bold text-white mb-2">코드 스니펫</h4>
              <p className="text-white/60">
                Syntax Highlighting 지원
                <br />
                코드를 쉽게 공유하고 복사하세요.
              </p>
            </CardContent>
          </Card>

          <Card
            className="border-0"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)' }}
          >
            <CardContent className="pt-8 pb-8 text-center">
              <div className="text-4xl mb-4">📝</div>
              <h4 className="text-xl font-bold text-white mb-2">마크다운 메모</h4>
              <p className="text-white/60">
                GitHub Flavored Markdown 지원
                <br />
                깔끔하고 체계적으로 기록하세요.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h3 className="text-2xl font-bold text-white text-center mb-8">기술 스택</h3>
        <div className="flex flex-wrap justify-center gap-4">
          {['Spring Boot', 'React', 'WebSocket', 'PostgreSQL', 'Redis', 'Docker', 'Kafka'].map(
            (tech) => (
              <span
                key={tech}
                className="px-4 py-2 rounded-full text-sm font-medium text-white"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                {tech}
              </span>
            )
          )}
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="max-w-7xl mx-auto px-4 py-16 text-center">
          <Card
            className="border-0"
            style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}
          >
            <CardContent className="py-12">
              <h3 className="text-2xl font-bold text-white mb-4">지금 바로 시작하세요</h3>
              <p className="text-white/60 mb-6">무료로 워크스페이스를 만들고 팀원을 초대하세요</p>
              <Button
                onClick={() => router.push('/register')}
                size="lg"
                className="bg-indigo-900 hover:bg-indigo-800 text-white"
              >
                회원가입
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-white/50 text-sm">
          <p>DevCollab - Developer Collaboration Platform</p>
          <p className="mt-2">Portfolio Project | Spring Boot + React + WebSocket</p>
        </div>
      </footer>
    </div>
  );
}

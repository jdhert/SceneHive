'use client';

import React, { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div className="w-full max-w-md p-8 rounded-2xl text-center"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)' }}>
            <h2 className="text-2xl font-bold text-white mb-4">오류가 발생했습니다</h2>
            <p className="text-white/60 mb-6 text-sm">
              {this.state.error?.message || '알 수 없는 오류가 발생했습니다.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg bg-indigo-900 text-white hover:bg-indigo-800 text-sm"
              >
                다시 시도
              </button>
              <button
                onClick={() => { window.location.href = '/workspaces'; }}
                className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 text-sm"
              >
                워크스페이스 목록
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

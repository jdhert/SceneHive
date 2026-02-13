'use client';

import React from 'react';
import { useUser } from '@/providers/user-provider';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { user, isLoading, logout } = useUser();

  if (isLoading) {
    return <div className="container mx-auto p-6">로딩 중...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold text-center mb-5">대시보드</h2>
      {user && (
        <div className="mb-5 space-y-1">
          <p><strong>이름:</strong> {user.name}</p>
          <p><strong>이메일:</strong> {user.email}</p>
          <p><strong>가입일:</strong> {new Date(user.createdAt).toLocaleDateString('ko-KR')}</p>
        </div>
      )}
      <Button onClick={logout} variant="destructive">로그아웃</Button>
    </div>
  );
}

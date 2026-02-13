'use client';

import QueryProvider from '@/providers/query-provider';
import { UserProvider } from '@/providers/user-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { usePresenceWebSocket } from '@/hooks/use-presence-websocket';

function PresenceBootstrap({ children }: { children: React.ReactNode }) {
  usePresenceWebSocket();
  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <UserProvider>
          <PresenceBootstrap>{children}</PresenceBootstrap>
        </UserProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

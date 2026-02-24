'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { favoriteService } from '@/services/api';
import { useUser } from '@/providers/user-provider';
import type { FavoriteTargetType } from '@/types';

type FavoriteToggleButtonProps = {
  targetType: FavoriteTargetType;
  targetId: number;
  displayName: string;
  imagePath?: string | null;
};

export default function FavoriteToggleButton({
  targetType,
  targetId,
  displayName,
  imagePath,
}: FavoriteToggleButtonProps) {
  const { user } = useUser();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!user) return;
      try {
        const response = await favoriteService.exists(targetType, targetId);
        if (!mounted) return;
        setIsFavorite(Boolean(response.data?.exists));
      } catch {
        if (!mounted) return;
        setIsFavorite(false);
      } finally {
        if (mounted) setIsReady(true);
      }
    }

    setIsReady(false);
    load();
    return () => {
      mounted = false;
    };
  }, [user?.id, targetType, targetId]);

  if (!user) return null;

  const handleToggle = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      if (isFavorite) {
        await favoriteService.remove(targetType, targetId);
        setIsFavorite(false);
      } else {
        await favoriteService.add({
          targetType,
          targetId,
          displayName,
          imagePath: imagePath ?? null,
        });
        setIsFavorite(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleToggle}
      disabled={!isReady || isLoading}
      className="inline-flex items-center gap-2"
      style={{
        borderColor: isFavorite ? 'rgba(245,158,11,0.55)' : 'rgba(255,255,255,0.25)',
        color: isFavorite ? 'rgba(245,158,11,0.98)' : 'rgba(255,255,255,0.85)',
        background: isFavorite ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)',
      }}
    >
      <Heart className="w-4 h-4" style={{ fill: isFavorite ? '#F59E0B' : 'transparent' }} />
      {isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
    </Button>
  );
}


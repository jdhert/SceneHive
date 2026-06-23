type DetailPageSkeletonProps = {
  label: string;
};

function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{
        background:
          'linear-gradient(90deg, rgba(255,255,255,0.055) 0%, rgba(85,168,255,0.11) 48%, rgba(255,255,255,0.055) 100%)',
        backgroundSize: '220% 100%',
      }}
    />
  );
}

export function DetailPageSkeleton({ label }: DetailPageSkeletonProps) {
  return (
    <div className="space-y-8" aria-busy="true" aria-label={label}>
      <section
        className="relative overflow-hidden rounded-[2rem] min-h-[460px] p-6 md:p-10 shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
        style={{
          background:
            'linear-gradient(135deg, rgba(13,27,62,0.34) 0%, rgba(9,13,24,0.74) 44%, rgba(4,6,12,0.92) 100%)',
        }}
      >
        <div className="absolute inset-0 opacity-60">
          <SkeletonBlock className="h-full w-full rounded-none" />
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(6,9,16,0.20) 0%, rgba(6,9,16,0.92) 78%), linear-gradient(90deg, rgba(6,9,16,0.94) 0%, rgba(6,9,16,0.45) 58%, rgba(6,9,16,0.88) 100%)',
          }}
        />

        <div className="relative flex flex-col md:flex-row gap-6">
          <SkeletonBlock className="hidden md:block w-48 h-72 shrink-0 rounded-xl" />

          <div className="flex-1 max-w-3xl">
            <SkeletonBlock className="h-4 w-28 mb-5" />
            <SkeletonBlock className="h-12 md:h-16 w-3/4 mb-5" />
            <SkeletonBlock className="h-5 w-2/3 mb-7" />

            <div className="flex flex-wrap gap-3 mb-7">
              <SkeletonBlock className="h-10 w-32 rounded-full" />
              <SkeletonBlock className="h-10 w-24 rounded-full" />
              <SkeletonBlock className="h-10 w-28 rounded-full" />
              <SkeletonBlock className="h-10 w-36 rounded-full" />
            </div>

            <div className="space-y-3 mb-8">
              <SkeletonBlock className="h-5 w-full" />
              <SkeletonBlock className="h-5 w-11/12" />
              <SkeletonBlock className="h-5 w-4/5" />
            </div>

            <div className="flex flex-wrap gap-3">
              <SkeletonBlock className="h-12 w-28 rounded-lg" />
              <SkeletonBlock className="h-12 w-36 rounded-lg" />
              <SkeletonBlock className="h-12 w-32 rounded-lg" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonBlock className="h-32 rounded-2xl" />
        <SkeletonBlock className="h-32 rounded-2xl" />
        <SkeletonBlock className="h-32 rounded-2xl" />
      </section>
    </div>
  );
}

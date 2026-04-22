export function SceneHiveIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="7" fill="#0D1B3E" />
      <path
        d="M16 4L26 10L26 22L16 28L6 22L6 10Z"
        stroke="#55A8FF"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M13 11L13 21L22 16Z" fill="#55A8FF" />
    </svg>
  );
}

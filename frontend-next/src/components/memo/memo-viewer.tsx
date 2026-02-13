import type { Memo } from '@/types';
import MarkdownPreview from '@/components/memo/markdown-preview';

interface MemoViewerProps {
  memo: Memo;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
  isAuthor: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MemoViewer({
  memo,
  onEdit,
  onDelete,
  onBack,
  isAuthor,
}: MemoViewerProps) {
  const isModified = memo.updatedAt !== memo.createdAt;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Back"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate">
            {memo.title}
          </h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-gray-500">
              {memo.author.name}
            </span>
            <span className="text-xs text-gray-400">
              {formatDate(memo.createdAt)}
            </span>
            {isModified && (
              <span className="text-xs text-amber-500">
                (수정됨)
              </span>
            )}
          </div>
        </div>

        {isAuthor && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onEdit}
              className="px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              수정
            </button>
            <button
              onClick={onDelete}
              className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            >
              삭제
            </button>
          </div>
        )}
      </div>

      <div className="prose prose-sm prose-slate max-w-none p-4 rounded-xl border border-gray-200 bg-white">
        <MarkdownPreview content={memo.content} />
      </div>
    </div>
  );
}

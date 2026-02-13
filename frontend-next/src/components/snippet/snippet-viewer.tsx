import type { CodeSnippet } from '@/types';
import CodeBlock from '@/components/snippet/code-block';

interface SnippetViewerProps {
  snippet: CodeSnippet;
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

export default function SnippetViewer({
  snippet,
  onEdit,
  onDelete,
  onBack,
  isAuthor,
}: SnippetViewerProps) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Back"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-gray-600 dark:text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
            {snippet.title}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
              {snippet.language}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {snippet.author.name}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formatDate(snippet.createdAt)}
            </span>
          </div>
        </div>

        {isAuthor && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onEdit}
              className="px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            >
              수정
            </button>
            <button
              onClick={onDelete}
              className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              삭제
            </button>
          </div>
        )}
      </div>

      {snippet.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {snippet.description}
        </p>
      )}

      <div className="rounded-xl overflow-hidden">
        <CodeBlock code={snippet.code} language={snippet.language} />
      </div>
    </div>
  );
}

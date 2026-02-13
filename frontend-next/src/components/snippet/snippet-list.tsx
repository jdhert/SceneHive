import type { CodeSnippet } from '@/types';
import CodeBlock from '@/components/snippet/code-block';

interface SnippetListProps {
  snippets: CodeSnippet[];
  onView: (snippet: CodeSnippet) => void;
  onEdit: (snippet: CodeSnippet) => void;
  onDelete: (snippet: CodeSnippet) => void;
  currentUserId: number;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function SnippetList({
  snippets,
  onView,
  onEdit,
  onDelete,
  currentUserId,
}: SnippetListProps) {
  if (snippets.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          스니펫이 없습니다
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {snippets.map((snippet) => {
        const isAuthor = snippet.author.id === currentUserId;
        const previewCode = snippet.code.split('\n').slice(0, 5).join('\n');

        return (
          <div
            key={snippet.id}
            onClick={() => onView(snippet)}
            className="border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all bg-white"
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {snippet.title}
                </h3>
                <span className="shrink-0 px-2 py-0.5 text-[10px] font-medium text-indigo-600 bg-indigo-100 rounded-full">
                  {snippet.language}
                </span>
              </div>

              <div className="rounded-lg overflow-hidden max-h-32">
                <CodeBlock code={previewCode} language={snippet.language} />
              </div>
            </div>

            <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{snippet.author.name}</span>
                <span>-</span>
                <span>{formatDate(snippet.createdAt)}</span>
              </div>

              {isAuthor && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(snippet);
                    }}
                    className="p-1 text-gray-400 hover:text-indigo-500 transition-colors"
                    aria-label="Edit"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(snippet);
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Delete"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { useState } from 'react';
import type { CodeSnippet, CreateSnippetRequest, UpdateSnippetRequest } from '@/types';

interface SnippetEditorProps {
  snippet?: CodeSnippet;
  onSave: (data: CreateSnippetRequest | UpdateSnippetRequest) => void;
  onCancel: () => void;
}

const LANGUAGES = [
  'javascript',
  'python',
  'typescript',
  'java',
  'c',
  'cpp',
  'csharp',
  'go',
  'rust',
  'ruby',
  'php',
  'swift',
  'kotlin',
  'scala',
  'html',
  'css',
  'sql',
  'bash',
  'json',
  'yaml',
  'markdown',
];

export default function SnippetEditor({ snippet, onSave, onCancel }: SnippetEditorProps) {
  const [title, setTitle] = useState(snippet?.title || '');
  const [language, setLanguage] = useState(snippet?.language || 'javascript');
  const [code, setCode] = useState(snippet?.code || '');
  const [description, setDescription] = useState(snippet?.description || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim() || title.length > 200) {
      newErrors.title = '제목은 1~200자여야 합니다.';
    }

    if (!code.trim()) {
      newErrors.code = '코드를 입력해주세요.';
    }

    if (description.length > 500) {
      newErrors.description = '설명은 500자 이하여야 합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      title: title.trim(),
      code,
      language,
      description: description.trim() || undefined,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {snippet ? '스니펫 수정' : '새 스니펫'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            제목
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="스니펫 제목"
            maxLength={200}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-500">{errors.title}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            언어
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            코드
          </label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="코드를 입력하세요..."
            rows={12}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
          />
          {errors.code && (
            <p className="mt-1 text-xs text-red-500">{errors.code}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            설명
            <span className="ml-1 text-gray-400 font-normal">({description.length}/500)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="스니펫에 대한 설명 (선택사항)"
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-500">{errors.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {snippet ? '수정' : '생성'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}

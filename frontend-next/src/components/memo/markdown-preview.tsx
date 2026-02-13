'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface MarkdownPreviewProps {
  content: string;
}

const components: Components = {
  h1: ({ children, ...props }) => (
    <h1
      className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-5 mb-2 pb-1.5 border-b border-gray-200 dark:border-gray-700"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-2 pb-1 border-b border-gray-100 dark:border-gray-800"
      {...props}
    >
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3" {...props}>
      {children}
    </p>
  ),
  code: ({ className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const isInline = !match;

    if (isInline) {
      return (
        <code
          className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 rounded"
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <code
        className="block p-4 my-3 text-xs font-mono bg-gray-900 dark:bg-gray-950 text-gray-100 rounded-lg overflow-x-auto whitespace-pre"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => (
    <pre className="my-3 rounded-lg overflow-hidden" {...props}>
      {children}
    </pre>
  ),
  table: ({ children, ...props }) => (
    <div className="my-3 overflow-x-auto">
      <table
        className="min-w-full text-sm border-collapse border border-gray-200 dark:border-gray-700"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-gray-50 dark:bg-gray-800" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th
      className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td
      className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
      {...props}
    >
      {children}
    </td>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="my-3 pl-4 border-l-4 border-indigo-300 dark:border-indigo-600 text-gray-600 dark:text-gray-400 italic"
      {...props}
    >
      {children}
    </blockquote>
  ),
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-indigo-600 dark:text-indigo-400 hover:underline"
      {...props}
    >
      {children}
    </a>
  ),
  img: ({ src, alt, ...props }) => (
    <img
      src={src}
      alt={alt || ''}
      className="max-w-full h-auto rounded-lg my-3"
      loading="lazy"
      {...props}
    />
  ),
  ul: ({ children, ...props }) => (
    <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 mb-3 space-y-1" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 mb-3 space-y-1" {...props}>
      {children}
    </ol>
  ),
  hr: (props) => (
    <hr className="my-4 border-gray-200 dark:border-gray-700" {...props} />
  ),
};

export default function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div className="markdown-preview">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

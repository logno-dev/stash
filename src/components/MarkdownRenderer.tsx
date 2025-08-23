'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`prose prose-sm prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom styling for markdown elements to match dark theme
          h1: ({ children }) => <h1 className="text-xl font-bold text-white mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold text-white mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-medium text-white mb-1">{children}</h3>,
          p: ({ children }) => <p className="text-zinc-300 mb-2 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-zinc-200">{children}</em>,
          code: ({ children }) => (
            <code className="bg-zinc-800 text-orange-300 px-1 py-0.5 rounded text-sm font-mono">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-zinc-800 border border-zinc-600 rounded p-3 overflow-x-auto mb-2">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-orange-500 pl-4 my-2 text-zinc-300 italic">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => <ul className="list-disc list-inside mb-2 text-zinc-300">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 text-zinc-300">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-orange-400 hover:text-orange-300 underline"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className="min-w-full border border-zinc-600 rounded">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-zinc-600 bg-zinc-700 px-3 py-2 text-left text-white font-medium">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-zinc-600 px-3 py-2 text-zinc-300">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
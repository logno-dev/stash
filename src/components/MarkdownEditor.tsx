'use client';

import React, { useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = "Add your notes here... (Markdown supported)",
  required = false,
  rows = 4
}) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-2">
      {/* Tab buttons */}
      <div className="flex border-b border-zinc-600">
        <button
          type="button"
          onClick={() => setShowPreview(false)}
          className={`px-3 py-2 text-sm font-medium rounded-t-md border-b-2 ${
            !showPreview 
              ? 'text-white border-orange-500 bg-zinc-700' 
              : 'text-zinc-400 border-transparent hover:text-zinc-300'
          }`}
        >
          Write
        </button>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className={`px-3 py-2 text-sm font-medium rounded-t-md border-b-2 ${
            showPreview 
              ? 'text-white border-orange-500 bg-zinc-700' 
              : 'text-zinc-400 border-transparent hover:text-zinc-300'
          }`}
        >
          Preview
        </button>
      </div>

      {/* Content area */}
      {showPreview ? (
        <div className="min-h-[100px] p-3 bg-zinc-700 border border-zinc-600 rounded-md">
          {value.trim() ? (
            <MarkdownRenderer content={value} />
          ) : (
            <div className="text-zinc-500 italic">Nothing to preview</div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            rows={rows}
            className="w-full px-3 py-2 bg-input-bg border border-input-border text-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-text-muted focus:border-text-muted placeholder-text-muted font-mono"
          />
          {/* Markdown help */}
          <div className="text-xs text-zinc-500 space-y-1">
            <div className="font-medium">Markdown supported:</div>
            <div className="grid grid-cols-2 gap-2 text-zinc-600">
              <div>**bold** *italic*</div>
              <div>`code` ```code block```</div>
              <div># Heading</div>
              <div>- List item</div>
              <div>[link](url)</div>
              <div>&gt; Quote</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkdownEditor;
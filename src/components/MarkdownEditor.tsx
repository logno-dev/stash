'use client';

import React, { useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  showHelp?: boolean;
  fillHeight?: boolean;
  seamless?: boolean;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = "Add your notes here... (Markdown supported)",
  required = false,
  rows = 4,
  showHelp = true,
  fillHeight = false,
  seamless = false
}) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className={fillHeight ? 'flex h-full min-h-0 flex-col' : 'space-y-2'}>
      {/* Tab buttons */}
        <div className="flex shrink-0 border-b border-zinc-600">
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className={`px-3 py-2 text-sm font-medium rounded-t-md border-b-2 ${
               !showPreview 
                ? 'text-white border-slate-300 bg-slate-700' 
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
                ? 'text-white border-slate-300 bg-slate-700' 
                : 'text-zinc-400 border-transparent hover:text-zinc-300'
             }`}
          >
            Preview
          </button>
      </div>

      {/* Content area */}
      {showPreview ? (
          <div className={`${fillHeight ? 'min-h-0 flex-1 overflow-y-auto' : 'min-h-[100px]'} ${seamless ? 'bg-transparent px-1 py-5' : 'rounded-md border border-input-border bg-input-bg p-3'}`}>
          {value.trim() ? (
            <MarkdownRenderer content={value} />
          ) : (
            <div className="text-zinc-500 italic">Nothing to preview</div>
          )}
        </div>
      ) : (
        <div className={fillHeight ? 'min-h-0 flex-1' : 'space-y-2'}>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            rows={rows}
            className={`w-full text-text-primary placeholder-text-muted font-mono focus:outline-none ${fillHeight ? 'h-full min-h-0 resize-none' : ''} ${seamless ? 'border-0 bg-transparent px-1 py-5 focus:ring-0' : 'rounded-md border border-input-border bg-input-bg px-3 py-2 focus:border-text-muted focus:ring-2 focus:ring-text-muted'}`}
          />
          {/* Markdown help */}
            {showHelp ? (
              <div className="text-xs text-slate-500 space-y-1">
                <div className="font-medium">Markdown supported:</div>
                <div className="grid grid-cols-2 gap-2 text-slate-500">
                  <div>**bold** *italic*</div>
                  <div>`code` ```code block```</div>
                  <div># Heading</div>
                  <div>- List item</div>
                  <div>[link](url)</div>
                  <div>&gt; Quote</div>
                </div>
              </div>
            ) : null}
        </div>
      )}
    </div>
  );
};

export default MarkdownEditor;

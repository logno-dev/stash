'use client';

import React, { useState, useRef, useEffect } from 'react';

interface PopoverProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

const Popover: React.FC<PopoverProps> = ({ content, children, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    maxWidth: 0,
  });
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const showPopover = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      const safeWidth = Math.min(360, Math.max(140, window.innerWidth - 24));
      const left = Math.min(
        Math.max(rect.left + scrollLeft, scrollLeft + 12),
        scrollLeft + window.innerWidth - safeWidth - 12,
      );
      
      setPosition({
        top: rect.bottom + scrollTop + 8,
        left,
        maxWidth: safeWidth,
      });
      setIsVisible(true);
    }
  };

  const hidePopover = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        hidePopover();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showPopover}
        onMouseLeave={hidePopover}
        className={`cursor-help ${className}`}
      >
        {children}
      </div>
      
        {isVisible && (
        <div
          ref={popoverRef}
          className="fixed z-50 bg-card-bg border border-slate-600 rounded-md shadow-md p-3 text-sm text-text-secondary"
           style={{
             top: `${position.top}px`,
             left: `${position.left}px`,
              width: `${position.maxWidth}px`,
              maxWidth: `${position.maxWidth}px`,
              wordBreak: 'break-all',
              whiteSpace: 'normal',
            }}
         >
          {content}
        </div>
      )}
    </>
  );
};

export default Popover;

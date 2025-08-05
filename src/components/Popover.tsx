'use client';

import React, { useState, useRef, useEffect } from 'react';

interface PopoverProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

const Popover: React.FC<PopoverProps> = ({ content, children, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const showPopover = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      setPosition({
        top: rect.bottom + scrollTop + 8,
        left: rect.left + scrollLeft
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
          className="fixed z-50 bg-zinc-800 border border-zinc-600 rounded-lg shadow-lg p-3 max-w-md break-all text-sm text-zinc-200"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {content}
        </div>
      )}
    </>
  );
};

export default Popover;
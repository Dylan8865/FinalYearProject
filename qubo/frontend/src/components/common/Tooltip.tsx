import React, { useState } from 'react';
import { FiHelpCircle } from 'react-icons/fi';

interface TooltipProps {
  content: string | React.ReactNode;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export default function Tooltip({ content, children, position = 'top', className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-t-slate-800 border-b-transparent border-l-transparent border-r-transparent border-8',
    bottom: 'bottom-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-b-slate-800 border-t-transparent border-l-transparent border-r-transparent border-8',
    left: 'left-[calc(100%-1px)] top-1/2 -translate-y-1/2 border-l-slate-800 border-r-transparent border-t-transparent border-b-transparent border-8',
    right: 'right-[calc(100%-1px)] top-1/2 -translate-y-1/2 border-r-slate-800 border-l-transparent border-t-transparent border-b-transparent border-8',
  };

  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children || <FiHelpCircle className="h-4 w-4 text-slate-400 hover:text-primary transition-colors cursor-help" />}
      
      {isVisible && (
        <div className={`absolute z-50 w-64 max-w-sm rounded-xl bg-slate-800 p-3 text-sm font-medium text-white shadow-xl ${positionClasses[position]}`}>
          {content}
          <div className={`absolute w-0 h-0 ${arrowClasses[position]}`} />
        </div>
      )}
    </div>
  );
}

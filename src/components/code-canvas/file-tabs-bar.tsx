import type React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const FileTabsBar: React.FC = () => {
  const activeFile = "test.py"; // Example active file

  return (
    <div className="flex h-10 items-end border-b border-border bg-card px-1 shadow-sm">
      <div
        className={cn(
          "flex h-full cursor-pointer items-center space-x-2 border-r border-t border-border bg-background px-4 pt-1 text-sm text-foreground shadow-[0px_-2px_5px_-2px_rgba(0,0,0,0.1)]",
          // Active tab styling
          "border-primary relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-primary"
        )}
      >
        {/* Python icon placeholder - you can replace with an actual SVG or lucide icon if available */}
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
            <path d="M13.5 2H10L6 22h4l3.5-20"/>
            <path d="M10.5 2H14l4 20h-4L10.5 2z"/>
            <circle cx="12" cy="12" r="10"/>
        </svg>
        <span>{activeFile}</span>
        <button 
          className="ml-auto rounded p-0.5 text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground"
          aria-label="Close tab"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {/* Add more tabs here if needed */}
    </div>
  );
};

export default FileTabsBar;

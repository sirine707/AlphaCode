
import type React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileTabsBarProps {
  activeFileName: string | null;
}

const FileTabsBar: React.FC<FileTabsBarProps> = ({ activeFileName }) => {
  if (!activeFileName) {
    return (
      <div className="flex h-10 items-end border-b border-border bg-card px-1 shadow-sm">
        {/* Optionally, display a placeholder or nothing when no file is open */}
      </div>
    );
  }

  // Basic file type to icon mapping (can be expanded)
  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.py')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
          <path d="M13.5 2H10L6 22h4l3.5-20"/>
          <path d="M10.5 2H14l4 20h-4L10.5 2z"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
      );
    }
    if (fileName.endsWith('.js')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <path d="M7.5 4.21l4.5 2.62l4.5-2.62"></path>
          <path d="M7.5 19.79l4.5-2.62l4.5 2.62"></path>
          <path d="M12 12.5v4.5"></path>
          <path d="m3.25 10.5l8.75 5l8.75-5"></path>
          <path d="m3.25 14.5l8.75-5l8.75 5"></path>
        </svg>
      );
    }
     if (fileName.endsWith('.json')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
          <path d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
          <path d="M16 8h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2"/>
          <path d="M12 8v8"/>
          <path d="M10 10h4"/>
          <path d="M10 14h4"/>
        </svg>
      );
    }
    if (fileName.endsWith('.md')) {
      return (
         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      );
    }
    // Default file icon
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
    );
  };


  return (
    <div className="flex h-10 items-end border-b border-border bg-card px-1 shadow-sm">
      <div
        className={cn(
          "flex h-full cursor-pointer items-center space-x-2 border-r border-t border-border bg-background px-4 pt-1 text-sm text-foreground shadow-[0px_-2px_5px_-2px_rgba(0,0,0,0.1)]",
          "border-primary relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-primary"
        )}
        title={activeFileName}
      >
        {getFileIcon(activeFileName)}
        <span className="truncate max-w-[150px]">{activeFileName}</span>
        <button
          className="ml-auto rounded p-0.5 text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground"
          aria-label="Close tab"
          onClick={(e) => {
            e.stopPropagation(); // Prevent click from bubbling to the tab itself
            // Add close tab logic here if needed in the future
            console.log("Close tab clicked for:", activeFileName);
          }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {/* Add more tabs here if needed */}
    </div>
  );
};

export default FileTabsBar;

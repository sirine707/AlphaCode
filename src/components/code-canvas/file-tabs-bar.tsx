
import type React from 'react';
import { Play, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FileItem } from './file-explorer-panel';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FileTabsBarProps {
  openFiles: FileItem[];
  activeFilePath: string | null;
  onTabClick: (filePath: string) => void;
  onCloseTab: (filePath: string) => void;
}

const FileTabsBar: React.FC<FileTabsBarProps> = ({
  openFiles,
  activeFilePath,
  onTabClick,
  onCloseTab,
}) => {
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
    <TooltipProvider delayDuration={300}>
      <div className="flex h-10 items-center justify-between border-b border-border bg-card px-1 shadow-sm">
        <div className="flex h-full flex-1 items-end overflow-x-auto">
          {openFiles.length === 0 ? (
            <div className="flex h-full items-center pl-3 text-xs text-muted-foreground italic">
              {/* Placeholder when no files are open */}
            </div>
          ) : (
            openFiles.map((file) => (
              <div
                key={file.path}
                className={cn(
                  "flex h-full cursor-pointer items-center space-x-2 border-r border-t border-border px-4 pt-1 text-sm",
                  activeFilePath === file.path
                    ? "bg-background text-foreground shadow-[0px_-2px_5px_-2px_rgba(0,0,0,0.1)] border-primary relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-primary"
                    : "bg-card text-muted-foreground hover:bg-background/70 hover:text-foreground"
                )}
                title={file.name}
                onClick={() => onTabClick(file.path)}
              >
                {getFileIcon(file.name)}
                <span className="truncate max-w-[150px]">{file.name}</span>
                <button
                  className={cn(
                    "ml-auto rounded p-0.5 hover:bg-muted-foreground/20",
                    activeFilePath === file.path ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label={`Close tab ${file.name}`}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent click from bubbling to the tab itself
                    onCloseTab(file.path);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center pr-2">
          {openFiles.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-green-400"
                  onClick={() => console.log(`Running code for ${activeFilePath}...`)}
                  aria-label="Run Code"
                >
                  <Play className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-card text-foreground border-border text-xs p-1">
                <p>Run Code</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default FileTabsBar;

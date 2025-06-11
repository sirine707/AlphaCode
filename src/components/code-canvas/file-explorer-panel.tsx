
"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Folder, File as FileIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FileExplorerPanelProps {
  isOpen: boolean;
}

interface FileItem {
  name: string;
  type: 'file' | 'folder';
  children?: FileItem[];
  icon?: React.ElementType;
}

const initialFiles: FileItem[] = [
  {
    name: 'PROJECT_ROOT',
    type: 'folder',
    children: [
      {
        name: 'src',
        type: 'folder',
        children: [
          { name: 'app.py', type: 'file', icon: FileIcon },
          { name: 'utils.js', type: 'file', icon: FileIcon },
        ]
      },
      {
        name: 'tests',
        type: 'folder',
        children: [
          { name: 'test_app.py', type: 'file', icon: FileIcon }
        ]
      },
      { name: 'package.json', type: 'file', icon: FileIcon },
      { name: 'README.md', type: 'file', icon: FileIcon },
    ]
  }
];


const FileTreeItem: React.FC<{ item: FileItem; level?: number }> = ({ item, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(level === 0); // Expand root by default
  const Icon = item.icon || (item.type === 'folder' ? Folder : FileIcon);

  const handleToggle = () => {
    if (item.type === 'folder') {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "flex cursor-pointer items-center space-x-2 rounded-md px-2 py-1.5 text-sm hover:bg-primary/10",
          level > 0 && "pl-4" // Indent nested items
        )}
        style={{ paddingLeft: `${level * 1 + 0.5}rem` }}
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleToggle()}
      >
        {item.type === 'folder' && (isExpanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />)}
        <Icon className={cn("h-4 w-4 shrink-0", item.type === 'folder' ? 'text-accent' : 'text-muted-foreground')} />
        <span>{item.name}</span>
      </div>
      {isExpanded && item.children && (
        <div className="pl-0"> {/* No additional padding here, handled by level in recursive call */}
          {item.children.map((child, index) => (
            <FileTreeItem key={index} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};


const FileExplorerPanel: React.FC<FileExplorerPanelProps> = ({ isOpen }) => {
  return (
    <div
      className={cn(
        "h-full bg-card shadow-md transition-all duration-300 ease-in-out overflow-hidden border-r border-border",
        isOpen ? "w-64 p-2" : "w-0 p-0"
      )}
    >
      {isOpen && (
        <div className="flex flex-col h-full">
          <h2 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Explorer
          </h2>
          <ScrollArea className="flex-1">
            {initialFiles.map((item, index) => (
               <FileTreeItem key={index} item={item} />
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default FileExplorerPanel;

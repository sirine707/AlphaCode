
"use client";

import React, { useState, useRef } from 'react';
import { ChevronDown, ChevronRight, Folder, File as FileIcon, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface FileItem {
  name: string;
  type: 'file' | 'folder';
  path: string; // Unique path for the item
  content?: string; // Content for files
  children?: FileItem[];
  icon?: React.ElementType;
}

interface FileExplorerPanelProps {
  isOpen: boolean;
  onOpenFile: (file: FileItem) => void;
}

// This remains the source of truth for the initial project structure
// and is also exported for use in other components like ChatPanel.
export const initialFilesData: FileItem[] = [
  {
    name: 'PROJECT_ROOT',
    type: 'folder',
    path: '/',
    children: [
      {
        name: 'src',
        type: 'folder',
        path: '/src',
        children: [
          { name: 'app.py', type: 'file', icon: FileIcon, path: '/src/app.py', content: '# Welcome to app.py\n\ndef main():\n    print("Hello from app.py")\n\nif __name__ == "__main__":\n    main()' },
          { name: 'utils.js', type: 'file', icon: FileIcon, path: '/src/utils.js', content: '// JavaScript utility functions\n\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\nmodule.exports = { greet };' },
        ]
      },
      {
        name: 'tests',
        type: 'folder',
        path: '/tests',
        children: [
          { name: 'test_app.py', type: 'file', icon: FileIcon, path: '/tests/test_app.py', content: '# Tests for app.py\n\nimport unittest\n# from src.app import main # Assuming app.py is structured to allow import\n\nclass TestApp(unittest.TestCase):\n    def test_example(self):\n        self.assertTrue(True)\n\nif __name__ == "__main__":\n    unittest.main()' }
        ]
      },
      { name: 'package.json', type: 'file', icon: FileIcon, path: '/package.json', content: '{\n  "name": "my-project",\n  "version": "1.0.0",\n  "description": "",\n  "main": "index.js",\n  "scripts": {\n    "test": "echo \\"Error: no test specified\\" && exit 1"\n  },\n  "keywords": [],\n  "author": "",\n  "license": "ISC"\n}' },
      { name: 'README.md', type: 'file', icon: FileIcon, path: '/README.md', content: '# My Project\n\nThis is a sample README file.' },
    ]
  }
];


const FileTreeItem: React.FC<{ item: FileItem; level?: number; onOpenFile: (file: FileItem) => void; onToggleCollapse?: (path: string, expand?: boolean) => void; expandedPaths?: Set<string>; }> = ({ item, level = 0, onOpenFile, onToggleCollapse, expandedPaths }) => {
  const isExplicitlyExpanded = expandedPaths ? expandedPaths.has(item.path) : level === 0;
  const [isExpanded, setIsExpanded] = useState(level === 0); 

  const currentIsExpanded = onToggleCollapse ? isExplicitlyExpanded : isExpanded;

  const Icon = item.icon || (item.type === 'folder' ? Folder : FileIcon);

  const handleToggle = () => {
    if (item.type === 'folder') {
      if (onToggleCollapse) {
        onToggleCollapse(item.path);
      } else {
        setIsExpanded(!isExpanded);
      }
    } else {
      onOpenFile(item);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "flex cursor-pointer items-center space-x-2 rounded-md px-2 py-1.5 text-sm hover:bg-primary/10",
          level > 0 && "pl-4"
        )}
        style={{ paddingLeft: `${level * 1 + 0.5}rem` }}
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleToggle()}
        aria-label={item.name}
        aria-expanded={item.type === 'folder' ? currentIsExpanded : undefined}
      >
        {item.type === 'folder' ? (currentIsExpanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />) : <div className="w-4 h-4 shrink-0"></div>}
        <Icon className={cn("h-4 w-4 shrink-0", item.type === 'folder' ? 'text-accent' : 'text-muted-foreground')} />
        <span>{item.name}</span>
      </div>
      {currentIsExpanded && item.children && (
        <div className="pl-0">
          {item.children.map((child) => (
            <FileTreeItem key={child.path} item={child} level={level + 1} onOpenFile={onOpenFile} onToggleCollapse={onToggleCollapse} expandedPaths={expandedPaths} />
          ))}
        </div>
      )}
    </div>
  );
};


const FileExplorerPanel: React.FC<FileExplorerPanelProps> = ({ isOpen, onOpenFile }) => {
  const [projectFiles, setProjectFiles] = useState<FileItem[]>(initialFilesData);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['/'])); 
  const directoryInputRef = useRef<HTMLInputElement>(null);

  const toggleCollapse = (path: string, expand?: boolean) => {
    setExpandedPaths(prev => {
      const newPaths = new Set(prev);
      if (expand === true) {
        newPaths.add(path);
      } else if (expand === false) {
        newPaths.delete(path);
      } else {
        if (newPaths.has(path)) {
          newPaths.delete(path);
        } else {
          newPaths.add(path);
        }
      }
      return newPaths;
    });
  };

  const handleClearProjectView = () => {
    setProjectFiles([]); 
    setExpandedPaths(new Set());
    console.log("Project view cleared from explorer. Current project structure removed.");
  };

  const handleImportNewProject = () => {
    if (directoryInputRef.current) {
      directoryInputRef.current.click();
    }
  };

  const handleDirectorySelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      console.log("Directory selected. Files found:", files.length);
      // In a real application, you would process these files to build a new FileItem[] structure.
      // For this prototype, we'll just log and reload the initial demo project.
      console.log("Simulating: Processing selected directory and loading project structure.");
      setProjectFiles(initialFilesData); 
      setExpandedPaths(new Set(['/'])); 
    }
    // Reset the input value to allow selecting the same directory again
    if (directoryInputRef.current) {
      directoryInputRef.current.value = "";
    }
  };

  return (
    <div
      className={cn(
        "h-full bg-card shadow-md transition-all duration-300 ease-in-out overflow-hidden border-r border-border",
        isOpen ? "w-64 p-2" : "w-0 p-0"
      )}
    >
      {isOpen && (
        <div className="flex flex-col h-full">
          <div className="mb-3 px-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex-grow">
              Explorer
            </h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onSelect={handleClearProjectView}>
                  collapse project
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleImportNewProject}>
                  Import new project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <ScrollArea className="flex-1">
            {projectFiles.length > 0 ? (
              projectFiles.map((item) => (
                 <FileTreeItem key={item.path} item={item} onOpenFile={onOpenFile} onToggleCollapse={toggleCollapse} expandedPaths={expandedPaths} />
              ))
            ) : (
              <div className="p-4 text-center text-xs text-muted-foreground">
                Project view cleared. <br /> Use "Import new project" to load files.
              </div>
            )}
          </ScrollArea>
          <input
            type="file"
            ref={directoryInputRef}
            onChange={handleDirectorySelected}
            style={{ display: 'none' }}
            webkitdirectory=""
            directory=""
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
};

// Export initialFilesData as initialFiles for ChatPanel or other components
// that might need the static project structure.
export { initialFilesData as initialFiles };
export default FileExplorerPanel;


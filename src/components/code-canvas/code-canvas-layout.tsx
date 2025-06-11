
"use client";

import React, { useState, useCallback } from 'react';
import ActivityBar from './activity-bar';
import FileExplorerPanel, { type FileItem } from './file-explorer-panel';
import EditorWorkspace from './editor-workspace';

const CodeCanvasLayout: React.FC = () => {
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [openFiles, setOpenFiles] = useState<FileItem[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);

  const toggleExplorer = () => {
    setIsExplorerOpen(!isExplorerOpen);
  };

  const handleOpenFile = useCallback((file: FileItem) => {
    if (file.type === 'file') {
      setOpenFiles((prevOpenFiles) => {
        if (prevOpenFiles.find(f => f.path === file.path)) {
          return prevOpenFiles; // File already open
        }
        return [...prevOpenFiles, file];
      });
      setActiveFilePath(file.path);
    }
  }, []);

  const handleCloseFile = useCallback((filePathToClose: string) => {
    setOpenFiles((prevOpenFiles) => {
      const fileIndex = prevOpenFiles.findIndex(f => f.path === filePathToClose);
      if (fileIndex === -1) return prevOpenFiles;

      const updatedOpenFiles = prevOpenFiles.filter(f => f.path !== filePathToClose);

      if (activeFilePath === filePathToClose) {
        if (updatedOpenFiles.length === 0) {
          setActiveFilePath(null);
        } else {
          // Try to set the next tab as active, or the previous one if it was the last
          const newActiveIndex = Math.max(0, Math.min(fileIndex, updatedOpenFiles.length - 1));
          setActiveFilePath(updatedOpenFiles[newActiveIndex]?.path || null);
        }
      }
      return updatedOpenFiles;
    });
  }, [activeFilePath]);

  const handleSwitchTab = useCallback((filePath: string) => {
    setActiveFilePath(filePath);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-code">
      <ActivityBar onToggleExplorer={toggleExplorer} isExplorerOpen={isExplorerOpen} />
      <FileExplorerPanel isOpen={isExplorerOpen} onOpenFile={handleOpenFile} />
      <EditorWorkspace
        openFiles={openFiles}
        activeFilePath={activeFilePath}
        onCloseTab={handleCloseFile}
        onSwitchTab={handleSwitchTab}
      />
    </div>
  );
};

export default CodeCanvasLayout;


"use client";

import React, { useState } from 'react';
import ActivityBar from './activity-bar';
import FileExplorerPanel, { type FileItem } from './file-explorer-panel';
import EditorWorkspace from './editor-workspace';

const CodeCanvasLayout: React.FC = () => {
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [activeFile, setActiveFile] = useState<FileItem | null>(null);

  const toggleExplorer = () => {
    setIsExplorerOpen(!isExplorerOpen);
  };

  const handleOpenFile = (file: FileItem) => {
    if (file.type === 'file') {
      setActiveFile(file);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-code">
      <ActivityBar onToggleExplorer={toggleExplorer} isExplorerOpen={isExplorerOpen} />
      <FileExplorerPanel isOpen={isExplorerOpen} onOpenFile={handleOpenFile} />
      <EditorWorkspace activeFile={activeFile} />
    </div>
  );
};

export default CodeCanvasLayout;

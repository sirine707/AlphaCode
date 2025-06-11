"use client";

import type React from 'react';
import { useState } from 'react';
import ActivityBar from './activity-bar';
import FileExplorerPanel from './file-explorer-panel';
import EditorWorkspace from './editor-workspace';

const CodeCanvasLayout: React.FC = () => {
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);

  const toggleExplorer = () => {
    setIsExplorerOpen(!isExplorerOpen);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-code">
      <ActivityBar onToggleExplorer={toggleExplorer} isExplorerOpen={isExplorerOpen} />
      <FileExplorerPanel isOpen={isExplorerOpen} />
      <EditorWorkspace />
    </div>
  );
};

export default CodeCanvasLayout;

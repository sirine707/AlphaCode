
"use client";

import React, { useState, useCallback } from 'react';
import ActivityBar from './activity-bar';
import FileExplorerPanel, { type FileItem } from './file-explorer-panel';
import EditorWorkspace from './editor-workspace';
import TitleBar from './title-bar';
import DeployPanel from './deploy-panel';
import SourceControlPanel from './source-control-panel';
import ExtensionsPanel from './extensions-panel'; // Import the new ExtensionsPanel

export type ActiveView = 'explorer' | 'source-control' | 'extensions' | 'deploy' | 'settings' | null;

const CodeCanvasLayout: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('explorer');
  const [isSidePanelVisible, setIsSidePanelVisible] = useState(true);

  const [openFiles, setOpenFiles] = useState<FileItem[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);

  const handleViewChange = useCallback((viewId: ActiveView) => {
    if (activeView === viewId) {
      setIsSidePanelVisible(prev => !prev);
    } else {
      setActiveView(viewId);
      setIsSidePanelVisible(true); // Always open panel when switching to a new view
    }
  }, [activeView]);


  const handleOpenFile = useCallback((file: FileItem) => {
    if (file.type === 'file') {
      setOpenFiles((prevOpenFiles) => {
        if (prevOpenFiles.find(f => f.path === file.path)) {
          setActiveFilePath(file.path); // Set as active if already open
          return prevOpenFiles;
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
          const newActiveIndex = Math.min(fileIndex, updatedOpenFiles.length - 1);
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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground font-code">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <ActivityBar
          activeViewId={activeView}
          onViewChange={handleViewChange}
          isSidePanelOpen={isSidePanelVisible}
        />
        {activeView === 'explorer' && isSidePanelVisible && (
          <FileExplorerPanel isOpen={isSidePanelVisible} onOpenFile={handleOpenFile} />
        )}
        {activeView === 'deploy' && isSidePanelVisible && (
          <DeployPanel isOpen={isSidePanelVisible} />
        )}
        {activeView === 'source-control' && isSidePanelVisible && (
          <SourceControlPanel isOpen={isSidePanelVisible} />
        )}
        {activeView === 'extensions' && isSidePanelVisible && (
          <ExtensionsPanel isOpen={isSidePanelVisible} />
        )}
        {/* Placeholder for other views like settings */}
        {activeView === 'settings' && isSidePanelVisible && activeView !== null && (
            <div className="w-64 h-full bg-card p-4 border-r border-border">
                <p className="text-sm text-muted-foreground">Panel for: {activeView}</p>
                <p className="text-xs mt-2">This is a placeholder. Implement actual panel content.</p>
            </div>
        )}
        <EditorWorkspace
          openFiles={openFiles}
          activeFilePath={activeFilePath}
          onCloseTab={handleCloseFile}
          onSwitchTab={handleSwitchTab}
        />
      </div>
    </div>
  );
};

export default CodeCanvasLayout;

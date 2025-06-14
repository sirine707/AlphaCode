
"use client";

import React, { useState, useCallback } from 'react';
import ActivityBar from './activity-bar';
import FileExplorerPanel, { type FileItem, initialFilesData } from './file-explorer-panel';
import EditorWorkspace from './editor-workspace';
import TitleBar from './title-bar';
import DeployPanel from './deploy-panel';
import SourceControlPanel from './source-control-panel';
import ExtensionsPanel from './extensions-panel';
import SettingsPanel from './settings-panel';
import ChatPanel from './chat-panel';

export type ActiveView = 'explorer' | 'source-control' | 'extensions' | 'deploy' | 'settings' | null;

const CodeCanvasLayout: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('explorer');
  const [isSidePanelVisible, setIsSidePanelVisible] = useState(true);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);

  const [openFiles, setOpenFiles] = useState<FileItem[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);

  // State for FileExplorerPanel, lifted up
  const [explorerProjectFiles, setExplorerProjectFiles] = useState<FileItem[]>(initialFilesData);
  const [explorerExpandedPaths, setExplorerExpandedPaths] = useState<Set<string>>(
    new Set(initialFilesData[0]?.path ? [initialFilesData[0].path] : ['/'])
  );

  const handleViewChange = useCallback((viewId: ActiveView) => {
    if (activeView === viewId) {
      setIsSidePanelVisible(prev => !prev);
    } else {
      setActiveView(viewId);
      setIsSidePanelVisible(true); // Always open panel when switching to a new view
    }
  }, [activeView]);

  const toggleChatPanel = useCallback(() => {
    setIsChatPanelOpen(prev => !prev);
  }, []);


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
      // If explorer is not active, switch to it and ensure side panel is visible
      if (activeView !== 'explorer' || !isSidePanelVisible) {
        setActiveView('explorer');
        setIsSidePanelVisible(true);
      }
    }
  }, [activeView, isSidePanelVisible]);

  const handleCloseFile = useCallback((filePathToClose: string) => {
    setOpenFiles((prevOpenFiles) => {
      const fileIndex = prevOpenFiles.findIndex(f => f.path === filePathToClose);
      if (fileIndex === -1) return prevOpenFiles;

      const updatedOpenFiles = prevOpenFiles.filter(f => f.path !== filePathToClose);

      if (activeFilePath === filePathToClose) {
        if (updatedOpenFiles.length === 0) {
          setActiveFilePath(null);
        } else {
          // Try to activate the tab to the right, or to the left if it's the last one
          const newActiveIndex = fileIndex >= updatedOpenFiles.length ? updatedOpenFiles.length - 1 : fileIndex;
          setActiveFilePath(updatedOpenFiles[newActiveIndex]?.path || null);
        }
      }
      return updatedOpenFiles;
    });
  }, [activeFilePath]);

  const handleSwitchTab = useCallback((filePath: string) => {
    setActiveFilePath(filePath);
  }, []);

  // Handlers for FileExplorerPanel state
  const handleExplorerProjectFilesChange = useCallback((newFiles: FileItem[]) => {
    setExplorerProjectFiles(newFiles);
  }, []);

  const handleExplorerExpandedPathsChange = useCallback((newPaths: Set<string>) => {
    setExplorerExpandedPaths(newPaths);
  }, []);

  const handleExplorerToggleCollapse = useCallback((path: string) => {
    setExplorerExpandedPaths(prev => {
      const newPaths = new Set(prev);
      if (newPaths.has(path)) {
        newPaths.delete(path);
      } else {
        newPaths.add(path);
      }
      return newPaths;
    });
  }, []);


  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground font-code">
      <TitleBar onToggleChatPanel={toggleChatPanel} />
      <div className="flex flex-1 overflow-hidden relative">
        <ActivityBar
          activeViewId={activeView}
          onViewChange={handleViewChange}
          isSidePanelOpen={isSidePanelVisible}
        />
        {activeView === 'explorer' && isSidePanelVisible && (
          <FileExplorerPanel
            isOpen={isSidePanelVisible}
            onOpenFile={handleOpenFile}
            projectFiles={explorerProjectFiles}
            expandedPaths={explorerExpandedPaths}
            onProjectFilesChange={handleExplorerProjectFilesChange}
            onExpandedPathsChange={handleExplorerExpandedPathsChange}
            onToggleCollapse={handleExplorerToggleCollapse}
          />
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
        {activeView === 'settings' && isSidePanelVisible && (
          <SettingsPanel isOpen={isSidePanelVisible} />
        )}
        <EditorWorkspace
          openFiles={openFiles}
          activeFilePath={activeFilePath}
          onCloseTab={handleCloseFile}
          onSwitchTab={handleSwitchTab}
        />
        <ChatPanel isOpen={isChatPanelOpen} onClose={toggleChatPanel} />
      </div>
    </div>
  );
};

export default CodeCanvasLayout;

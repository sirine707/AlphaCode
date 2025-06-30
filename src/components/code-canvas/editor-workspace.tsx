
"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
import FileTabsBar from './file-tabs-bar';
import CodeEditorArea from './code-editor-area';
import type { FileItem } from './file-explorer-panel';

interface EditorWorkspaceProps {
  openFiles: FileItem[];
  activeFilePath: string | null;
  onCloseTab: (filePath: string) => void;
  onSwitchTab: (filePath: string) => void;
}

const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({
  openFiles,
  activeFilePath,
  onCloseTab,
  onSwitchTab,
}) => {
  const activeFile = openFiles.find(file => file.path === activeFilePath) || null;
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);

  useEffect(() => {
    // Reset language when file changes
    setDetectedLanguage(null);
  }, [activeFilePath]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden relative">
      <FileTabsBar
        openFiles={openFiles}
        activeFilePath={activeFilePath}
        onCloseTab={onCloseTab}
        onTabClick={onSwitchTab}
      />
      <CodeEditorArea
        fileContent={activeFile?.content}
        fileName={activeFile?.name || "Untitled"}
        filePath={activeFile?.path}
        onLanguageChange={setDetectedLanguage}
      />
      {activeFilePath && (
        <div className="absolute bottom-2 right-4 text-xs text-muted-foreground select-none">
          {detectedLanguage === 'loading' && 'Detecting Language...'}
          {detectedLanguage && detectedLanguage !== 'loading' && detectedLanguage}
          {!detectedLanguage && 'Plain Text'}
        </div>
      )}
    </div>
  );
};

export default EditorWorkspace;

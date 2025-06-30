
"use client";

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import FileTabsBar from './file-tabs-bar';
import CodeEditorArea from './code-editor-area';
import type { FileItem } from './file-explorer-panel';
import { detectLanguage } from '@/ai/flows/detect-language-flow';

interface EditorWorkspaceProps {
  openFiles: FileItem[];
  activeFilePath: string | null;
  onCloseTab: (filePath: string) => void;
  onSwitchTab: (filePath:string) => void;
  onFileContentChange: (filePath: string, newContent: string) => void;
}

const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({
  openFiles,
  activeFilePath,
  onCloseTab,
  onSwitchTab,
  onFileContentChange,
}) => {
  const activeFile = openFiles.find(file => file.path === activeFilePath) || null;
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);

  useEffect(() => {
    // Reset language when file changes
    setDetectedLanguage(null);
  }, [activeFilePath]);

  const handleRunDetection = useCallback(async () => {
    if (activeFile?.content && activeFile.content.trim().length > 0) {
      setDetectedLanguage('loading');
      try {
        const language = await detectLanguage(activeFile.content);
        setDetectedLanguage(language);
      } catch (error) {
        console.error("Failed to detect language:", error);
        setDetectedLanguage('Error');
      }
    }
  }, [activeFile?.content]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden relative">
      <FileTabsBar
        openFiles={openFiles}
        activeFilePath={activeFilePath}
        onCloseTab={onCloseTab}
        onTabClick={onSwitchTab}
        onRunClick={handleRunDetection}
      />
      <CodeEditorArea
        fileContent={activeFile?.content}
        fileName={activeFile?.name || "Untitled"}
        filePath={activeFile?.path}
        onContentChange={(newContent) => {
          if (activeFile?.path) {
            onFileContentChange(activeFile.path, newContent);
          }
        }}
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

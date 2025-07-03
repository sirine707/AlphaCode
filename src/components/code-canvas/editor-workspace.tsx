"use client";

import type React from "react";
import { useState, useEffect } from "react";
import FileTabsBar from "./file-tabs-bar";
import CodeEditorArea from "./code-editor-area";
import type { FileItem } from "./file-explorer-panel";
import { detectLanguage } from "@/lib/language-detection";

interface EditorWorkspaceProps {
  openFiles: FileItem[];
  activeFilePath: string | null;
  onCloseTab: (filePath: string) => void;
  onSwitchTab: (filePath: string) => void;
  onFileContentChange: (filePath: string, newContent: string) => void;
  isAutocompletionEnabled: boolean; // Corrected prop name based on code-canvas-layout
}

const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({
  openFiles,
  activeFilePath,
  onCloseTab,
  onSwitchTab,
  onFileContentChange,
  isAutocompletionEnabled, // Use the correct prop name
}) => {
  const activeFile = openFiles.find((f) => f.path === activeFilePath) || null;
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);

  useEffect(() => {
    // When the active file changes, detect its language from its path
    if (activeFile?.path) {
      const language = detectLanguage(activeFile.path);
      setDetectedLanguage(language);
    } else {
      setDetectedLanguage(null);
    }
  }, [activeFile]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden relative">
      {activeFile ? (
        <div className="flex-grow flex flex-col h-full">
          <FileTabsBar
            openFiles={openFiles}
            activeFilePath={activeFilePath}
            onTabClick={onSwitchTab}
            onCloseTab={onCloseTab}
          />
          <CodeEditorArea
            filePath={activeFile.path}
            fileContent={activeFile.content}
            onContentChange={(newContent) =>
              onFileContentChange(activeFile.path, newContent)
            }
            isAutocompletionEnabled={isAutocompletionEnabled} // Pass the prop down
            language={detectedLanguage} // Pass detected language
          />
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center bg-gray-800 text-gray-500">
          <div className="text-6xl font-bold text-blue-900 opacity-20 select-none">
            ALPHA
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorWorkspace;

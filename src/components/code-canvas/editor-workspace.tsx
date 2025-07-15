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
  isAutocompletionEnabled: boolean;
}

const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({
  openFiles,
  activeFilePath,
  onCloseTab,
  onSwitchTab,
  onFileContentChange,
  isAutocompletionEnabled,
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

  const handleRunFile = () => {
    // TODO: Implement logic to run the file
    console.log("Running file:", activeFile?.path);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden relative bg-background">
      {activeFile ? (
        <div className="flex-grow flex flex-col h-full">
          <FileTabsBar
            openFiles={openFiles}
            activeFilePath={activeFilePath}
            onTabClick={onSwitchTab}
            onCloseTab={onCloseTab}
            onRunClick={handleRunFile}
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
        <div className="flex h-full w-full flex-1 items-center justify-center bg-background">
          <div className="max-w-md text-center space-y-4">
            <div className="select-none text-6xl font-bold text-muted-foreground opacity-30">
              ALPHA
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Welcome to AlphaCode!</p>
              <p className="mt-2">
                Open a file from the explorer to start coding
              </p>
              <p className="mt-1 text-xs opacity-70">
                Click on any file in the left panel to begin
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorWorkspace;

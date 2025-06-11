
import type React from 'react';
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

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
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
      />
    </div>
  );
};

export default EditorWorkspace;

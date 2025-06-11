
import type React from 'react';
import FileTabsBar from './file-tabs-bar';
import CodeEditorArea from './code-editor-area';
import type { FileItem } from './file-explorer-panel';

interface EditorWorkspaceProps {
  activeFile: FileItem | null;
}

const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({ activeFile }) => {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <FileTabsBar activeFileName={activeFile?.name || null} />
      <CodeEditorArea fileContent={activeFile?.content} fileName={activeFile?.name || "Untitled"} />
    </div>
  );
};

export default EditorWorkspace;

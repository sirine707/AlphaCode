import type React from 'react';
import FileTabsBar from './file-tabs-bar';
import CodeEditorArea from './code-editor-area';

const EditorWorkspace: React.FC = () => {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <FileTabsBar />
      <CodeEditorArea />
    </div>
  );
};

export default EditorWorkspace;

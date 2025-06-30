
import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

const defaultWelcomeMessage = `
# Welcome to CodeCanvas!
# Click on a file in the explorer to open it.
# You can edit the content here.
`;

interface CodeEditorAreaProps {
  fileContent?: string;
  fileName?: string;
  filePath?: string | null; // Used to detect when active file changes
  onContentChange: (newContent: string) => void;
}

const CodeEditorArea: React.FC<CodeEditorAreaProps> = ({ fileContent, fileName, filePath, onContentChange }) => {
  const [code, setCode] = useState(fileContent !== undefined ? fileContent : defaultWelcomeMessage);

  useEffect(() => {
    const newContent = fileContent !== undefined ? fileContent : defaultWelcomeMessage;
    setCode(newContent);
  }, [fileContent, filePath]);

  const lines = code.split('\n');
  const lineCount = lines.length;

  const handleCodeChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = event.target.value;
    setCode(newCode);
    onContentChange(newCode);
  };

  return (
    <ScrollArea className="h-full flex-1 bg-background p-0">
      <div className="flex p-4 text-sm leading-relaxed font-code">
        <div className="mr-4 select-none text-right text-muted-foreground pr-2 border-r border-border">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1}>{i + 1}</div>
          ))}
        </div>
        <textarea
          value={code}
          onChange={handleCodeChange}
          className="flex-1 resize-none bg-transparent text-foreground outline-none p-0 m-0 border-0 whitespace-pre-wrap"
          spellCheck="false"
          rows={lineCount > 20 ? lineCount : 20}
          style={{
            fontFamily: 'inherit',
            fontSize: 'inherit',
            lineHeight: 'inherit',
            minHeight: `${lineCount * 1.5}em`
          }}
          aria-label={`Code editor for ${fileName || 'untitled'}`}
          key={filePath || 'welcome'} // Force re-render of textarea if filePath changes
        />
      </div>
    </ScrollArea>
  );
};

export default CodeEditorArea;

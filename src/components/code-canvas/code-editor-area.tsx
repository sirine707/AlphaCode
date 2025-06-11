
import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

const initialPythonCode = `
# Welcome to CodeCanvas!
# This is a simple Python example.

def greet(name):
  """This function greets the person passed in as a parameter."""
  print(f"Hello, {name}!")

if __name__ == "__main__":
  greet("Developer")

# Features:
# - VS Code Inspired UI
# - File Explorer
# - Tabbed Interface
# - Editable code area
`;

const CodeEditorArea: React.FC = () => {
  const [code, setCode] = useState(initialPythonCode);

  const lines = code.split('\n');
  const lineCount = lines.length;

  const handleCodeChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(event.target.value);
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
          rows={lineCount > 20 ? lineCount : 20} // Provides a sensible minimum height
          style={{ 
            fontFamily: 'inherit', 
            fontSize: 'inherit', 
            lineHeight: 'inherit',
            minHeight: `${lineCount * 1.5}em` // Attempt to dynamically adjust height based on lines
          }}
        />
      </div>
    </ScrollArea>
  );
};

export default CodeEditorArea;


import React, { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { detectLanguage } from '@/ai/flows/detect-language-flow';

const defaultWelcomeMessage = `
# Welcome to CodeCanvas!
# Click on a file in the explorer to open it.
# You can edit the content here.
`;

interface CodeEditorAreaProps {
  fileContent?: string;
  fileName?: string;
  filePath?: string | null; // Used to detect when active file changes
  onLanguageChange: (language: string | null) => void;
}

const CodeEditorArea: React.FC<CodeEditorAreaProps> = ({ fileContent, fileName, filePath, onLanguageChange }) => {
  const [code, setCode] = useState(fileContent !== undefined ? fileContent : defaultWelcomeMessage);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const newContent = fileContent !== undefined ? fileContent : defaultWelcomeMessage;
    setCode(newContent);
    // When a new file is loaded, immediately clear the language.
    // The detection will run in the next effect.
    onLanguageChange(null);
  }, [fileContent, filePath, onLanguageChange]);

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Trigger detection for reasonably short, potentially valid code.
    if (code && filePath && code !== defaultWelcomeMessage && code.trim().length >= 5) {
      debounceTimeoutRef.current = setTimeout(async () => {
        onLanguageChange('loading'); // Indicate that detection is in progress
        try {
          const language = await detectLanguage(code);
          onLanguageChange(language);
        } catch (error) {
          console.error("Failed to detect language:", error);
          onLanguageChange('Error'); // Show an error state
        }
      }, 1500); // 1.5-second debounce
    } else {
      // For very short code or no file, just set to Plain Text without calling AI
      onLanguageChange('Plain Text');
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [code, filePath, onLanguageChange]);

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

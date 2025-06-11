import type React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

const pythonCode = `
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
# - Syntax Highlighting (basic)
`;

// Basic syntax highlighting logic
const highlightedCodeLines = pythonCode
  .split('\\n')
  .map(line => line
    .replace(/(#.*)/g, '<span class="text-green-400">$1</span>') // Comments
    .replace(/\b(def|if|else|elif|for|while|return|class|try|except|finally|import|from|as|in|is|not|and|or|pass|break|continue|global|nonlocal|yield|with|True|False|None)\b/g, '<span class="text-blue-400 font-medium">$1</span>') // Keywords
    .replace(/(\bprint\b|\bgreet\b)/g, '<span class="text-purple-400">$1</span>') // Functions
    .replace(/("""[\s\S]*?"""|'''[\s\S]*?'''|".*?"|'.*?')/g, '<span class="text-orange-400">$1</span>') // Strings
  );


const CodeEditorArea: React.FC = () => {
  return (
    <ScrollArea className="h-full flex-1 bg-background p-0">
      <div className="flex p-4 text-sm leading-relaxed">
        <div className="mr-4 select-none text-right text-muted-foreground">
          {highlightedCodeLines.map((_, index) => (
            <div key={index}>{index + 1}</div>
          ))}
        </div>
        <pre className="flex-1">
          {highlightedCodeLines.map((line, index) => (
            <code key={index} dangerouslySetInnerHTML={{ __html: line || ' ' }} />
          ))}
        </pre>
      </div>
    </ScrollArea>
  );
};

export default CodeEditorArea;

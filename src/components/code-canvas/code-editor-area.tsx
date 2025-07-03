import React, { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  isAutocompletionEnabled: boolean; // Add this prop
  language: string | null; // Add this prop
}

const CodeEditorArea: React.FC<CodeEditorAreaProps> = ({
  fileContent,
  fileName,
  filePath,
  onContentChange,
  isAutocompletionEnabled, // Destructure the prop
  language, // Destructure the prop
}) => {
  const [code, setCode] = useState(
    fileContent !== undefined ? fileContent : defaultWelcomeMessage
  );
  const [suggestion, setSuggestion] = useState<string>("");
  const [totalLines, setTotalLines] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionOverlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newContent =
      fileContent !== undefined ? fileContent : defaultWelcomeMessage;
    setCode(newContent);
    setSuggestion(""); // Clear suggestion when file changes
  }, [fileContent, filePath]);

  const showSuggestion = isAutocompletionEnabled && suggestion;

  // This effect calculates the total number of lines including the wrapped suggestion
  useEffect(() => {
    const codeLines = code.split("\n").length;

    if (showSuggestion && suggestionOverlayRef.current) {
      const overlayHeight = suggestionOverlayRef.current.scrollHeight;
      const style = window.getComputedStyle(suggestionOverlayRef.current);
      const lineHeight =
        parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.625;

      if (lineHeight > 0) {
        const renderedLines = Math.ceil(overlayHeight / lineHeight);
        setTotalLines(renderedLines);
      } else {
        setTotalLines(codeLines); // Fallback
      }
    } else {
      setTotalLines(codeLines);
    }
  }, [code, suggestion, showSuggestion]);

  const handleCodeChange = async (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const newCode = event.target.value;
    setCode(newCode);
    onContentChange(newCode);
    setSuggestion(""); // Clear previous suggestion on new input

    if (isAutocompletionEnabled && language && newCode.length > 0) {
      try {
        const response = await fetch("/api/autocomplete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: newCode, language }),
        });

        if (response.ok) {
          const data = await response.json();
          setSuggestion(data.suggestion || "");
        } else {
          console.error("Autocompletion API error:", response.statusText);
          setSuggestion("");
        }
      } catch (error) {
        console.error("Error fetching autocompletion:", error);
        setSuggestion("");
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Tab" && suggestion) {
      event.preventDefault();
      const newCode = code + suggestion;
      setCode(newCode);
      onContentChange(newCode);
      setSuggestion("");
    }
  };

  return (
    <ScrollArea className="h-full flex-1 bg-background p-0">
      <div className="flex p-4 text-sm leading-relaxed font-code relative">
        <div className="mr-4 select-none text-right text-muted-foreground pr-2 border-r border-border">
          {Array.from({ length: totalLines > 0 ? totalLines : 1 }, (_, i) => (
            <div key={i + 1}>{i + 1}</div>
          ))}
        </div>
        <div className="flex-1" style={{ display: "grid" }}>
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleCodeChange}
            onKeyDown={handleKeyDown}
            className="col-start-1 row-start-1 resize-none bg-transparent text-foreground outline-none p-0 m-0 border-0 whitespace-pre-wrap z-10"
            spellCheck="false"
            style={{
              fontFamily: "inherit",
              fontSize: "inherit",
              lineHeight: "inherit",
              caretColor: "white", // Make cursor visible against grey text
            }}
            aria-label={`Code editor for ${fileName || "untitled"}`}
            key={filePath || "welcome"} // Force re-render of textarea if filePath changes
          />
          {showSuggestion && (
            <div
              ref={suggestionOverlayRef}
              className="col-start-1 row-start-1 pointer-events-none whitespace-pre-wrap"
              style={{
                fontFamily: "inherit",
                fontSize: "inherit",
                lineHeight: "inherit",
              }}
            >
              <span style={{ color: "transparent" }}>{code}</span>
              <span
                className="text-muted-foreground"
                style={{
                  textDecoration: "underline",
                  textDecorationColor: "rgba(156, 163, 175, 0.5)",
                }}
              >
                {suggestion}
              </span>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
};

export default CodeEditorArea;

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useCodeMirror } from "@uiw/react-codemirror";
import { githubDark } from "@uiw/codemirror-theme-github";
import { EditorView } from "@codemirror/view";
import { langs } from "@uiw/codemirror-extensions-langs";

const defaultCode = `// Welcome to your dark mode code editor
function greet(name) {
  console.log("Hello, " + name + "!");
}

greet("CodeCanvas");
`;

interface CodeEditorAreaProps {
  filePath?: string;
  fileContent?: string;
  onContentChange?: (content: string) => void;
  isAutocompletionEnabled?: boolean;
  language?: string;
}

// ✅ Use a module-level Map to persist content across component re-mounts
const globalFileContents = new Map<string, string>();

export default function CodeEditorArea({
  filePath,
  fileContent,
  onContentChange,
  isAutocompletionEnabled = false,
  language: propLanguage,
}: CodeEditorAreaProps) {
  const [language, setLanguage] = useState<keyof typeof langs>(
    (propLanguage as keyof typeof langs) || "javascript"
  );

  const currentFilePath = useRef<string | null>(null);
  const isUpdatingRef = useRef(false);

  // Update language when propLanguage changes
  useEffect(() => {
    if (propLanguage) {
      setLanguage((propLanguage as keyof typeof langs) || "javascript");
    }
  }, [propLanguage]);

  // Load the language extension
  const languageExtension = langs[language]?.() || langs.javascript();

  const { setContainer, view: editorView } = useCodeMirror({
    container: undefined,
    value: "", // Start with empty value
    extensions: [
      languageExtension,
      EditorView.updateListener.of((update) => {
        if (
          update.docChanged &&
          !isUpdatingRef.current &&
          currentFilePath.current
        ) {
          const newContent = update.state.doc.toString();
          // Update global map
          globalFileContents.set(currentFilePath.current, newContent);
          onContentChange?.(newContent);
        }
      }),
    ],
    theme: githubDark,
    basicSetup: {
      lineNumbers: true,
      autocompletion: isAutocompletionEnabled,
    },
  });

  // Initialize editor content when first mounted or file path changes
  useEffect(() => {
    // Update current file path tracking
    currentFilePath.current = filePath || null;

    if (editorView && filePath) {
      // Get content from global map or use file content or default
      const targetContent =
        globalFileContents.get(filePath) || fileContent || defaultCode;

      // Update global map with initial content if not exists
      if (!globalFileContents.has(filePath)) {
        globalFileContents.set(filePath, targetContent);
      }

      const currentEditorContent = editorView.state.doc.toString();

      if (currentEditorContent !== targetContent) {
        isUpdatingRef.current = true;
        editorView.dispatch({
          changes: {
            from: 0,
            to: editorView.state.doc.length,
            insert: targetContent,
          },
        });
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 10);
      }
    } else if (filePath && !globalFileContents.has(filePath)) {
      // Initialize content in global map even if editor isn't ready yet
      globalFileContents.set(filePath, fileContent || defaultCode);
    }
  }, [editorView, filePath, fileContent]);

  return (
    <div>
      {/* Optional: Language Selector */}
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as keyof typeof langs)}
        className="mb-4 p-2 bg-gray-800 text-white rounded"
      >
        {Object.keys(langs).map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>

      {/* Editor */}
      <div
        ref={(node) => {
          if (node) {
            setContainer(node);
          }
        }}
        className="codemirror-editor h-full w-full"
        style={{
          fontFamily: "monospace",
          fontSize: "16px",
          backgroundColor: "#1e1e1e",
          color: "#d4d4d4",
        }}
      />
    </div>
  );
}

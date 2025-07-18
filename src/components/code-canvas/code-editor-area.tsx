import React, { useState } from "react";
import { useCodeMirror } from "@uiw/react-codemirror";
import { githubDark } from "@uiw/codemirror-theme-github";
import { EditorView } from "@codemirror/view";

// ✅ Use langs from @uiw/codemirror-extensions-langs
import { loadLanguage, langs } from "@uiw/codemirror-extensions-langs";

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

export default function CodeEditorArea({
  filePath,
  fileContent,
  onContentChange,
  isAutocompletionEnabled = false,
  language: propLanguage,
}: CodeEditorAreaProps) {
  const [code, setCode] = useState(fileContent || defaultCode);
  const [language, setLanguage] = useState<keyof typeof langs>(
    (propLanguage as keyof typeof langs) || "javascript"
  );

  // ✅ Load language extension using langs
  const languageExtension = langs[language]?.() || langs.javascript();

  const { setContainer } = useCodeMirror({
    container: undefined,
    value: code,
    extensions: [
      // ✅ Use language extension from langs
      languageExtension,
      // ✅ Properly wrap the update listener in an EditorView extension
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newContent = update.state.doc.toString();
          setCode(newContent);
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
        ref={setContainer}
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

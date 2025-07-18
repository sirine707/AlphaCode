import React, { useState, useEffect } from "react";

interface SimpleTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

const SimpleTextEditor: React.FC<SimpleTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter text...",
  readOnly = false,
  className = "",
}) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`w-full h-full p-2 border-none outline-none bg-transparent resize-none ${className}`}
      spellCheck="false"
    />
  );
};

export default SimpleTextEditor;

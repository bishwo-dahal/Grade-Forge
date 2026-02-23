import { useCallback } from "react";
import Editor from "@monaco-editor/react";
import type { OnChange, OnMount } from "@monaco-editor/react";

/** Maps UI language names to Monaco editor language IDs. */
const LANGUAGE_MAP: Record<string, string> = {
  Python: "python",
  Java: "java",
  JavaScript: "javascript",
  TypeScript: "typescript",
  C: "c",
  "C++": "cpp",
};

function getMonacoLanguage(language: string): string {
  return LANGUAGE_MAP[language] ?? language.toLowerCase() ?? "plaintext";
}

export interface MonacoEditorProps {
  /** Current code content (controlled). */
  value: string;
  /** Display language name (e.g. "Python", "Java"). Mapped to Monaco language ID. */
  language: string;
  /** Called when content changes. */
  onChange?: (value: string) => void;
  /** Optional CSS height (e.g. "100%", "400px"). Defaults to "100%". */
  height?: string;
  /** Optional class name for the wrapper div. */
  className?: string;
  /** Optional: called when editor is mounted (e.g. to get editor instance). */
  onMount?: OnMount;
}

/**
 * Reusable Monaco code editor. Use for assignment workspace, grading view, or any code input.
 * Keeps editor logic in one place for consistent behavior and easy options changes.
 */
export function MonacoEditor({
  value,
  language,
  onChange,
  height = "100%",
  className,
  onMount,
}: MonacoEditorProps) {
  const monacoLanguage = getMonacoLanguage(language);

  const handleChange: OnChange = useCallback(
    (newValue) => {
      onChange?.(newValue ?? "");
    },
    [onChange]
  );

  return (
    <div className={className} style={{ height }}>
      <Editor
        height={height}
        language={monacoLanguage}
        value={value}
        onChange={handleChange}
        onMount={onMount}
        theme="vs-dark"
        loading={null}
        options={{
          minimap: { enabled: true },
          fontSize: 13,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          wordWrap: "on",
          padding: { top: 16 },
        }}
      />
    </div>
  );
}

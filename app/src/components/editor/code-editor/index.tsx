import Editor, { type OnMount } from "@monaco-editor/react";
import { useRef, useEffect } from "react";
import type * as MonacoType from "monaco-editor";
import { AutoTypings, LocalStorageCache } from "monaco-editor-auto-typings";

interface CodeEditorProps {
  language?: string;
  value?: string;
  onChange?: (value: string | undefined) => void;
  filePath?: string;
}

// Infer language from file extension
export const inferLanguage = (path?: string): string => {
  if (!path) return "typescript";
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":  return "typescript";
    case "js":
    case "jsx":  return "javascript";
    case "json": return "json";
    case "css":  return "css";
    case "html": return "html";
    case "yaml":
    case "yml": return "yaml";
    case "md":   return "markdown";
    default:     return "plaintext";
  }
}

export const CodeEditor = ({
  language,
  value = "",
  onChange,
  filePath,
}: CodeEditorProps) => {
  const editorRef   = useRef<MonacoType.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef   = useRef<typeof MonacoType | null>(null);
  const models      = useRef<Record<string, MonacoType.editor.ITextModel>>({});
  const viewStates  = useRef<Record<string, MonacoType.editor.ICodeEditorViewState | null>>({});
  const prevPathRef = useRef<string | undefined>(undefined);

  // Switch model when filePath changes
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco || !filePath) return;

    const prevPath = prevPathRef.current;
    const lang     = language ?? inferLanguage(filePath);

    // Save view state of the file we're leaving
    if (prevPath) {
      viewStates.current[prevPath] = editor.saveViewState();
    }

    // Get or create model for this file
    const uri = monaco.Uri.parse(`file:///${filePath}`);
    let model = models.current[filePath];

    if (!model) {
      const existing = monaco.editor.getModel(uri);
      model = existing ?? monaco.editor.createModel(value ?? "", lang, uri);
      models.current[filePath] = model;
    } else {
      // Sync content if it drifted
      if (model.getValue() !== value) {
        model.setValue(value ?? "");
      }
      // Update language if the extension changed
      if (model.getLanguageId() !== lang) {
        monaco.editor.setModelLanguage(model, lang);
      }
    }

    editor.setModel(model);

    // Restore scroll + cursor or reset to top
    const saved = viewStates.current[filePath];
    if (saved) {
      editor.restoreViewState(saved);
    } else {
      editor.setScrollTop(0);
    }

    editor.focus();
    prevPathRef.current = filePath;
  }, [filePath, language]);

  // Sync external content changes into the active model
  useEffect(() => {
    if (!filePath) return;
    const model = models.current[filePath];
    if (model && model.getValue() !== value) {
      model.setValue(value ?? "");
    }
  }, [value, filePath]);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current   = editor;
    monacoRef.current   = monaco;
    prevPathRef.current = filePath;

    // Theme
    monaco.editor.defineTheme("nexus-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment",  foreground: "6a9955", fontStyle: "italic" },
        { token: "keyword",  foreground: "c586c0" },
        { token: "string",   foreground: "ce9178" },
        { token: "number",   foreground: "b5cea8" },
        { token: "type",     foreground: "4ec9b0" },
        { token: "function", foreground: "dcdcaa" },
        { token: "variable", foreground: "9cdcfe" },
      ],
      colors: {
        "editor.background":                   "#19191d",
        "editor.foreground":                   "#d4d4d4",
        "editor.lineHighlightBackground":      "#ffffff06",
        "editor.selectionBackground":          "#f59e0b33",
        "editorCursor.foreground":             "#f59e0b",
        "editorLineNumber.foreground":         "#555555",
        "editorLineNumber.activeForeground":   "#888888",
        "editor.selectionHighlightBackground": "#f59e0b1a",
        "editorIndentGuide.background":        "#ffffff08",
        "editorIndentGuide.activeBackground":  "#ffffff15",
      },
    });
    monaco.editor.setTheme("nexus-dark");

    // Create initial model
    if (filePath) {
      const lang     = language ?? inferLanguage(filePath);
      const uri      = monaco.Uri.parse(`file:///${filePath}`);
      const existing = monaco.editor.getModel(uri);
      const model    = existing ?? monaco.editor.createModel(value ?? "", lang, uri);
      models.current[filePath] = model;
      editor.setModel(model);
    }

    editor.setScrollTop(0);
    editor.focus();

    AutoTypings.create(editor, {
      monaco,
      sourceCache:    new LocalStorageCache(),
      shareCache:     true,
      preloadPackages: true,
      onlySpecifiedPackages: false,
    });
  };

  return (
    <div className="flex-1 overflow-hidden">
      <Editor
        height="100%"
        // language and value intentionally omitted — models own both
        onChange={(val) => onChange?.(val)}
        onMount={handleMount}
        theme="nexus-dark"
        options={{
          fontSize: 13,
          lineHeight: 22,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontLigatures: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          padding: { top: 12 },
          renderLineHighlight: "gutter",
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          bracketPairColorization: { enabled: true },
          guides: { indentation: true, bracketPairs: true },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          wordWrap: "on",
          scrollbar: { vertical: "hidden", horizontal: "hidden" },
        }}
      />
    </div>
  );
};
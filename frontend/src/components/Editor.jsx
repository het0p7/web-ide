import { useRef, useEffect } from "react";
import Editor, { loader } from "@monaco-editor/react";
import { formatCode } from "../services/formatterService";
import { computeMinimalEdits } from "../utils/diffUtils";

// Register Formatting Provider Globally
loader.init().then((monaco) => {
  const languages = ["javascript", "typescript", "html", "css", "json", "java"];
  languages.forEach((lang) => {
    monaco.languages.registerDocumentFormattingEditProvider(lang, {
      provideDocumentFormattingEdits: async (model) => {
        const text = model.getValue();
        const filePath = model.uri.path;
        const formatted = await formatCode(text, filePath);

        if (text === formatted) return [];

        // Calculate minimal edits for a "snappier" visual update
        const minimalEdits = computeMinimalEdits(text, formatted);

        return minimalEdits.map((edit) => {
          const startPos = model.getPositionAt(edit.startOffset);
          const endPos = model.getPositionAt(edit.endOffset);

          return {
            range: {
              startLineNumber: startPos.lineNumber,
              startColumn: startPos.column,
              endLineNumber: endPos.lineNumber,
              endColumn: endPos.column,
            },
            text: edit.text,
          };
        });
      },
    });
  });
});

export default function CodeEditor({ filePath, content, onChange, onSave, settings }) {
  const editorRef = useRef(null);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // Intercept Save Keyboard Shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSaveRef.current) onSaveRef.current(editor.getValue());
    });
  };

  const handleEditorChange = (value) => {
    if (onChange) onChange(value);
  };

  const getLanguage = (filePath) => {
    if (!filePath) return "plaintext";
    const ext = filePath.split(".").pop().toLowerCase();
    switch (ext) {
      case "js":
      case "jsx":
        return "javascript";
      case "ts":
      case "tsx":
        return "typescript";
      case "py":
        return "python";
      case "java":
        return "java";
      case "c":
        return "c";
      case "cpp":
      case "h":
      case "hpp":
        return "cpp";
      case "html":
        return "html";
      case "css":
        return "css";
      case "scss":
        return "scss";
      case "json":
        return "json";
      case "md":
        return "markdown";
      case "yml":
      case "yaml":
        return "yaml";
      case "xml":
        return "xml";
      case "sh":
      case "bash":
      case "env":
        return "shell";
      default:
        return "plaintext";
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <Editor
          height="100%"
          language={getLanguage(filePath)}
          value={content}
          onMount={handleEditorDidMount}
          onChange={handleEditorChange}
          theme={settings?.theme || "vs-dark"}
          options={{
            selectOnLineNumbers: true,
            automaticLayout: true,
            fontSize: settings?.fontSize || 14,
            fontFamily: settings?.fontFamily || "'Ubuntu Mono', monospace",
            mouseWheelZoom: settings?.mouseWheelZoom || false,
            tabSize: settings?.tabSize || 2,
            lineNumbers: settings?.lineNumbers ? "on" : "off",
            roundedSelection: true,
            scrollBeyondLastLine: false,
            readOnly: false,
            wordWrap: "on",
            padding: { top: 10, bottom: 10 },
            
            // Premium Defaults
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true,
            fontLigatures: true,
            matchBrackets: "always",
            autoClosingBrackets: "always",
            autoClosingQuotes: "always",
            colorDecorators: true,
            renderLineHighlight: "all",
            
            // User Toggles
            stickyScroll: { enabled: settings?.stickyScroll ?? true },
            minimap: { enabled: settings?.minimap ?? false },
            bracketPairColorization: { enabled: settings?.bracketColorization ?? true },
            renderWhitespace: settings?.renderWhitespace ? "all" : "none",
          }}
        />
      </div>
    </div>
  );
}
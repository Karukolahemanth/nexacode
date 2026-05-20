"use client";

import React, { useCallback } from "react";
import dynamic from "next/dynamic";
import { useEditorStore } from "@/stores/editorStore";
import { nexusDarkTheme } from "@/lib/themes";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react"),
  { ssr: false }
);

export default function CodeEditor() {
  const { tabs, activeTabId, updateContent } = useEditorStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  const handleEditorDidMount = useCallback(
    (editor: unknown, monaco: { editor: { defineTheme: (name: string, theme: unknown) => void; setTheme: (name: string) => void } }) => {
      // Register custom theme
      monaco.editor.defineTheme("nexus-dark", nexusDarkTheme as unknown as Parameters<typeof monaco.editor.defineTheme>[1]);
      monaco.editor.setTheme("nexus-dark");
    },
    []
  );

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (activeTab && value !== undefined) {
        updateContent(activeTab.id, value);
      }
    },
    [activeTab, updateContent]
  );

  if (!activeTab) return null;

  return (
    <div className="w-full h-full">
      <MonacoEditor
        key={activeTab.id}
        height="100%"
        language={activeTab.language}
        value={activeTab.content}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme="nexus-dark"
        options={{
          fontSize: 14,
          fontFamily: "var(--font-mono), 'JetBrains Mono', 'Fira Code', monospace",
          fontLigatures: true,
          lineHeight: 22,
          padding: { top: 12, bottom: 12 },
          minimap: {
            enabled: true,
            scale: 1,
            showSlider: "mouseover",
          },
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          renderLineHighlight: "line",
          renderWhitespace: "selection",
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,
          wordWrap: "off",
          tabSize: 2,
          insertSpaces: true,
          autoIndent: "advanced",
          formatOnPaste: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnCommitCharacter: true,
          snippetSuggestions: "inline",
          suggest: {
            preview: true,
            showMethods: true,
            showFunctions: true,
            showConstructors: true,
            showFields: true,
            showVariables: true,
            showClasses: true,
            showStructs: true,
            showInterfaces: true,
            showModules: true,
            showProperties: true,
            showEvents: true,
            showOperators: true,
            showUnits: true,
            showValues: true,
            showConstants: true,
            showEnums: true,
            showEnumMembers: true,
            showKeywords: true,
            showWords: true,
            showColors: true,
            showFiles: true,
            showReferences: true,
          },
        }}
      />
    </div>
  );
}

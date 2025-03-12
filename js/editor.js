// Editor functionality for VS Code Clone

// Editor settings
const editorSettings = {
  theme: "vs-dark",
  fontSize: 14,
  tabSize: 4,
  wordWrap: "off",
  autoIndent: true,
  formatOnType: false,
  formatOnPaste: false,
  minimap: true,
  lineNumbers: true,
  renderWhitespace: "none",
  scrollBeyondLastLine: false,
};

// Initialize editor functionality
document.addEventListener("DOMContentLoaded", () => {
  initEditorSettings();
  initEditorContextMenu();
  initEditorCommands();
  initEditorThemes();
});

// Initialize editor settings
function initEditorSettings() {
  // In a real app, this would load settings from storage
  // For this demo, we'll use the default settings

  // Apply settings to Monaco editor when it's loaded
  if (typeof monaco !== "undefined" && editor) {
    applyEditorSettings();
  } else {
    // Wait for Monaco to be loaded
    const checkMonaco = setInterval(() => {
      if (typeof monaco !== "undefined" && editor) {
        applyEditorSettings();
        clearInterval(checkMonaco);
      }
    }, 100);
  }
}

// Apply editor settings to Monaco editor
function applyEditorSettings() {
  editor.updateOptions({
    fontSize: editorSettings.fontSize,
    tabSize: editorSettings.tabSize,
    wordWrap: editorSettings.wordWrap,
    autoIndent: editorSettings.autoIndent,
    formatOnType: editorSettings.formatOnType,
    formatOnPaste: editorSettings.formatOnPaste,
    minimap: {
      enabled: editorSettings.minimap,
    },
    lineNumbers: editorSettings.lineNumbers ? "on" : "off",
    renderWhitespace: editorSettings.renderWhitespace,
    scrollBeyondLastLine: editorSettings.scrollBeyondLastLine,
  });
}

// Initialize editor context menu
function initEditorContextMenu() {
  // In a real app, this would add custom context menu items to Monaco editor
  // For this demo, we'll use the default context menu
}

// Initialize editor commands
function initEditorCommands() {
  // Add keyboard shortcuts for editor commands
  document.addEventListener("keydown", (e) => {
    // Ctrl+S to save
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      saveCurrentFile();
    }

    // Ctrl+F to find
    if (e.ctrlKey && e.key === "f") {
      e.preventDefault();
      showFindWidget();
    }

    // Ctrl+H to replace
    if (e.ctrlKey && e.key === "h") {
      e.preventDefault();
      showReplaceWidget();
    }

    // Ctrl+Z to undo
    if (e.ctrlKey && e.key === "z") {
      e.preventDefault();
      editor.trigger("keyboard", "undo", null);
    }

    // Ctrl+Y to redo
    if (e.ctrlKey && e.key === "y") {
      e.preventDefault();
      editor.trigger("keyboard", "redo", null);
    }

    // Ctrl+/ to toggle comment
    if (e.ctrlKey && e.key === "/") {
      e.preventDefault();
      editor.trigger("keyboard", "editor.action.commentLine", null);
    }

    // Ctrl+Space to show suggestions
    if (e.ctrlKey && e.key === " ") {
      e.preventDefault();
      editor.trigger("keyboard", "editor.action.triggerSuggest", null);
    }

    // F12 to go to definition
    if (e.key === "F12") {
      e.preventDefault();
      editor.trigger("keyboard", "editor.action.revealDefinition", null);
    }
  });
}

// Initialize editor themes
function initEditorThemes() {
  // In a real app, this would load custom themes
  // For this demo, we'll use the default VS Code dark theme
}

// Save current file
function saveCurrentFile() {
  if (currentFile) {
    // In a real app, this would save to the server or local storage
    fileContents[currentFile] = editor.getValue();

    // Show notification
    showNotification(`File ${currentFile} saved`);
  }
}

// Show find widget
function showFindWidget() {
  if (editor) {
    editor.trigger("keyboard", "actions.find", null);
  }
}

// Show replace widget
function showReplaceWidget() {
  if (editor) {
    editor.trigger("keyboard", "editor.action.startFindReplaceAction", null);
  }
}

// Format document
function formatDocument() {
  if (editor) {
    editor.trigger("keyboard", "editor.action.formatDocument", null);
  }
}

// Toggle word wrap
function toggleWordWrap() {
  if (editor) {
    editorSettings.wordWrap = editorSettings.wordWrap === "off" ? "on" : "off";
    editor.updateOptions({
      wordWrap: editorSettings.wordWrap,
    });
  }
}

// Toggle minimap
function toggleMinimap() {
  if (editor) {
    editorSettings.minimap = !editorSettings.minimap;
    editor.updateOptions({
      minimap: {
        enabled: editorSettings.minimap,
      },
    });
  }
}

// Change font size
function changeFontSize(size) {
  if (editor) {
    editorSettings.fontSize = size;
    editor.updateOptions({
      fontSize: size,
    });
  }
}

// Change tab size
function changeTabSize(size) {
  if (editor) {
    editorSettings.tabSize = size;
    editor.updateOptions({
      tabSize: size,
    });
  }
}

// Toggle line numbers
function toggleLineNumbers() {
  if (editor) {
    editorSettings.lineNumbers = !editorSettings.lineNumbers;
    editor.updateOptions({
      lineNumbers: editorSettings.lineNumbers ? "on" : "off",
    });
  }
}

// Toggle render whitespace
function toggleRenderWhitespace() {
  if (editor) {
    editorSettings.renderWhitespace =
      editorSettings.renderWhitespace === "none" ? "all" : "none";
    editor.updateOptions({
      renderWhitespace: editorSettings.renderWhitespace,
    });
  }
}

// Create a new editor model
function createEditorModel(content, language) {
  return monaco.editor.createModel(content, language);
}

// Set editor language
function setEditorLanguage(language) {
  if (editor && currentFile) {
    const model = editor.getModel();
    monaco.editor.setModelLanguage(model, language);

    // Update status bar
    const languageIndicator = document.querySelector(
      ".status-right .status-item:last-child span"
    );
    if (languageIndicator) {
      languageIndicator.textContent =
        language.charAt(0).toUpperCase() + language.slice(1);
    }
  }
}

// Get editor content
function getEditorContent() {
  if (editor) {
    return editor.getValue();
  }
  return "";
}

// Set editor content
function setEditorContent(content) {
  if (editor) {
    editor.setValue(content);
  }
}

// Get editor selection
function getEditorSelection() {
  if (editor) {
    return editor.getSelection();
  }
  return null;
}

// Set editor selection
function setEditorSelection(
  startLineNumber,
  startColumn,
  endLineNumber,
  endColumn
) {
  if (editor) {
    const selection = new monaco.Selection(
      startLineNumber,
      startColumn,
      endLineNumber,
      endColumn
    );
    editor.setSelection(selection);
  }
}

// Get editor position
function getEditorPosition() {
  if (editor) {
    return editor.getPosition();
  }
  return null;
}

// Set editor position
function setEditorPosition(lineNumber, column) {
  if (editor) {
    const position = new monaco.Position(lineNumber, column);
    editor.setPosition(position);
    editor.revealPositionInCenter(position);
  }
}

// Focus editor
function focusEditor() {
  if (editor) {
    editor.focus();
  }
}

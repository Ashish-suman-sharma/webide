// Main JavaScript file for VS Code Clone

// Global variables
let editor; // Monaco editor instance
let currentFile = null; // Currently open file
let openFiles = []; // List of open files
let fileContents = {}; // In-memory file contents
let isTerminalOpen = false;
let terminal; // Terminal instance

// Initialize the application when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  initMonacoEditor();
  initActivityBar();
  initSidebar();
  initEditorTabs();
  initTerminal();
  initStatusBar();
  initContextMenus();
  initWelcomePage();
  restoreOpenFilesFromLocalStorage();
});

// Initialize Monaco Editor
function initMonacoEditor() {
  // Configure RequireJS loading for Monaco Editor
  require.config({
    paths: {
      vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.43.0/min/vs",
    },
  });

  // Load Monaco Editor
  require(["vs/editor/editor.main"], function () {
    // Create Monaco editor instance
    editor = monaco.editor.create(document.getElementById("monaco-editor"), {
      value: currentFile ? fileContents[currentFile] : "",
      language: currentFile
        ? getLanguageFromFileName(currentFile)
        : "plaintext",
      theme: "vs-dark",
      automaticLayout: true,
      minimap: {
        enabled: true,
      },
      scrollBeyondLastLine: false,
      renderLineHighlight: "all",
      scrollbar: {
        useShadows: false,
        verticalHasArrows: false,
        horizontalHasArrows: false,
        vertical: "visible",
        horizontal: "visible",
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
      },
    });

    // Set up editor events
    editor.onDidChangeModelContent((e) => {
      // Save content when it changes
      if (currentFile) {
        fileContents[currentFile] = editor.getValue();

        // Mark file as having unsaved changes if it's a local file
        if (fileHandles && fileHandles[currentFile]) {
          markUnsavedChanges(currentFile);
        }

        // Save file content to localStorage
        saveFileContentsToLocalStorage();
      }

      updateStatusBar();
    });

    editor.onDidChangeCursorPosition((e) => {
      updateStatusBar();
    });

    // Initial status bar update
    updateStatusBar();
  });
}

// Initialize Welcome Page
function initWelcomePage() {
  const openFolderBtn = document.getElementById("welcome-page-open-folder");
  const openFileBtn = document.getElementById("welcome-page-open-file");
  const newFileBtn = document.getElementById("welcome-page-new-file");

  if (openFolderBtn) {
    openFolderBtn.addEventListener("click", () => {
      if (typeof openFolder === "function") {
        openFolder();
      }
    });
  }

  if (openFileBtn) {
    openFileBtn.addEventListener("click", () => {
      if (typeof openSingleFile === "function") {
        openSingleFile();
      }
    });
  }

  if (newFileBtn) {
    newFileBtn.addEventListener("click", () => {
      // If we have a folder open, use the inline creation method
      if (
        rootDirectoryHandle &&
        typeof createInlineNewFileInput === "function"
      ) {
        createInlineNewFileInput();
      } else {
        // For in-memory files without a folder open, create a temporary file
        const fileName = prompt("Enter file name:");
        if (fileName && fileName.trim()) {
          // Don't create untitled.txt, use the user-provided name
          createNewFile(fileName.trim());
        }
      }
    });
  }

  // Show welcome page initially
  showWelcomePage();
}

// Show Welcome Page
function showWelcomePage() {
  const monacoEditor = document.getElementById("monaco-editor");
  const welcomePage = document.getElementById("welcome-page");

  if (monacoEditor) {
    monacoEditor.classList.remove("show-editor");
  }

  if (welcomePage) {
    welcomePage.classList.add("show-welcome");
  }
}

// Show Editor (hide welcome page)
function showEditor() {
  const monacoEditor = document.getElementById("monaco-editor");
  const welcomePage = document.getElementById("welcome-page");

  if (monacoEditor) {
    monacoEditor.classList.add("show-editor");
  }

  if (welcomePage) {
    welcomePage.classList.remove("show-welcome");
  }
}

// Restore open files from local storage
function restoreOpenFilesFromLocalStorage() {
  try {
    // Clear editor tabs first
    const tabsContainer = document.querySelector(".editor-tabs");
    if (tabsContainer) {
      tabsContainer.innerHTML = "";
    }

    // Restore file contents
    const savedFileContents = localStorage.getItem("fileContents");
    if (savedFileContents) {
      fileContents = JSON.parse(savedFileContents);
    }

    // Restore open files
    const savedOpenFiles = localStorage.getItem("openFiles");
    if (savedOpenFiles) {
      openFiles = JSON.parse(savedOpenFiles);

      // Create tabs for each open file
      openFiles.forEach((file) => {
        addEditorTab(file);
      });
    }

    // Restore current file
    const savedCurrentFile = localStorage.getItem("currentFile");
    if (savedCurrentFile && openFiles.includes(savedCurrentFile)) {
      currentFile = savedCurrentFile;

      // When Monaco is ready, set the content
      const waitForMonaco = setInterval(() => {
        if (editor) {
          openFile(currentFile);
          clearInterval(waitForMonaco);
        }
      }, 100);
    }

    // Show welcome page if no files are open
    if (openFiles.length === 0) {
      showWelcomePage();
    } else {
      showEditor();
    }

    // Update active tabs
    updateActiveTabs();
  } catch (error) {
    console.error("Error restoring files from local storage:", error);
    showWelcomePage();
  }
}

// Save file contents to local storage
function saveFileContentsToLocalStorage() {
  try {
    // Only store in-memory files (not the ones from FileSystem API)
    const inMemoryFiles = {};
    Object.keys(fileContents).forEach((file) => {
      // Skip files that have file handles (they're stored on disk)
      if (!fileHandles[file]) {
        inMemoryFiles[file] = fileContents[file];
      }
    });

    localStorage.setItem("fileContents", JSON.stringify(inMemoryFiles));
    localStorage.setItem("openFiles", JSON.stringify(openFiles));

    if (currentFile) {
      localStorage.setItem("currentFile", currentFile);
    }
  } catch (error) {
    console.warn("Error saving files to local storage:", error);
  }
}

// Get language ID from file name for Monaco Editor
function getLanguageFromFileName(fileName) {
  const extension = fileName.split(".").pop().toLowerCase();
  const languageMap = getLanguageMap();
  return languageMap[extension] || "plaintext";
}

// Initialize Activity Bar
function initActivityBar() {
  const activityIcons = document.querySelectorAll(".activity-icon");

  activityIcons.forEach((icon) => {
    icon.addEventListener("click", () => {
      // Remove active class from all icons
      activityIcons.forEach((i) => i.classList.remove("active"));

      // Add active class to clicked icon
      icon.classList.add("active");

      // Show corresponding panel
      const panelName = icon.getAttribute("data-panel");
      showPanel(panelName);
    });
  });
}

// Show panel in sidebar
function showPanel(panelName) {
  // Hide all panels
  const panels = document.querySelectorAll(".panel");
  panels.forEach((panel) => panel.classList.remove("active-panel"));

  // Show selected panel
  const selectedPanel = document.querySelector(`.${panelName}-panel`);
  if (selectedPanel) {
    selectedPanel.classList.add("active-panel");
  }
}

// Initialize Sidebar
function initSidebar() {
  // Handle folder toggle in file explorer
  const folderHeaders = document.querySelectorAll(".folder-header");

  folderHeaders.forEach((header) => {
    header.addEventListener("click", () => {
      const folderItem = header.parentElement;
      folderItem.classList.toggle("open");

      // Toggle folder icon
      const folderIcon = header.querySelector(".fa-folder, .fa-folder-open");
      if (folderIcon) {
        folderIcon.classList.toggle("fa-folder");
        folderIcon.classList.toggle("fa-folder-open");
      }

      // Toggle chevron icon
      const chevronIcon = header.querySelector(".fa-chevron-right");
      if (chevronIcon) {
        chevronIcon.style.transform = folderItem.classList.contains("open")
          ? "rotate(90deg)"
          : "";
      }
    });
  });

  // Handle file click in file explorer
  const fileItems = document.querySelectorAll(".file-item");

  fileItems.forEach((item) => {
    item.addEventListener("click", () => {
      const fileName = item.getAttribute("data-file");
      if (fileName) {
        openFile(fileName);
      }
    });
  });
}

// Open a file in the editor
function openFile(fileName) {
  // Save current file content
  if (editor && currentFile) {
    fileContents[currentFile] = editor.getValue();
  }

  // Set current file
  currentFile = fileName;

  // Add to open files if not already there
  if (!openFiles.includes(fileName)) {
    openFiles.push(fileName);
    addEditorTab(fileName);

    // Save to local storage
    saveFileContentsToLocalStorage();
  }

  // Update editor content and language
  if (editor) {
    const model = monaco.editor.createModel(
      fileContents[fileName] || "",
      getLanguageFromFileName(fileName)
    );
    editor.setModel(model);
  }

  // Show editor (hide welcome page)
  showEditor();

  // Update active tab
  updateActiveTabs();

  // Update status bar
  updateStatusBar();

  // Update run button based on file extension
  if (typeof updateRunButton === "function") {
    updateRunButton();
  }
}

// Initialize Editor Tabs
function initEditorTabs() {
  // Handle tab click
  const tabs = document.querySelectorAll(".tab");

  tabs.forEach((tab) => {
    const tabName = tab.querySelector("span").textContent;

    // Tab click event
    tab.addEventListener("click", (e) => {
      if (!e.target.classList.contains("fa-times")) {
        openFile(tabName);
      }
    });

    // Close button click event
    const closeBtn = tab.querySelector(".fa-times");
    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeFile(tabName);
      });
    }
  });
}

// Add a new editor tab
function addEditorTab(fileName) {
  const tabsContainer = document.querySelector(".editor-tabs");

  // Use the file name without the path for display
  const displayName = getFileNameFromPath(fileName);

  const tab = document.createElement("div");
  tab.className = "tab";
  tab.innerHTML = `<span>${displayName}</span><i class="fas fa-times"></i>`;

  // Add unsaved class if file has unsaved changes
  if (fileHandles && fileHandles[fileName] && hasUnsavedChanges(fileName)) {
    tab.classList.add("unsaved");
  }

  // Tab click event
  tab.addEventListener("click", (e) => {
    if (!e.target.classList.contains("fa-times")) {
      openFile(fileName);
    }
  });

  // Close button click event
  const closeBtn = tab.querySelector(".fa-times");
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeFile(fileName);
  });

  tabsContainer.appendChild(tab);
}

// Close a file
function closeFile(fileName) {
  // Check for unsaved changes
  if (fileHandles && fileHandles[fileName] && hasUnsavedChanges(fileName)) {
    const confirmClose = confirm(
      `Do you want to save the changes to ${getFileNameFromPath(
        fileName
      )} before closing?`
    );
    if (confirmClose) {
      saveLocalFile(fileName).then((saved) => {
        if (saved) {
          closeFileInternal(fileName);
        }
      });
      return;
    }
  }

  closeFileInternal(fileName);
}

// Internal function to close a file
function closeFileInternal(fileName) {
  const index = openFiles.indexOf(fileName);
  if (index !== -1) {
    openFiles.splice(index, 1);

    // Remove tab
    const tabs = document.querySelectorAll(".tab");
    tabs.forEach((tab) => {
      const tabName = tab.querySelector("span").textContent;
      if (tabName === getFileNameFromPath(fileName)) {
        tab.remove();
      }
    });

    // If we closed the current file, open another one
    if (fileName === currentFile && openFiles.length > 0) {
      openFile(openFiles[0]);
    } else if (openFiles.length === 0) {
      // No files open, clear editor and show welcome page
      if (editor) {
        editor.setValue("");
      }
      currentFile = null;

      // Update localStorage
      localStorage.removeItem("currentFile");

      // Show welcome page
      showWelcomePage();
    }

    // Save updated open files to localStorage
    saveFileContentsToLocalStorage();

    updateActiveTabs();
  }
}

// Update active tabs
function updateActiveTabs() {
  const tabs = document.querySelectorAll(".tab");

  tabs.forEach((tab) => {
    const tabName = tab.querySelector("span").textContent;
    const isActive = tabName === getFileNameFromPath(currentFile);

    if (isActive) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });
}

// Initialize Terminal
function initTerminal() {
  const terminalToggle = document.querySelector(".status-item:nth-child(3)");
  if (terminalToggle) {
    terminalToggle.addEventListener("click", toggleTerminal);
  }

  const terminalClose = document.querySelector(
    ".terminal-actions .fa-chevron-up"
  );
  if (terminalClose) {
    terminalClose.addEventListener("click", toggleTerminal);
  }

  // Initialize the terminal with the terminal-content element
  terminal = new Terminal(document.querySelector(".terminal-content"));

  // Add clear terminal functionality
  const clearTerminalBtn = document.createElement("i");
  clearTerminalBtn.className = "fas fa-eraser";
  clearTerminalBtn.title = "Clear Terminal";
  clearTerminalBtn.addEventListener("click", () => {
    if (terminal) {
      terminal.clear();
    }
  });

  // Add to terminal actions
  const terminalActions = document.querySelector(".terminal-actions");
  terminalActions.insertBefore(clearTerminalBtn, terminalActions.firstChild);
}

// Toggle terminal visibility
function toggleTerminal() {
  const terminal = document.querySelector(".terminal-panel");
  isTerminalOpen = !isTerminalOpen;

  if (isTerminalOpen) {
    terminal.classList.add("show");
    // Focus the terminal input when opened
    setTimeout(() => {
      const input = document.querySelector(".terminal-command-input");
      if (input) {
        input.focus();
      }
    }, 100);
  } else {
    terminal.classList.remove("show");
  }
}

// Initialize Status Bar
function initStatusBar() {
  // Status bar items click events can be added here
}

// Update Status Bar
function updateStatusBar() {
  if (!editor) return;

  const position = editor.getPosition();
  if (position) {
    const lineCol = document.querySelector(
      ".status-right .status-item:first-child span"
    );
    if (lineCol) {
      lineCol.textContent = `Ln ${position.lineNumber}, Col ${position.column}`;
    }
  }

  const languageIndicator = document.querySelector(
    ".status-right .status-item:last-child span"
  );
  if (languageIndicator && currentFile) {
    const language = getLanguageFromFileName(currentFile);
    languageIndicator.textContent =
      language.charAt(0).toUpperCase() + language.slice(1);
  }
}

// Initialize Context Menus
function initContextMenus() {
  // Right-click event handlers can be added here
  document.addEventListener("contextmenu", (e) => {
    // Prevent default context menu
    e.preventDefault();

    // Custom context menu logic can be added here
  });
}

// Save file function
function saveFile(fileName) {
  // Check if it's a local file
  if (fileHandles && fileHandles[fileName]) {
    saveLocalFile(fileName);
    return;
  }

  // For in-memory files
  console.log(`Saving file: ${fileName}`);

  // For demo purposes, we just update our in-memory storage
  if (editor && fileName === currentFile) {
    fileContents[fileName] = editor.getValue();
  }

  // Show a notification
  showNotification(`File ${getFileNameFromPath(fileName)} saved`);
}

// Show notification
function showNotification(message, duration = 3000) {
  // Create notification element if it doesn't exist
  let notification = document.querySelector(".vscode-notification");
  if (!notification) {
    notification = document.createElement("div");
    notification.className = "vscode-notification";
    document.body.appendChild(notification);

    // Style the notification
    notification.style.position = "fixed";
    notification.style.bottom = "30px";
    notification.style.right = "20px";
    notification.style.backgroundColor = "#252526";
    notification.style.color = "#cccccc";
    notification.style.padding = "10px 15px";
    notification.style.borderRadius = "5px";
    notification.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.3)";
    notification.style.zIndex = "1000";
    notification.style.transition = "opacity 0.3s";
  }

  // Set message and show notification
  notification.textContent = message;
  notification.style.opacity = "1";

  // Hide notification after duration
  setTimeout(() => {
    notification.style.opacity = "0";
  }, duration);
}

// Add keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Ctrl+S to save
  if (e.ctrlKey && e.key === "s") {
    e.preventDefault();
    if (currentFile) {
      saveFile(currentFile);
    }
  }

  // Ctrl+` to toggle terminal
  if (e.ctrlKey && e.key === "`") {
    e.preventDefault();
    toggleTerminal();
  }

  // Ctrl+O to open folder
  if (e.ctrlKey && e.key === "o") {
    e.preventDefault();
    if (typeof openFolder === "function") {
      openFolder();
    }
  }
});

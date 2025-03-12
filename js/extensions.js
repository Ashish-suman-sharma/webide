// Extensions functionality for VS Code Clone

// Store installed extensions
const installedExtensions = [
  {
    id: "live-server",
    name: "Live Server",
    publisher: "ritwickdey",
    version: "5.7.9",
    description: "Launch a development local server with live reload feature",
    icon: "fa-solid fa-globe",
    enabled: true,
    supportsFileTypes: ["html", "htm"],
    command: function (filePath) {
      // Get the directory of the file
      const directory =
        filePath.substring(0, filePath.lastIndexOf("/") + 1) ||
        filePath.substring(0, filePath.lastIndexOf("\\") + 1) ||
        "";
      return `npx live-server "${directory}" --file="${getFileNameFromPath(
        filePath
      )}"`;
    },
  },
  {
    id: "code-runner",
    name: "Code Runner",
    publisher: "formulahendry",
    version: "0.12.0",
    description: "Run code snippet or code file for multiple languages",
    icon: "fa-solid fa-play",
    enabled: true,
    supportsFileTypes: [
      "js",
      "py",
      "java",
      "c",
      "cpp",
      "php",
      "rb",
      "go",
      "rust",
      "ts",
      "sh",
      "bat",
      "cs",
    ],
    command: function (filePath) {
      const extension = filePath.split(".").pop().toLowerCase();
      const fileName = getFileNameFromPath(filePath);

      // Generate command based on file type
      switch (extension) {
        case "js":
          return `node "${filePath}"`;
        case "py":
          return `python "${filePath}"`;
        case "java":
          return `javac "${filePath}" && java "${fileName.replace(
            ".java",
            ""
          )}"`;
        case "c":
          return `gcc "${filePath}" -o "${fileName.replace(
            ".c",
            ""
          )}" && "${fileName.replace(".c", "")}"`;
        case "cpp":
          return `g++ "${filePath}" -o "${fileName.replace(
            ".cpp",
            ""
          )}" && "${fileName.replace(".cpp", "")}"`;
        case "php":
          return `php "${filePath}"`;
        case "rb":
          return `ruby "${filePath}"`;
        case "go":
          return `go run "${filePath}"`;
        case "rust":
        case "rs":
          return `rustc "${filePath}" && "${fileName.replace(".rs", "")}"`;
        case "ts":
          return `tsc "${filePath}" && node "${filePath.replace(
            ".ts",
            ".js"
          )}"`;
        case "sh":
          return `bash "${filePath}"`;
        case "bat":
        case "cmd":
          return `"${filePath}"`;
        case "cs":
          return `dotnet run "${filePath}"`;
        default:
          return `echo "No run configuration for .${extension} files"`;
      }
    },
  },
];

// Initialize extensions functionality
document.addEventListener("DOMContentLoaded", () => {
  initExtensionsPanel();
  initRunButton();
});

// Initialize extensions panel with installed extensions
function initExtensionsPanel() {
  const extensionsList = document.querySelector(".extensions-list");
  if (!extensionsList) return;

  // Clear the "No extensions installed" message
  extensionsList.innerHTML = "";

  // Create extension items
  installedExtensions.forEach((ext) => {
    const extItem = document.createElement("div");
    extItem.className = "extension-item";
    extItem.dataset.extId = ext.id;

    extItem.innerHTML = `
      <div class="extension-header">
        <i class="${ext.icon}"></i>
        <div class="extension-info">
          <div class="extension-name">${ext.name}</div>
          <div class="extension-publisher">${ext.publisher}</div>
        </div>
        <div class="extension-version">${ext.version}</div>
      </div>
      <div class="extension-description">${ext.description}</div>
      <div class="extension-footer">
        <button class="extension-config-btn">
          <i class="fa-solid fa-gear"></i>
        </button>
        <div class="extension-toggle">
          <label class="switch">
            <input type="checkbox" ${ext.enabled ? "checked" : ""}>
            <span class="slider round"></span>
          </label>
        </div>
      </div>
    `;

    // Toggle extension enabled state
    const toggle = extItem.querySelector("input[type=checkbox]");
    toggle.addEventListener("change", (e) => {
      const extId = extItem.dataset.extId;
      const ext = installedExtensions.find((e) => e.id === extId);
      if (ext) {
        ext.enabled = e.target.checked;
        updateRunButton();
      }
    });

    extensionsList.appendChild(extItem);
  });

  // Add search functionality
  const searchInput = document.querySelector(".extensions-search input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase();

      const extItems = extensionsList.querySelectorAll(".extension-item");
      extItems.forEach((item) => {
        const extId = item.dataset.extId;
        const ext = installedExtensions.find((e) => e.id === extId);

        if (
          ext.name.toLowerCase().includes(query) ||
          ext.description.toLowerCase().includes(query) ||
          ext.publisher.toLowerCase().includes(query)
        ) {
          item.style.display = "";
        } else {
          item.style.display = "none";
        }
      });
    });
  }
}

// Initialize Run button
function initRunButton() {
  // Create run button if it doesn't exist
  let runButton = document.querySelector("#run-code-btn");
  if (!runButton) {
    runButton = document.createElement("button");
    runButton.id = "run-code-btn";
    runButton.className = "editor-action-btn";
    runButton.innerHTML = `<i class="fa-solid fa-play"></i> Run`;
    runButton.title = "Run Code (Ctrl+Alt+N)";

    // Hide by default
    runButton.style.display = "none";

    // Add to editor tabs
    const editorTabs = document.querySelector(".editor-tabs");
    if (editorTabs) {
      editorTabs.after(runButton);
    }

    // Add click event
    runButton.addEventListener("click", runCurrentFile);
  }

  // Add keyboard shortcut (Ctrl+Alt+N)
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.altKey && e.key === "n") {
      e.preventDefault();
      runCurrentFile();
    }
  });
}

// Update the Run button visibility based on current file
function updateRunButton() {
  const runButton = document.querySelector("#run-code-btn");
  if (!runButton || !currentFile) return;

  const extension = currentFile.split(".").pop().toLowerCase();
  let supportedExt = false;
  let supportingExt = null;

  // Check if any enabled extension supports this file type
  for (const ext of installedExtensions) {
    if (ext.enabled && ext.supportsFileTypes.includes(extension)) {
      supportedExt = true;
      supportingExt = ext;
      break;
    }
  }

  if (supportedExt) {
    runButton.style.display = "flex";

    // Update button icon/text based on extension
    if (supportingExt.id === "live-server") {
      runButton.innerHTML = `<i class="fa-solid fa-globe"></i> Go Live`;
      runButton.title = "Launch with Live Server";
    } else {
      runButton.innerHTML = `<i class="fa-solid fa-play"></i> Run Code`;
      runButton.title = "Run Code (Ctrl+Alt+N)";
    }
  } else {
    runButton.style.display = "none";
  }
}

// Run the current file
function runCurrentFile() {
  if (!currentFile) return;

  // Make sure terminal is visible
  if (!isTerminalOpen) {
    toggleTerminal(); // Make terminal visible
  }

  const extension = currentFile.split(".").pop().toLowerCase();

  // Find the extension that can run this file
  for (const ext of installedExtensions) {
    if (ext.enabled && ext.supportsFileTypes.includes(extension)) {
      // Get the command to run
      const command = ext.command(currentFile);

      // Save file before running (if needed)
      if (hasUnsavedChanges(currentFile)) {
        saveFile(currentFile).then(() => {
          // Execute in terminal
          executeInTerminal(command, ext.id);
        });
      } else {
        // Execute in terminal
        executeInTerminal(command, ext.id);
      }

      break;
    }
  }
}

// Execute a command in the terminal
function executeInTerminal(command, extensionId) {
  if (!terminal) return;

  // Clear terminal before running Live Server
  if (extensionId === "live-server") {
    terminal.clear();
  }

  // Show command that's being executed
  terminal.appendOutput(`$ ${command}`, "command-line");

  // Set the terminal input value to the command
  const terminalInput = document.querySelector(".terminal-command-input");
  if (terminalInput) {
    terminalInput.value = command;

    // Simulate pressing Enter
    const enterEvent = new KeyboardEvent("keydown", {
      key: "Enter",
      code: "Enter",
      which: 13,
      bubbles: true,
    });
    terminalInput.dispatchEvent(enterEvent);
  }
}

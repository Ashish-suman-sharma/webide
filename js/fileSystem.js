// File System functionality for VS Code Clone

// Global variables for file system
let rootDirectoryHandle = null; // Root directory handle
let fileHandles = {}; // Map of file paths to file handles
let unsavedChanges = {}; // Track unsaved changes

// Initialize file system functionality
document.addEventListener("DOMContentLoaded", () => {
  initOpenFolderButton();
  initOpenFileButton();
  attemptToRestoreLastFolder();
});

// Initialize open folder button
function initOpenFolderButton() {
  const openFolderBtn = document.getElementById("open-folder-btn");
  const welcomeOpenFolderBtn = document.getElementById(
    "welcome-open-folder-btn"
  );

  if (openFolderBtn) {
    openFolderBtn.addEventListener("click", openFolder);
  }

  if (welcomeOpenFolderBtn) {
    welcomeOpenFolderBtn.addEventListener("click", openFolder);
  }
}

// Initialize open file button
function initOpenFileButton() {
  const openFileBtn = document.getElementById("open-file-btn");
  const welcomeOpenFileBtn = document.getElementById("welcome-open-file-btn");
  const newFileBtn = document.getElementById("new-file-btn");
  const welcomeNewFileBtn = document.getElementById("welcome-new-file-btn");

  if (openFileBtn) {
    openFileBtn.addEventListener("click", openSingleFile);
  }

  if (welcomeOpenFileBtn) {
    welcomeOpenFileBtn.addEventListener("click", openSingleFile);
  }

  if (newFileBtn) {
    newFileBtn.addEventListener("click", () => {
      if (typeof createInlineNewFileInput === "function") {
        createInlineNewFileInput();
      }
    });
  }

  if (welcomeNewFileBtn) {
    welcomeNewFileBtn.addEventListener("click", () => {
      if (
        rootDirectoryHandle &&
        typeof createInlineNewFileInput === "function"
      ) {
        // If we have an open folder, use inline creation
        createInlineNewFileInput();
      } else {
        // Otherwise, prompt for filename
        const fileName = prompt("Enter file name:");
        if (fileName && fileName.trim()) {
          createNewFile(fileName.trim());
        }
      }
    });
  }
}

// Open a single file
async function openSingleFile() {
  try {
    // Check if File System Access API is supported
    if (!("showOpenFilePicker" in window)) {
      showNotification(
        "Your browser does not support the File System Access API. Please use Chrome, Edge, or Opera.",
        5000
      );
      return;
    }

    // Show file picker
    const [fileHandle] = await window.showOpenFilePicker({
      multiple: false,
      types: [
        {
          description: "Text Files",
          accept: {
            "text/*": [
              ".txt",
              ".html",
              ".css",
              ".js",
              ".json",
              ".md",
              ".xml",
              ".yaml",
              ".yml",
              ".csv",
            ],
          },
        },
        {
          description: "Source Code",
          accept: {
            "text/javascript": [".js", ".jsx", ".ts", ".tsx"],
            "text/html": [".html", ".htm"],
            "text/css": [".css"],
            "application/json": [".json"],
            "text/markdown": [".md"],
            "text/x-python": [".py"],
            "text/x-java": [".java"],
            "text/x-c": [".c", ".cpp", ".h"],
            "text/x-csharp": [".cs"],
          },
        },
      ],
    });

    // Get file
    const file = await fileHandle.getFile();
    const fileName = file.name;
    const content = await file.text();

    // Store file handle and content
    fileHandles[fileName] = fileHandle;
    fileContents[fileName] = content;

    // Open file in editor
    openFile(fileName);

    // Show notification
    showNotification(`Opened file: ${fileName}`);
  } catch (error) {
    // User cancelled or error occurred
    if (error.name !== "AbortError") {
      console.error("Error opening file:", error);
      showNotification("Error opening file: " + error.message, 5000);
    }
  }
}

// Attempt to restore the last opened folder
async function attemptToRestoreLastFolder() {
  try {
    // Check if we have permission to the last directory
    if ("directoryHandle" in localStorage) {
      try {
        // Try to parse the stored directory handle
        const storedDirHandle = JSON.parse(
          localStorage.getItem("directoryHandle")
        );

        if (storedDirHandle && "name" in storedDirHandle) {
          // Show "Restoring last session" notification
          showNotification(
            `Attempting to restore last folder: ${storedDirHandle.name}...`
          );

          // Request permission to the directory
          const permission = await storedDirHandle.requestPermission({
            mode: "readwrite",
          });

          if (permission === "granted") {
            // Restore the directory
            rootDirectoryHandle = storedDirHandle;
            await loadFolderContents(rootDirectoryHandle);
            showNotification(`Restored folder: ${rootDirectoryHandle.name}`);
            return;
          }
        }
      } catch (error) {
        console.warn("Failed to restore last directory:", error);
      }
    }

    // If we get here, we couldn't restore the last folder
    showEmptyExplorer();
  } catch (error) {
    console.error("Error restoring last folder:", error);
    showEmptyExplorer();
  }
}

// Show empty explorer message
function showEmptyExplorer() {
  const fileExplorer = document.querySelector(".file-explorer");
  if (fileExplorer) {
    fileExplorer.innerHTML = `
      <div class="empty-explorer-message">
        <p>No folder opened yet</p>
        <div class="explorer-actions">
          <button class="explorer-btn" id="welcome-open-folder-btn">
            <i class="fas fa-folder-open"></i> Open Folder
          </button>
          <button class="explorer-btn" id="welcome-open-file-btn">
            <i class="fas fa-file"></i> Open File
          </button>
          <button class="explorer-btn" id="welcome-new-file-btn">
            <i class="fas fa-file-medical"></i> New File
          </button>
        </div>
      </div>
    `;

    // Reinitialize the buttons
    initOpenFolderButton();
    initOpenFileButton();
  }
}

// Open folder using File System Access API
async function openFolder() {
  try {
    // Check if File System Access API is supported
    if (!("showDirectoryPicker" in window)) {
      showNotification(
        "Your browser does not support the File System Access API. Please use Chrome, Edge, or Opera.",
        5000
      );
      return;
    }

    // Show directory picker
    rootDirectoryHandle = await window.showDirectoryPicker();

    // Save the directory handle for later restoration
    try {
      localStorage.setItem(
        "directoryHandle",
        JSON.stringify(rootDirectoryHandle)
      );
    } catch (error) {
      console.warn("Could not save directory handle:", error);
    }

    // Load folder contents
    await loadFolderContents(rootDirectoryHandle);

    // Show notification
    showNotification(`Opened folder: ${rootDirectoryHandle.name}`);
  } catch (error) {
    // User cancelled or error occurred
    if (error.name !== "AbortError") {
      console.error("Error opening folder:", error);
      showNotification("Error opening folder: " + error.message, 5000);
    }
  }
}

// Load folder contents into the UI
async function loadFolderContents(dirHandle) {
  if (!dirHandle) return;

  // Clear existing file explorer content
  const fileExplorer = document.querySelector(".file-explorer");
  fileExplorer.innerHTML = "";

  // Reset file handles and unsaved changes
  fileHandles = {};
  unsavedChanges = {};

  // Create root folder item
  const rootFolderItem = document.createElement("div");
  rootFolderItem.className = "folder-item open";
  rootFolderItem.innerHTML = `
    <div class="folder-header">
      <i class="fas fa-chevron-down"></i>
      <i class="fas fa-folder-open"></i>
      <span>${dirHandle.name}</span>
    </div>
    <div class="folder-content"></div>
  `;

  // Add click event to toggle folder
  const folderHeader = rootFolderItem.querySelector(".folder-header");
  folderHeader.addEventListener("click", () => {
    rootFolderItem.classList.toggle("open");

    // Toggle folder icon
    const folderIcon = folderHeader.querySelector(
      ".fa-folder, .fa-folder-open"
    );
    if (folderIcon) {
      folderIcon.classList.toggle("fa-folder");
      folderIcon.classList.toggle("fa-folder-open");
    }

    // Toggle chevron icon
    const chevronIcon = folderHeader.querySelector(
      ".fa-chevron-right, .fa-chevron-down"
    );
    if (chevronIcon) {
      chevronIcon.classList.toggle("fa-chevron-right");
      chevronIcon.classList.toggle("fa-chevron-down");
    }
  });

  // Add context menu event
  rootFolderItem.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    e.stopPropagation();
    showFileContextMenu(e.clientX, e.clientY, rootFolderItem);
  });

  // Add to file explorer
  fileExplorer.appendChild(rootFolderItem);

  // Load directory contents
  const folderContent = rootFolderItem.querySelector(".folder-content");
  await loadDirectoryContents(dirHandle, folderContent, "");
}

// Load directory contents recursively
async function loadDirectoryContents(directoryHandle, parentElement, path) {
  // Get all entries in the directory
  for await (const entry of directoryHandle.values()) {
    const entryPath = path ? `${path}/${entry.name}` : entry.name;

    if (entry.kind === "file") {
      // Create file item
      const fileItem = document.createElement("div");
      fileItem.className = "file-item";
      fileItem.setAttribute("data-file", entryPath);

      // Determine file icon based on extension
      const extension = entry.name.split(".").pop().toLowerCase();
      let fileIcon = getFileIconByExtension(extension);

      fileItem.innerHTML = `
                <i class="fas ${fileIcon}"></i>
                <span>${entry.name}</span>
            `;

      // Store file handle
      fileHandles[entryPath] = entry;

      // Add click event to open the file
      fileItem.addEventListener("click", () => {
        openLocalFile(entryPath);
      });

      // Add context menu event
      fileItem.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showFileContextMenu(e.clientX, e.clientY, fileItem);
      });

      // Add to parent element
      parentElement.appendChild(fileItem);
    } else if (entry.kind === "directory") {
      // Create folder item
      const folderItem = document.createElement("div");
      folderItem.className = "folder-item";
      folderItem.innerHTML = `
                <div class="folder-header">
                    <i class="fas fa-chevron-right"></i>
                    <i class="fas fa-folder"></i>
                    <span>${entry.name}</span>
                </div>
                <div class="folder-content"></div>
            `;

      // Add click event to toggle folder
      const folderHeader = folderItem.querySelector(".folder-header");
      folderHeader.addEventListener("click", async () => {
        const isOpen = folderItem.classList.toggle("open");

        // Toggle folder icon
        const folderIcon = folderHeader.querySelector(
          ".fa-folder, .fa-folder-open"
        );
        if (folderIcon) {
          folderIcon.classList.toggle("fa-folder");
          folderIcon.classList.toggle("fa-folder-open");
        }

        // Toggle chevron icon
        const chevronIcon = folderHeader.querySelector(".fa-chevron-right");
        if (chevronIcon) {
          chevronIcon.style.transform = isOpen ? "rotate(90deg)" : "";
        }

        // Load directory contents if not already loaded
        if (isOpen) {
          const folderContent = folderItem.querySelector(".folder-content");
          if (folderContent.children.length === 0) {
            await loadDirectoryContents(entry, folderContent, entryPath);
          }
        }
      });

      // Add context menu event
      folderItem.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showFileContextMenu(e.clientX, e.clientY, folderItem);
      });

      // Add to parent element
      parentElement.appendChild(folderItem);
    }
  }
}

// Get the appropriate file icon based on file extension
function getFileIconByExtension(extension) {
  // Default icon
  let fileIcon = "fa-file-code";
  
  // Image files
  if (["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp", "ico"].includes(extension)) {
    return "fa-file-image";
  }
  
  // Document files
  if (["pdf"].includes(extension)) {
    return "fa-file-pdf";
  }
  if (["doc", "docx", "rtf", "odt"].includes(extension)) {
    return "fa-file-word";
  }
  if (["xls", "xlsx", "ods", "csv"].includes(extension)) {
    return "fa-file-excel";
  }
  if (["ppt", "pptx", "odp"].includes(extension)) {
    return "fa-file-powerpoint";
  }
  
  // Archive files
  if (["zip", "rar", "7z", "tar", "gz", "bz2"].includes(extension)) {
    return "fa-file-zipper";
  }
  
  // Media files
  if (["mp3", "wav", "ogg", "flac", "aac"].includes(extension)) {
    return "fa-file-audio";
  }
  if (["mp4", "avi", "mov", "wmv", "mkv", "webm"].includes(extension)) {
    return "fa-file-video";
  }
  
  // Text files
  if (["txt", "md", "markdown", "log"].includes(extension)) {
    return "fa-file-lines";
  }
  
  // Programming language files - specialized icons
  const langIcons = {
    // Web
    "html": "devicon-html5-plain colored",
    "htm": "devicon-html5-plain colored",
    "css": "devicon-css3-plain colored",
    "js": "devicon-javascript-plain colored",
    "jsx": "devicon-react-original colored",
    "ts": "devicon-typescript-plain colored",
    "tsx": "devicon-react-original colored",
    
    // Backend/Server
    "php": "devicon-php-plain colored",
    "py": "devicon-python-plain colored",
    "java": "devicon-java-plain colored",
    "rb": "devicon-ruby-plain colored",
    "go": "devicon-go-plain colored",
    "cs": "devicon-csharp-plain colored",
    "vb": "devicon-dot-net-plain colored",
    
    // Configuration
    "json": "fa-brands fa-js json-icon", // Updated JSON icon
    "xml": "fa-solid fa-code",
    "yaml": "fa-solid fa-file-code yaml-icon",
    "yml": "fa-solid fa-file-code yaml-icon",
    "toml": "fa-solid fa-file-code",
    "ini": "fa-solid fa-file-lines",
    "config": "fa-solid fa-gears",
    
    // Shell/Scripts
    "sh": "fa-solid fa-terminal",
    "bash": "fa-solid fa-terminal",
    "bat": "fa-solid fa-terminal",
    "ps1": "fa-brands fa-windows", 
    "cmd": "fa-brands fa-windows",
    
    // Database
    "sql": "devicon-mysql-plain colored",
    "sqlite": "fa-solid fa-database",
    "db": "fa-solid fa-database",
    
    // C family
    "c": "devicon-c-plain colored",
    "cpp": "devicon-cplusplus-plain colored",
    "h": "devicon-c-plain colored",
    "hpp": "devicon-cplusplus-plain colored"
  };
  
  return langIcons[extension] || "fa-solid " + fileIcon;
}

// Open a local file in the editor
async function openLocalFile(filePath) {
  try {
    const fileHandle = fileHandles[filePath];
    if (!fileHandle) {
      showNotification(`File not found: ${filePath}`, 3000);
      return;
    }

    // Check if file is supported
    const fileName = fileHandle.name;
    const extension = fileName.split(".").pop().toLowerCase();
    const supportedExtensions = Object.keys(getLanguageMap());

    if (!supportedExtensions.includes(extension)) {
      showNotification(`Unsupported file type: ${extension}`, 3000);
      return;
    }

    // Get file content
    const file = await fileHandle.getFile();
    const content = await file.text();

    // Add to fileContents
    fileContents[filePath] = content;

    // Open file in editor
    openFile(filePath);

    // Show notification
    showNotification(`Opened file: ${fileName}`);
  } catch (error) {
    console.error("Error opening file:", error);
    showNotification("Error opening file: " + error.message, 5000);
  }
}

// Save a local file
async function saveLocalFile(filePath) {
  try {
    const fileHandle = fileHandles[filePath];
    if (!fileHandle) {
      showNotification(`File not found: ${filePath}`, 3000);
      return;
    }

    // Get file content from editor
    const content = editor.getValue();

    // Create a writable stream
    const writable = await fileHandle.createWritable();

    // Write the content
    await writable.write(content);

    // Close the stream
    await writable.close();

    // Clear unsaved changes flag
    delete unsavedChanges[filePath];

    // Show notification
    showNotification(`Saved file: ${fileHandle.name}`);

    return true;
  } catch (error) {
    console.error("Error saving file:", error);
    showNotification("Error saving file: " + error.message, 5000);
    return false;
  }
}

// Get language map for file extensions
function getLanguageMap() {
  return {
    html: "html",
    htm: "html",
    css: "css",
    js: "javascript",
    json: "json",
    ts: "typescript",
    jsx: "javascript",
    tsx: "typescript",
    md: "markdown",
    py: "python",
    java: "java",
    c: "c",
    cpp: "cpp",
    cs: "csharp",
    go: "go",
    php: "php",
    rb: "ruby",
    rs: "rust",
    swift: "swift",
    sql: "sql",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
    txt: "plaintext",
  };
}

// Check if a file has unsaved changes
function hasUnsavedChanges(filePath) {
  return unsavedChanges[filePath] === true;
}

// Mark file as having unsaved changes
function markUnsavedChanges(filePath) {
  unsavedChanges[filePath] = true;

  // Update tab to show unsaved indicator
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => {
    const tabName = tab.querySelector("span").textContent;
    if (tabName === getFileNameFromPath(filePath)) {
      if (!tab.classList.contains("unsaved")) {
        tab.classList.add("unsaved");
      }
    }
  });
}

// Clear unsaved changes marker
function clearUnsavedChanges(filePath) {
  delete unsavedChanges[filePath];

  // Update tab to remove unsaved indicator
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => {
    const tabName = tab.querySelector("span").textContent;
    if (tabName === getFileNameFromPath(filePath)) {
      tab.classList.remove("unsaved");
    }
  });
}

// Get file name from path
function getFileNameFromPath(filePath) {
  return filePath.split("/").pop();
}

// Before unload handler to warn about unsaved changes
window.addEventListener("beforeunload", (e) => {
  if (Object.keys(unsavedChanges).length > 0) {
    const message = "You have unsaved changes. Are you sure you want to leave?";
    e.returnValue = message;
    return message;
  }
});

// Create a new file on the local file system
async function createLocalFile(parentHandle, fileName, content = "") {
  try {
    // Create the file in the specified directory
    const fileHandle = await parentHandle.getFileHandle(fileName, {
      create: true,
    });

    // Write initial content to the file
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();

    // Add to our fileHandles map
    const parentPath = await getDirectoryPath(parentHandle);
    const filePath = parentPath ? `${parentPath}/${fileName}` : fileName;
    fileHandles[filePath] = fileHandle;

    // Add to fileContents
    fileContents[filePath] = content;

    // Show notification
    showNotification(`Created file: ${fileName}`);

    return { filePath, fileHandle };
  } catch (error) {
    console.error("Error creating file:", error);
    showNotification(`Error creating file: ${error.message}`, 5000);
    return null;
  }
}

// Create a new directory on the local file system
async function createLocalDirectory(parentHandle, dirName) {
  try {
    // Create the directory in the specified location
    const dirHandle = await parentHandle.getDirectoryHandle(dirName, {
      create: true,
    });

    // Show notification
    showNotification(`Created folder: ${dirName}`);

    return dirHandle;
  } catch (error) {
    console.error("Error creating folder:", error);
    showNotification(`Error creating folder: ${error.message}`, 5000);
    return null;
  }
}

// Get directory path from handle (used for constructing file paths)
async function getDirectoryPath(dirHandle) {
  // If this is the root directory, return empty string
  if (dirHandle === rootDirectoryHandle) {
    return "";
  }

  // Otherwise, we need to find this directory's parent
  // This is a workaround since File System Access API doesn't have a direct way to get path
  let path = "";

  for (const [filePath, handle] of Object.entries(fileHandles)) {
    if (handle === dirHandle) {
      path = filePath;
      break;
    }
  }

  return path;
}

// Find directory handle by path
function getDirectoryHandleFromPath(path) {
  if (!path || path === "") return rootDirectoryHandle;

  return fileHandles[path] || null;
}

// Get parent directory handle for a given element
async function getParentDirectoryHandle(element) {
  if (!rootDirectoryHandle) return null;

  // If it's the root folder item
  const isRootFolder =
    element.querySelector(".folder-header span")?.textContent ===
    rootDirectoryHandle.name;
  if (isRootFolder) {
    return rootDirectoryHandle;
  }

  // Try to find the parent path
  let parentPath = "";

  if (element.classList.contains("folder-item")) {
    // For folders, get the folder path
    const folderName = element.querySelector(".folder-header span").textContent;

    // Find the parent elements
    let parent = element.parentElement;
    while (parent && !parent.classList.contains("file-explorer")) {
      if (parent.classList.contains("folder-content")) {
        const parentFolder = parent.parentElement;
        const parentName = parentFolder.querySelector(
          ".folder-header span"
        )?.textContent;
        if (parentName) {
          parentPath = parentName + (parentPath ? "/" + parentPath : "");
        }
      }
      parent = parent.parentElement;
    }

    if (parentPath) {
      return getDirectoryHandleFromPath(parentPath);
    }

    return rootDirectoryHandle;
  }

  return rootDirectoryHandle;
}

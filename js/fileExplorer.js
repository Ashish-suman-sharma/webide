// File Explorer functionality for VS Code Clone

// Initialize file explorer functionality
document.addEventListener("DOMContentLoaded", () => {
  initDragAndDrop();
  initFileOperations();
  initFileContextMenu();
});

// Initialize drag and drop functionality
function initDragAndDrop() {
  const fileItems = document.querySelectorAll(".file-item");
  const folderItems = document.querySelectorAll(".folder-item");

  // Make file items draggable
  fileItems.forEach((item) => {
    item.setAttribute("draggable", "true");

    item.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", item.getAttribute("data-file"));
      e.dataTransfer.effectAllowed = "move";
      item.classList.add("dragging");
    });

    item.addEventListener("dragend", () => {
      item.classList.remove("dragging");
    });
  });

  // Make folder items drop targets
  folderItems.forEach((folder) => {
    folder.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      folder.classList.add("drag-over");
    });

    folder.addEventListener("dragleave", () => {
      folder.classList.remove("drag-over");
    });

    folder.addEventListener("drop", (e) => {
      e.preventDefault();
      folder.classList.remove("drag-over");

      const fileName = e.dataTransfer.getData("text/plain");
      if (fileName) {
        moveFile(fileName, folder);
      }
    });
  });
}

// Move a file to a folder
function moveFile(fileName, targetFolder) {
  // In a real app, this would update the file system
  // For this demo, we'll just update the UI

  const fileItem = document.querySelector(
    `.file-item[data-file="${fileName}"]`
  );
  if (fileItem && targetFolder) {
    const folderContent = targetFolder.querySelector(".folder-content");
    if (folderContent) {
      // If folder is not open, open it
      if (!targetFolder.classList.contains("open")) {
        targetFolder.classList.add("open");

        // Update folder icon
        const folderIcon = targetFolder.querySelector(".fa-folder");
        if (folderIcon) {
          folderIcon.classList.remove("fa-folder");
          folderIcon.classList.add("fa-folder-open");
        }

        // Update chevron icon
        const chevronIcon = targetFolder.querySelector(".fa-chevron-right");
        if (chevronIcon) {
          chevronIcon.style.transform = "rotate(90deg)";
        }
      }

      // Move file to folder
      folderContent.appendChild(fileItem);
    }
  }
}

// Initialize file operations
function initFileOperations() {
  // Add new file button functionality
  const newFileButton = document.querySelector(".panel-actions .fa-plus");
  if (newFileButton) {
    newFileButton.addEventListener("click", () => {
      createInlineNewFileInput();
    });
  }
}

// Initialize file context menu
function initFileContextMenu() {
  // Right-click on file explorer items
  const fileExplorerItems = document.querySelectorAll(
    ".folder-item, .file-item"
  );

  fileExplorerItems.forEach((item) => {
    item.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Show context menu
      showFileContextMenu(e.clientX, e.clientY, item);
    });
  });
}

// Show file context menu
function showFileContextMenu(x, y, item) {
  // Remove any existing context menu
  removeContextMenu();

  // Create context menu
  const contextMenu = document.createElement("div");
  contextMenu.className = "context-menu editor-widget";
  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;

  // Determine if item is file or folder
  const isFolder = item.classList.contains("folder-item");
  const isFile = item.classList.contains("file-item");

  // Add menu items based on item type
  if (isFolder) {
    contextMenu.innerHTML = `
            <div class="context-menu-item" data-action="new-file"><i class="fa-solid fa-file"></i>New File</div>
            <div class="context-menu-item" data-action="new-folder"><i class="fa-solid fa-folder"></i>New Folder</div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" data-action="rename"><i class="fa-solid fa-pen-to-square"></i>Rename</div>
            <div class="context-menu-item" data-action="delete"><i class="fa-solid fa-trash"></i>Delete</div>
        `;
  } else if (isFile) {
    contextMenu.innerHTML = `
            <div class="context-menu-item" data-action="open"><i class="fa-solid fa-arrow-up-right-from-square"></i>Open</div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" data-action="rename"><i class="fa-solid fa-pen-to-square"></i>Rename</div>
            <div class="context-menu-item" data-action="delete"><i class="fa-solid fa-trash"></i>Delete</div>
        `;
  }

  // Add event listeners to menu items
  document.body.appendChild(contextMenu);

  // Add click event listeners to menu items
  const menuItems = contextMenu.querySelectorAll(".context-menu-item");
  menuItems.forEach((menuItem) => {
    menuItem.addEventListener("click", () => {
      const action = menuItem.getAttribute("data-action");
      handleContextMenuAction(action, item);
      removeContextMenu();
    });
  });

  // Close context menu when clicking outside
  document.addEventListener("click", removeContextMenu);

  // Adjust position if menu goes off screen
  const menuRect = contextMenu.getBoundingClientRect();
  if (menuRect.right > window.innerWidth) {
    contextMenu.style.left = `${window.innerWidth - menuRect.width - 5}px`;
  }
  if (menuRect.bottom > window.innerHeight) {
    contextMenu.style.top = `${window.innerHeight - menuRect.height - 5}px`;
  }
}

// Remove context menu
function removeContextMenu() {
  const contextMenu = document.querySelector(".context-menu");
  if (contextMenu) {
    contextMenu.remove();
  }
  document.removeEventListener("click", removeContextMenu);
}

// Handle context menu actions
function handleContextMenuAction(action, item) {
  switch (action) {
    case "new-file":
      createInlineNewFileInput(item);
      break;
    case "new-folder":
      createInlineNewFolderInput(item);
      break;
    case "open":
      openFileFromExplorer(item);
      break;
    case "rename":
      renameFileExplorerItem(item);
      break;
    case "delete":
      deleteFileExplorerItem(item);
      break;
  }
}

// Open file from explorer
function openFileFromExplorer(fileItem) {
  const fileName = fileItem.getAttribute("data-file");
  if (fileName) {
    openFile(fileName);
  }
}

// Rename file explorer item
function renameFileExplorerItem(item) {
  const nameElement = item.querySelector("span");
  const oldName = nameElement.textContent;
  const newName = prompt("Enter new name:", oldName);

  if (newName && newName !== oldName) {
    // Update name in DOM
    nameElement.textContent = newName;

    // If it's a file, update data-file attribute and handle open files
    if (item.classList.contains("file-item")) {
      item.setAttribute("data-file", newName);

      // Update open files and tabs if needed
      if (openFiles.includes(oldName)) {
        const index = openFiles.indexOf(oldName);
        openFiles[index] = newName;

        // Update tab
        const tabs = document.querySelectorAll(".tab");
        tabs.forEach((tab) => {
          if (tab.querySelector("span").textContent === oldName) {
            tab.querySelector("span").textContent = newName;
          }
        });

        // Update current file if needed
        if (currentFile === oldName) {
          currentFile = newName;
        }
      }

      // Update fileContents
      fileContents[newName] = fileContents[oldName];
      delete fileContents[oldName];
    }
  }
}

// Delete file explorer item
function deleteFileExplorerItem(item) {
  const confirmDelete = confirm("Are you sure you want to delete this item?");
  if (confirmDelete) {
    // If it's a file that's currently open, close it
    if (item.classList.contains("file-item")) {
      const fileName = item.getAttribute("data-file");
      if (openFiles.includes(fileName)) {
        closeFile(fileName);
      }

      // Remove from fileContents
      delete fileContents[fileName];
    }

    // Remove from DOM
    item.remove();
  }
}

// Create an inline input field for new file name
function createInlineNewFileInput(parentFolder) {
  // Determine where to place the new item
  let container;
  if (parentFolder) {
    // Make sure the folder is open
    if (!parentFolder.classList.contains("open")) {
      parentFolder.classList.add("open");

      // Update folder icon
      const folderHeader = parentFolder.querySelector(".folder-header");
      const folderIcon = folderHeader.querySelector(".fa-folder");
      if (folderIcon) {
        folderIcon.classList.remove("fa-folder");
        folderIcon.classList.add("fa-folder-open");
      }

      // Update chevron icon
      const chevronIcon = folderHeader.querySelector(".fa-chevron-right");
      if (chevronIcon) {
        chevronIcon.style.transform = "rotate(90deg)";
      }
    }

    container = parentFolder.querySelector(".folder-content");
  } else {
    // Use the root folder content as container
    container =
      document.querySelector(".folder-content") ||
      document.querySelector(".file-explorer");
  }

  if (!container) return;

  // Create a temporary element for the new file input
  const newFileItem = document.createElement("div");
  newFileItem.className = "file-item editing";
  newFileItem.innerHTML = `
    <i class="fa-solid fa-file"></i>
    <input type="text" class="inline-edit-input" placeholder="Enter file name...">
  `;

  container.appendChild(newFileItem);

  // Focus the input
  const input = newFileItem.querySelector(".inline-edit-input");
  input.focus();

  // Handle input events
  input.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      const fileName = input.value.trim();
      if (fileName) {
        // Remove the temporary element
        container.removeChild(newFileItem);

        // Create the actual file
        await createNewFile(fileName, parentFolder);
      } else {
        container.removeChild(newFileItem);
      }
    } else if (e.key === "Escape") {
      container.removeChild(newFileItem);
    }
  });

  // Handle blur event (when clicking outside)
  input.addEventListener("blur", () => {
    // Small delay to allow for Enter key processing first
    setTimeout(() => {
      if (container.contains(newFileItem)) {
        container.removeChild(newFileItem);
      }
    }, 100);
  });
}

// Create an inline input field for new folder name
function createInlineNewFolderInput(parentFolder) {
  // Determine where to place the new item
  let container;
  if (parentFolder) {
    // Make sure the folder is open
    if (!parentFolder.classList.contains("open")) {
      parentFolder.classList.add("open");

      // Update folder icon
      const folderHeader = parentFolder.querySelector(".folder-header");
      const folderIcon = folderHeader.querySelector(".fa-folder");
      if (folderIcon) {
        folderIcon.classList.remove("fa-folder");
        folderIcon.classList.add("fa-folder-open");
      }

      // Update chevron icon
      const chevronIcon = folderHeader.querySelector(".fa-chevron-right");
      if (chevronIcon) {
        chevronIcon.style.transform = "rotate(90deg)";
      }
    }

    container = parentFolder.querySelector(".folder-content");
  } else {
    // Use the root folder content as container
    container =
      document.querySelector(".folder-content") ||
      document.querySelector(".file-explorer");
  }

  if (!container) return;

  // Create a temporary element for the new folder input
  const newFolderItem = document.createElement("div");
  newFolderItem.className = "folder-item editing";
  newFolderItem.innerHTML = `
    <div class="folder-header">
      <i class="fa-solid fa-folder"></i>
      <input type="text" class="inline-edit-input" placeholder="Enter folder name...">
    </div>
  `;

  container.appendChild(newFolderItem);

  // Focus the input
  const input = newFolderItem.querySelector(".inline-edit-input");
  input.focus();

  // Handle input events
  input.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      const folderName = input.value.trim();
      if (folderName) {
        // Remove the temporary element
        container.removeChild(newFolderItem);

        // Create the actual folder
        await createNewFolder(folderName, parentFolder);
      } else {
        container.removeChild(newFolderItem);
      }
    } else if (e.key === "Escape") {
      container.removeChild(newFolderItem);
    }
  });

  // Handle blur event (when clicking outside)
  input.addEventListener("blur", () => {
    // Small delay to allow for Enter key processing first
    setTimeout(() => {
      if (container.contains(newFolderItem)) {
        container.removeChild(newFolderItem);
      }
    }, 100);
  });
}

// Create a new file in the file explorer
async function createNewFile(fileName, parentFolder) {
  // Check if filename is empty
  if (!fileName || !fileName.trim()) {
    console.error("Cannot create file with empty name");
    return;
  }

  // Check if we have an active file system and create file on disk
  if (rootDirectoryHandle) {
    try {
      // Get parent directory handle
      const parentDirHandle = await getParentDirectoryHandle(
        parentFolder || document.querySelector(".file-explorer")
      );

      if (!parentDirHandle) {
        throw new Error("Could not determine parent directory");
      }

      // Create the file on disk
      const result = await createLocalFile(parentDirHandle, fileName, "");

      if (!result) {
        throw new Error("Failed to create file on disk");
      }

      // Create element in the UI with the actual path
      const fileItem = document.createElement("div");
      fileItem.className = "file-item";
      fileItem.setAttribute("data-file", result.filePath);

      // Determine file icon based on extension
      const extension = fileName.split(".").pop().toLowerCase();
      let fileIcon = getFileIconByExtension(extension);

      fileItem.innerHTML = `
        <i class="fas ${fileIcon}"></i>
        <span>${fileName}</span>
      `;

      // Add click event to open the file
      fileItem.addEventListener("click", () => {
        openLocalFile(result.filePath);
      });

      // Add context menu event
      fileItem.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showFileContextMenu(e.clientX, e.clientY, fileItem);
      });

      // Add to parent folder
      if (parentFolder) {
        const folderContent = parentFolder.querySelector(".folder-content");
        if (folderContent) {
          folderContent.appendChild(fileItem);
        }
      } else {
        // Add to root folder
        const rootFolder = document.querySelector(".folder-content");
        if (rootFolder) {
          rootFolder.appendChild(fileItem);
        }
      }

      // Open the new file
      openLocalFile(result.filePath);
    } catch (error) {
      console.error("Error creating file:", error);
      showNotification(`Error creating file: ${error.message}`, 5000);
    }
  } else {
    // Fallback to in-memory file creation when no folder is open
    // Create new file element
    const fileItem = document.createElement("div");
    fileItem.className = "file-item";
    fileItem.setAttribute("data-file", fileName);

    // Determine file icon based on extension
    const extension = fileName.split(".").pop().toLowerCase();
    let fileIcon = getFileIconByExtension(extension);

    fileItem.innerHTML = `
      <i class="fas ${fileIcon}"></i>
      <span>${fileName}</span>
    `;

    // Add click event to open the file
    fileItem.addEventListener("click", () => {
      openFile(fileName);
    });

    // Add context menu event
    fileItem.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      showFileContextMenu(e.clientX, e.clientY, fileItem);
    });

    // Add to parent folder
    if (parentFolder) {
      const folderContent = parentFolder.querySelector(".folder-content");
      if (folderContent) {
        folderContent.appendChild(fileItem);
      }
    } else {
      // Add to root folder
      const rootFolder = document.querySelector(".folder-content");
      if (rootFolder) {
        rootFolder.appendChild(fileItem);
      }
    }

    // Create empty file content
    fileContents[fileName] = "";

    // Open the new file
    openFile(fileName);
  }
}

// Create a new folder in the file explorer
async function createNewFolder(folderName, parentFolder) {
  // Check if we have an active file system and create folder on disk
  if (rootDirectoryHandle) {
    try {
      // Get parent directory handle
      const parentDirHandle = await getParentDirectoryHandle(
        parentFolder || document.querySelector(".file-explorer")
      );

      if (!parentDirHandle) {
        throw new Error("Could not determine parent directory");
      }

      // Create the directory on disk
      const dirHandle = await createLocalDirectory(parentDirHandle, folderName);

      if (!dirHandle) {
        throw new Error("Failed to create folder on disk");
      }

      // Create element in the UI
      const folderItem = document.createElement("div");
      folderItem.className = "folder-item";
      folderItem.innerHTML = `
        <div class="folder-header">
          <i class="fas fa-chevron-right"></i>
          <i class="fas fa-folder"></i>
          <span>${folderName}</span>
        </div>
        <div class="folder-content"></div>
      `;

      // Add click event to toggle folder
      const folderHeader = folderItem.querySelector(".folder-header");
      folderHeader.addEventListener("click", () => {
        folderItem.classList.toggle("open");

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
          chevronIcon.style.transform = folderItem.classList.contains("open")
            ? "rotate(90deg)"
            : "";
        }
      });

      // Add context menu event
      folderItem.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showFileContextMenu(e.clientX, e.clientY, folderItem);
      });

      // Add drag and drop events
      folderItem.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        folderItem.classList.add("drag-over");
      });

      folderItem.addEventListener("dragleave", () => {
        folderItem.classList.remove("drag-over");
      });

      folderItem.addEventListener("drop", (e) => {
        e.preventDefault();
        folderItem.classList.remove("drag-over");

        const fileName = e.dataTransfer.getData("text/plain");
        if (fileName) {
          moveFile(fileName, folderItem);
        }
      });

      // Add to parent folder
      if (parentFolder) {
        const folderContent = parentFolder.querySelector(".folder-content");
        if (folderContent) {
          folderContent.appendChild(folderItem);
        }
      } else {
        // Add to root folder
        const rootFolder = document.querySelector(".folder-content");
        if (rootFolder) {
          rootFolder.appendChild(folderItem);
        }
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      showNotification(`Error creating folder: ${error.message}`, 5000);
    }
  } else {
    // Fallback to in-memory folder creation when no folder is open
    // Create new folder element
    const folderItem = document.createElement("div");
    folderItem.className = "folder-item";
    folderItem.innerHTML = `
      <div class="folder-header">
        <i class="fas fa-chevron-right"></i>
        <i class="fas fa-folder"></i>
        <span>${folderName}</span>
      </div>
      <div class="folder-content"></div>
    `;

    // Add click event to toggle folder
    const folderHeader = folderItem.querySelector(".folder-header");
    folderHeader.addEventListener("click", () => {
      folderItem.classList.toggle("open");

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
        chevronIcon.style.transform = folderItem.classList.contains("open")
          ? "rotate(90deg)"
          : "";
      }
    });

    // Add context menu event
    folderItem.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      showFileContextMenu(e.clientX, e.clientY, folderItem);
    });

    // Add drop events
    folderItem.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      folderItem.classList.add("drag-over");
    });

    folderItem.addEventListener("dragleave", () => {
      folderItem.classList.remove("drag-over");
    });

    folderItem.addEventListener("drop", (e) => {
      e.preventDefault();
      folderItem.classList.remove("drag-over");

      const fileName = e.dataTransfer.getData("text/plain");
      if (fileName) {
        moveFile(fileName, folderItem);
      }
    });

    // Add to parent folder
    if (parentFolder) {
      const folderContent = parentFolder.querySelector(".folder-content");
      if (folderContent) {
        folderContent.appendChild(folderItem);
      }
    } else {
      // Add to root folder
      const rootFolder = document.querySelector(".folder-content");
      if (rootFolder) {
        rootFolder.appendChild(folderItem);
      }
    }
  }
}

// Get the appropriate file icon based on file extension
function getFileIconByExtension(extension) {
  // Default icon
  let fileIcon = "fa-file-code";

  // Image files
  if (
    ["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp", "ico"].includes(
      extension
    )
  ) {
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
    return "fa-file-archive";
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
    return "fa-file-alt";
  }

  // Programming language files - specialized icons
  const langIcons = {
    // Web
    html: "fa-html5",
    htm: "fa-html5",
    css: "fa-css3-alt",
    js: "fa-js",
    jsx: "fa-react",
    ts: "fa-file-code ts-icon",
    tsx: "fa-react ts-icon",

    // Backend/Server
    php: "fa-php",
    py: "fa-python",
    java: "fa-java",
    rb: "fa-gem", // Ruby
    go: "fa-file-code go-icon",
    cs: "fa-microsoft",
    vb: "fa-microsoft",

    // Configuration
    json: "fa-brands fa-js json-icon", // Updated JSON icon
    xml: "fa-file-code xml-icon",
    yaml: "fa-file-code yaml-icon",
    yml: "fa-file-code yaml-icon",
    toml: "fa-file-code",
    ini: "fa-file-code",
    config: "fa-cog",

    // Shell/Scripts
    sh: "fa-terminal",
    bash: "fa-terminal",
    bat: "fa-terminal",
    ps1: "fa-terminal", // PowerShell
    cmd: "fa-terminal",

    // Database
    sql: "fa-database",
    sqlite: "fa-database",
    db: "fa-database",

    // C family
    c: "fa-file-code c-icon",
    cpp: "fa-file-code cpp-icon",
    h: "fa-file-code c-icon",
    hpp: "fa-file-code cpp-icon",
  };

  return langIcons[extension] || fileIcon;
}

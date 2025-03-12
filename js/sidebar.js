// Sidebar functionality for VS Code Clone

// File system structure (simulated)
const fileSystem = {
  webide: {
    type: "folder",
    children: {
      "index.html": { type: "file", content: fileContents["index.html"] },
      css: {
        type: "folder",
        children: {
          "style.css": { type: "file", content: fileContents["style.css"] },
          "sidebar.css": { type: "file", content: "" },
          "editor.css": { type: "file", content: "" },
          "statusbar.css": { type: "file", content: "" },
        },
      },
      js: {
        type: "folder",
        children: {
          "main.js": { type: "file", content: "" },
          "sidebar.js": { type: "file", content: "" },
          "editor.js": { type: "file", content: "" },
          "fileExplorer.js": { type: "file", content: "" },
        },
      },
      assets: {
        type: "folder",
        children: {
          icons: { type: "folder", children: {} },
          fonts: { type: "folder", children: {} },
        },
      },
    },
  },
};

// Initialize sidebar functionality
document.addEventListener("DOMContentLoaded", () => {
  initFileExplorer();
  initSearchPanel();
  initGitPanel();
  initDebugPanel();
  initExtensionsPanel();
});

// Initialize File Explorer with dynamic content
function initFileExplorer() {
  // We'll keep the static HTML for simplicity, but in a real app,
  // this would dynamically generate the file tree from the fileSystem object

  // Add context menu for file explorer items
  const fileExplorerItems = document.querySelectorAll(
    ".folder-item, .file-item"
  );

  fileExplorerItems.forEach((item) => {
    item.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Show context menu
      showFileExplorerContextMenu(e.clientX, e.clientY, item);
    });
  });

  // Add new file/folder functionality
  const newFileButton = document.querySelector(".panel-actions .fa-plus");
  if (newFileButton) {
    newFileButton.addEventListener("click", () => {
      showNewFileDialog();
    });
  }
}

// Show context menu for file explorer
function showFileExplorerContextMenu(x, y, item) {
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
            <div class="context-menu-item"><i class="fas fa-file"></i>New File</div>
            <div class="context-menu-item"><i class="fas fa-folder"></i>New Folder</div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item"><i class="fas fa-cut"></i>Cut</div>
            <div class="context-menu-item"><i class="fas fa-copy"></i>Copy</div>
            <div class="context-menu-item"><i class="fas fa-paste"></i>Paste</div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item"><i class="fas fa-trash"></i>Delete</div>
            <div class="context-menu-item"><i class="fas fa-i-cursor"></i>Rename</div>
        `;
  } else if (isFile) {
    contextMenu.innerHTML = `
            <div class="context-menu-item"><i class="fas fa-cut"></i>Cut</div>
            <div class="context-menu-item"><i class="fas fa-copy"></i>Copy</div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item"><i class="fas fa-trash"></i>Delete</div>
            <div class="context-menu-item"><i class="fas fa-i-cursor"></i>Rename</div>
        `;
  }

  // Add event listeners to menu items
  document.body.appendChild(contextMenu);

  // Add click event listeners to menu items
  const menuItems = contextMenu.querySelectorAll(".context-menu-item");
  menuItems.forEach((menuItem) => {
    menuItem.addEventListener("click", () => {
      const action = menuItem.textContent;
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
  const itemName = item.querySelector("span").textContent;

  switch (action) {
    case "New File":
      showNewFileDialog(item);
      break;
    case "New Folder":
      showNewFolderDialog(item);
      break;
    case "Delete":
      deleteItem(item);
      break;
    case "Rename":
      renameItem(item);
      break;
    // Other actions can be implemented similarly
  }
}

// Show dialog for creating a new file
function showNewFileDialog(parentFolder) {
  // In a real app, this would show a dialog to enter file name
  // For simplicity, we'll just use a prompt
  const fileName = prompt("Enter file name:");
  if (fileName) {
    createNewFile(fileName, parentFolder);
  }
}

// Show dialog for creating a new folder
function showNewFolderDialog(parentFolder) {
  // In a real app, this would show a dialog to enter folder name
  // For simplicity, we'll just use a prompt
  const folderName = prompt("Enter folder name:");
  if (folderName) {
    createNewFolder(folderName, parentFolder);
  }
}

// Create a new file in the file explorer
function createNewFile(fileName, parentFolder) {
  // In a real app, this would update the file system
  // For this demo, we'll just update the UI

  // Create new file element
  const fileItem = document.createElement("div");
  fileItem.className = "file-item";
  fileItem.setAttribute("data-file", fileName);
  fileItem.innerHTML = `
        <i class="fas fa-file-code"></i>
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
    showFileExplorerContextMenu(e.clientX, e.clientY, fileItem);
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

// Create a new folder in the file explorer
function createNewFolder(folderName, parentFolder) {
  // In a real app, this would update the file system
  // For this demo, we'll just update the UI

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
    showFileExplorerContextMenu(e.clientX, e.clientY, folderItem);
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

// Delete an item from the file explorer
function deleteItem(item) {
  // In a real app, this would update the file system
  // For this demo, we'll just update the UI

  // Check if it's a file that's currently open
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

// Rename an item in the file explorer
function renameItem(item) {
  // In a real app, this would update the file system
  // For this demo, we'll just update the UI

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

// Initialize Search Panel
function initSearchPanel() {
  const searchInput = document.querySelector(".search-container input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      // In a real app, this would trigger a search
      console.log("Searching for:", e.target.value);
    });
  }

  const searchOptions = document.querySelectorAll(".search-option");
  searchOptions.forEach((option) => {
    option.addEventListener("click", () => {
      option.classList.toggle("active");
    });
  });
}

// Initialize Git Panel
function initGitPanel() {
  // Git panel functionality would be implemented here
}

// Initialize Debug Panel
function initDebugPanel() {
  // Debug panel functionality would be implemented here
}

// Initialize Extensions Panel
function initExtensionsPanel() {
  const extensionsSearch = document.querySelector(".extensions-search input");
  if (extensionsSearch) {
    extensionsSearch.addEventListener("input", (e) => {
      // In a real app, this would search for extensions
      console.log("Searching extensions for:", e.target.value);
    });
  }
}

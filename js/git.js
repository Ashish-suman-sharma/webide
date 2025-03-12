// Git functionality for VS Code Clone

// Global git state
const gitState = {
  isRepo: false,
  currentBranch: null,
  changes: {
    staged: [],
    unstaged: [],
  },
  branches: [],
  remotes: {},
  initialized: false,
};

// Initialize git functionality
document.addEventListener("DOMContentLoaded", () => {
  initGitPanel();
});

// Initialize Git Panel
function initGitPanel() {
  const gitPanel = document.querySelector(".git-panel");
  if (!gitPanel) return;

  // Add click event to git activity icon
  const gitActivityIcon = document.querySelector(
    '.activity-icon[data-panel="git"]'
  );
  if (gitActivityIcon) {
    gitActivityIcon.addEventListener("click", refreshGitPanel);
  }

  // Initial check for Git repository
  refreshGitPanel();
}

// Refresh Git Panel
async function refreshGitPanel() {
  const gitContent = document.querySelector(".git-content");
  if (!gitContent) return;

  if (!rootDirectoryHandle) {
    // No folder opened
    showNoFolderMessage(gitContent);
    return;
  }

  // Check if the current folder is a Git repository
  try {
    const isGitRepo = await checkIsGitRepo();

    if (isGitRepo) {
      gitState.isRepo = true;
      await loadGitStatus(gitContent);
    } else {
      gitState.isRepo = false;
      showInitRepoMessage(gitContent);
    }
  } catch (error) {
    console.error("Error checking Git status:", error);
    showErrorMessage(gitContent, error.message);
  }
}

// Check if current folder is a Git repository
async function checkIsGitRepo() {
  if (!rootDirectoryHandle) return false;

  try {
    // Check for .git directory existence
    try {
      // Attempt to get the .git directory
      await rootDirectoryHandle.getDirectoryHandle(".git");
      return true;
    } catch (e) {
      // .git directory doesn't exist
      return false;
    }
  } catch (error) {
    console.error("Error checking for Git repository:", error);
    return false;
  }
}

// Show message when no folder is opened
function showNoFolderMessage(container) {
  container.innerHTML = `
    <div class="git-message">
      <p>No folder is currently opened.</p>
      <p>Please open a folder to use Git features.</p>
      <button class="git-btn" id="git-open-folder">
        <i class="fas fa-folder-open"></i> Open Folder
      </button>
    </div>
  `;

  // Add click event to open folder button
  const openFolderBtn = document.getElementById("git-open-folder");
  if (openFolderBtn) {
    openFolderBtn.addEventListener("click", openFolder);
  }
}

// Show message to initialize Git repository
function showInitRepoMessage(container) {
  container.innerHTML = `
    <div class="git-message">
      <p>This folder is not a Git repository.</p>
      <button class="git-btn" id="git-init-repo">
        <i class="fas fa-code-branch"></i> Initialize Repository
      </button>
    </div>
  `;

  // Add click event to initialize repository button
  const initRepoBtn = document.getElementById("git-init-repo");
  if (initRepoBtn) {
    initRepoBtn.addEventListener("click", initializeGitRepo);
  }
}

// Show error message
function showErrorMessage(container, message) {
  container.innerHTML = `
    <div class="git-message error">
      <p><i class="fas fa-exclamation-triangle"></i> Error</p>
      <p>${message}</p>
      <button class="git-btn" id="git-refresh">
        <i class="fas fa-sync"></i> Refresh
      </button>
    </div>
  `;

  // Add click event to refresh button
  const refreshBtn = document.getElementById("git-refresh");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", refreshGitPanel);
  }
}

// Initialize Git repository
async function initializeGitRepo() {
  if (!rootDirectoryHandle) {
    showNotification("No folder opened", 3000);
    return;
  }

  try {
    // Execute git init command
    await executeGitCommand("git init");

    // Notify user
    showNotification("Git repository initialized successfully!");

    // Refresh Git panel
    await refreshGitPanel();

    // Update status bar
    updateStatusBarGitInfo();
  } catch (error) {
    console.error("Error initializing Git repository:", error);
    showNotification(
      `Error initializing Git repository: ${error.message}`,
      5000
    );
  }
}

// Load Git status
async function loadGitStatus(container) {
  try {
    // Get current branch
    const branchOutput = await executeGitCommand("git branch --show-current");
    gitState.currentBranch = branchOutput.trim() || "HEAD";

    // Get status
    const statusOutput = await executeGitCommand("git status --porcelain");
    processGitStatus(statusOutput);

    // Update UI
    updateGitUI(container);

    // Update status bar
    updateStatusBarGitInfo();
  } catch (error) {
    console.error("Error loading Git status:", error);
    showErrorMessage(container, error.message);
  }
}

// Process Git status output
function processGitStatus(output) {
  // Reset changes
  gitState.changes.staged = [];
  gitState.changes.unstaged = [];

  if (!output.trim()) return; // No changes

  // Process each line
  const lines = output.trim().split("\n");

  for (const line of lines) {
    if (line.length < 3) continue;

    const index = line[0];
    const workingTree = line[1];
    const filePath = line.substring(3);

    // Staged changes
    if (index !== " " && index !== "?") {
      gitState.changes.staged.push({
        status: getStatusDescription(index),
        path: filePath,
        type: index,
      });
    }

    // Unstaged changes
    if (workingTree !== " " && workingTree !== "?") {
      gitState.changes.unstaged.push({
        status: getStatusDescription(workingTree),
        path: filePath,
        type: workingTree,
      });
    }

    // Untracked files
    if (index === "?" && workingTree === "?") {
      gitState.changes.unstaged.push({
        status: "Untracked",
        path: filePath,
        type: "?",
      });
    }
  }
}

// Get human-readable status description
function getStatusDescription(code) {
  switch (code) {
    case "M":
      return "Modified";
    case "A":
      return "Added";
    case "D":
      return "Deleted";
    case "R":
      return "Renamed";
    case "C":
      return "Copied";
    case "U":
      return "Conflict";
    case "?":
      return "Untracked";
    case "!":
      return "Ignored";
    default:
      return "Unknown";
  }
}

// Update Git UI
function updateGitUI(container) {
  // Get counts
  const stagedCount = gitState.changes.staged.length;
  const unstagedCount = gitState.changes.unstaged.length;
  const totalChanges = stagedCount + unstagedCount;

  let content = `
    <div class="git-header">
      <div class="git-branch">
        <i class="fas fa-code-branch"></i>
        <span>${gitState.currentBranch}</span>
      </div>
      <div class="git-actions">
        <button class="git-action-btn" title="Refresh" id="git-refresh-btn">
          <i class="fas fa-sync"></i>
        </button>
        <button class="git-action-btn" title="Commit Changes" id="git-commit-btn" ${
          totalChanges === 0 ? "disabled" : ""
        }>
          <i class="fas fa-check"></i>
        </button>
      </div>
    </div>
  `;

  if (totalChanges === 0) {
    content += `
      <div class="git-no-changes">
        <p>There are no changes to commit.</p>
      </div>
    `;
  } else {
    // Staged changes section
    content += `
      <div class="git-section">
        <div class="git-section-header">
          <div class="git-section-title">Staged Changes (${stagedCount})</div>
        </div>
        <div class="git-changes-list">
    `;

    if (stagedCount === 0) {
      content += `<div class="git-empty-changes">No staged changes</div>`;
    } else {
      gitState.changes.staged.forEach((change) => {
        content += createChangeItemHTML(change, true);
      });
    }

    content += `
        </div>
      </div>
    `;

    // Unstaged changes section
    content += `
      <div class="git-section">
        <div class="git-section-header">
          <div class="git-section-title">Changes (${unstagedCount})</div>
          <button class="git-section-action" id="stage-all-btn" title="Stage All Changes">
            <i class="fas fa-plus"></i>
          </button>
        </div>
        <div class="git-changes-list">
    `;

    if (unstagedCount === 0) {
      content += `<div class="git-empty-changes">No unstaged changes</div>`;
    } else {
      gitState.changes.unstaged.forEach((change) => {
        content += createChangeItemHTML(change, false);
      });
    }

    content += `
        </div>
      </div>
    `;

    // Commit section
    content += `
      <div class="git-commit-section">
        <textarea id="commit-message" placeholder="Commit message" rows="3"></textarea>
        <button class="git-btn" id="git-commit-changes" ${
          stagedCount === 0 ? "disabled" : ""
        }>
          <i class="fas fa-check"></i> Commit
        </button>
      </div>
    `;
  }

  // Set content
  container.innerHTML = content;

  // Add event listeners
  addGitEventListeners();
}

// Create HTML for a change item
function createChangeItemHTML(change, isStaged) {
  let iconClass = "";

  switch (change.type) {
    case "M":
      iconClass = "fa-pen";
      break;
    case "A":
      iconClass = "fa-plus";
      break;
    case "D":
      iconClass = "fa-trash";
      break;
    case "R":
      iconClass = "fa-exchange-alt";
      break;
    case "?":
      iconClass = "fa-question";
      break;
    default:
      iconClass = "fa-file";
  }

  const actionIcon = isStaged ? "fa-minus" : "fa-plus";
  const actionTitle = isStaged ? "Unstage Changes" : "Stage Changes";

  return `
    <div class="git-change-item" data-path="${change.path}" data-staged="${isStaged}">
      <div class="git-change-icon">
        <i class="fas ${iconClass}"></i>
      </div>
      <div class="git-change-details">
        <div class="git-change-path">${change.path}</div>
        <div class="git-change-status">${change.status}</div>
      </div>
      <div class="git-change-action">
        <button class="git-action-btn" title="${actionTitle}">
          <i class="fas ${actionIcon}"></i>
        </button>
      </div>
    </div>
  `;
}

// Add event listeners for Git UI elements
function addGitEventListeners() {
  // Refresh button
  const refreshBtn = document.getElementById("git-refresh-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", refreshGitPanel);
  }

  // Commit button
  const commitBtn = document.getElementById("git-commit-changes");
  if (commitBtn) {
    commitBtn.addEventListener("click", commitChanges);
  }

  // Stage all button
  const stageAllBtn = document.getElementById("stage-all-btn");
  if (stageAllBtn) {
    stageAllBtn.addEventListener("click", stageAllChanges);
  }

  // Individual change actions
  const changeItems = document.querySelectorAll(".git-change-item");
  changeItems.forEach((item) => {
    const actionBtn = item.querySelector(".git-change-action button");
    if (actionBtn) {
      actionBtn.addEventListener("click", () => {
        const path = item.getAttribute("data-path");
        const isStaged = item.getAttribute("data-staged") === "true";

        if (isStaged) {
          unstageChange(path);
        } else {
          stageChange(path);
        }
      });
    }

    // Double click to open file
    item.addEventListener("dblclick", () => {
      const path = item.getAttribute("data-path");
      openChangedFile(path);
    });
  });
}

// Open changed file in editor
async function openChangedFile(filePath) {
  if (!rootDirectoryHandle) return;

  try {
    // Split path into folder parts
    const parts = filePath.split("/");
    const fileName = parts.pop();

    // Navigate to the file's directory
    let currentDir = rootDirectoryHandle;
    for (const part of parts) {
      if (part) {
        currentDir = await currentDir.getDirectoryHandle(part);
      }
    }

    // Get the file
    const fileHandle = await currentDir.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    const content = await file.text();

    // Store file handle and content
    const fullPath =
      parts.length > 0 ? `${parts.join("/")}/${fileName}` : fileName;
    fileHandles[fullPath] = fileHandle;
    fileContents[fullPath] = content;

    // Open file in editor
    openFile(fullPath);
  } catch (error) {
    console.error("Error opening changed file:", error);
    showNotification(`Error opening file: ${error.message}`, 3000);
  }
}

// Stage a single change
async function stageChange(filePath) {
  try {
    // Execute git add command
    await executeGitCommand(`git add "${filePath}"`);

    // Refresh Git panel
    await refreshGitPanel();
  } catch (error) {
    console.error("Error staging change:", error);
    showNotification(`Error staging change: ${error.message}`, 5000);
  }
}

// Unstage a single change
async function unstageChange(filePath) {
  try {
    // Execute git reset command
    await executeGitCommand(`git reset HEAD "${filePath}"`);

    // Refresh Git panel
    await refreshGitPanel();
  } catch (error) {
    console.error("Error unstaging change:", error);
    showNotification(`Error unstaging change: ${error.message}`, 5000);
  }
}

// Stage all changes
async function stageAllChanges() {
  try {
    // Execute git add command
    await executeGitCommand("git add .");

    // Refresh Git panel
    await refreshGitPanel();
  } catch (error) {
    console.error("Error staging all changes:", error);
    showNotification(`Error staging all changes: ${error.message}`, 5000);
  }
}

// Commit changes
async function commitChanges() {
  const messageElem = document.getElementById("commit-message");
  if (!messageElem) return;

  const message = messageElem.value.trim();

  if (!message) {
    showNotification("Please enter a commit message", 3000);
    messageElem.focus();
    return;
  }

  try {
    // Execute git commit command
    await executeGitCommand(`git commit -m "${message}"`);

    // Clear commit message
    messageElem.value = "";

    // Notify user
    showNotification("Changes committed successfully!");

    // Refresh Git panel
    await refreshGitPanel();
  } catch (error) {
    console.error("Error committing changes:", error);
    showNotification(`Error committing changes: ${error.message}`, 5000);
  }
}

// Execute Git command
async function executeGitCommand(command) {
  if (!rootDirectoryHandle) {
    throw new Error("No folder opened");
  }

  // Show command in terminal
  if (isTerminalOpen && terminal) {
    terminal.appendOutput(`$ ${command}`, "command-line");
  }

  try {
    const response = await fetch("/execute-command", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        command,
        cwd: rootDirectoryHandle.name, // Pass the current directory name
      }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error && data.error.trim()) {
      // Show error in terminal if it's open
      if (isTerminalOpen && terminal) {
        terminal.appendOutput(data.error, "error");
      }
      throw new Error(data.error);
    }

    // Show output in terminal if it's open
    if (isTerminalOpen && terminal && data.output && data.output.trim()) {
      terminal.appendOutput(data.output);
    }

    return data.output || "";
  } catch (error) {
    console.error("Error executing Git command:", error);
    throw error;
  }
}

// Update Git info in status bar
function updateStatusBarGitInfo() {
  const statusBarGitItem = document.querySelector(
    ".status-left .status-item:first-child"
  );

  if (statusBarGitItem) {
    if (gitState.isRepo) {
      statusBarGitItem.innerHTML = `
        <i class="fas fa-code-branch"></i>
        <span>${gitState.currentBranch || "main"}</span>
      `;

      // Add changes indicator if there are changes
      const totalChanges =
        gitState.changes.staged.length + gitState.changes.unstaged.length;
      if (totalChanges > 0) {
        statusBarGitItem.innerHTML += ` <span class="git-changes-indicator">${totalChanges}</span>`;
      }
    } else {
      statusBarGitItem.innerHTML = `
        <i class="fas fa-code-branch"></i>
        <span>Not a git repository</span>
      `;
    }

    // Add click handler to open git panel
    statusBarGitItem.addEventListener("click", () => {
      // Show git panel
      const gitActivityIcon = document.querySelector(
        '.activity-icon[data-panel="git"]'
      );
      if (gitActivityIcon) {
        gitActivityIcon.click();
      }
    });
  }
}

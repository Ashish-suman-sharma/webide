// Terminal functionality for Web IDE

class Terminal {
  constructor(element) {
    this.element = element;
    this.history = [];
    this.historyIndex = -1;
    this.currentInput = "";
    this.terminalOutput = document.querySelector(".terminal-output");
    this.initTerminal();
  }

  initTerminal() {
    // Create input element for user commands
    this.inputElement = document.createElement("div");
    this.inputElement.className = "terminal-input-line";

    const promptSpan = document.createElement("span");
    promptSpan.className = "terminal-prompt";
    promptSpan.textContent = "$ ";

    this.commandInput = document.createElement("input");
    this.commandInput.type = "text";
    this.commandInput.className = "terminal-command-input";
    this.commandInput.autofocus = true;

    this.inputElement.appendChild(promptSpan);
    this.inputElement.appendChild(this.commandInput);

    // Clear existing content and add the input line
    this.terminalOutput.innerHTML = "";
    this.terminalOutput.appendChild(this.inputElement);

    // Set up event listeners
    this.commandInput.addEventListener(
      "keydown",
      this.handleKeyDown.bind(this)
    );

    // Focus the input when terminal is clicked
    this.terminalOutput.addEventListener("click", () => {
      this.commandInput.focus();
    });

    // Initial welcome message
    this.appendOutput("Web IDE Terminal - Connected to local machine");
    this.appendOutput("Type commands to compile and run your code");

    // Test server connection
    this.testServerConnection();
  }

  testServerConnection() {
    fetch("/health")
      .then((response) => response.json())
      .then((data) => {
        console.log("Server connection test successful:", data);
      })
      .catch((error) => {
        console.error("Server connection test failed:", error);
        this.appendOutput(
          "Warning: Terminal server connection failed. Make sure the server is running.",
          "error"
        );
      });
  }

  handleKeyDown(event) {
    if (event.key === "Enter") {
      const command = this.commandInput.value.trim();
      if (command) {
        this.executeCommand(command);
        this.history.push(command);
        this.historyIndex = this.history.length;
        this.commandInput.value = "";
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.commandInput.value = this.history[this.historyIndex];
        // Move cursor to end of input
        setTimeout(() => {
          this.commandInput.selectionStart = this.commandInput.selectionEnd =
            this.commandInput.value.length;
        }, 0);
      }
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        this.commandInput.value = this.history[this.historyIndex];
      } else if (this.historyIndex === this.history.length - 1) {
        this.historyIndex = this.history.length;
        this.commandInput.value = "";
      }
    } else if (event.key === "c" && event.ctrlKey) {
      // Handle Ctrl+C to cancel current command
      event.preventDefault();
      this.appendOutput("^C", "command-line");
      this.commandInput.value = "";
    }
  }

  executeCommand(command) {
    // Display the command in the terminal
    this.appendOutput(`$ ${command}`, "command-line");

    // Handle special commands
    if (command === "clear" || command === "cls") {
      this.clear();
      return;
    }

    // Execute the command on the local machine
    this.executeLocalCommand(command);
  }

  executeLocalCommand(command) {
    // Show loading indicator
    const loadingId = this.showLoading();

    // Use fetch to send the command to a server endpoint that will execute it
    fetch("/execute-command", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ command }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // Hide loading indicator
        this.hideLoading(loadingId);

        if (data.output && data.output.trim() !== "") {
          this.appendOutput(data.output);
        }
        if (data.error && data.error.trim() !== "") {
          this.appendOutput(data.error, "error");
        }
        if (
          (!data.output || data.output.trim() === "") &&
          (!data.error || data.error.trim() === "")
        ) {
          // Command executed successfully but no output
          this.appendOutput("Command executed successfully with no output");
        }
      })
      .catch((error) => {
        // Hide loading indicator
        this.hideLoading(loadingId);

        console.error("Terminal command error:", error);
        this.appendOutput(`Error executing command: ${error.message}`, "error");
        this.appendOutput(
          "Make sure the server is running (npm start)",
          "error"
        );
      });
  }

  showLoading() {
    const loadingLine = document.createElement("div");
    loadingLine.className = "terminal-line loading";
    loadingLine.textContent = "Executing command...";

    this.terminalOutput.insertBefore(loadingLine, this.inputElement);
    this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;

    return Date.now(); // Return a unique ID for this loading indicator
  }

  hideLoading(loadingId) {
    const loadingLines = document.querySelectorAll(".terminal-line.loading");
    loadingLines.forEach((line) => {
      this.terminalOutput.removeChild(line);
    });
  }

  appendOutput(text, className = "") {
    if (!text) return;

    const outputLine = document.createElement("div");
    outputLine.className = `terminal-line ${className}`;

    // Handle multi-line output
    const lines = text.split("\n");
    lines.forEach((line, index) => {
      if (index > 0) {
        outputLine.appendChild(document.createElement("br"));
      }
      outputLine.appendChild(document.createTextNode(line));
    });

    this.terminalOutput.insertBefore(outputLine, this.inputElement);

    // Scroll to bottom
    this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;
  }

  clear() {
    // Remove all output lines but keep the input line
    while (this.terminalOutput.firstChild !== this.inputElement) {
      this.terminalOutput.removeChild(this.terminalOutput.firstChild);
    }
  }
}

// Initialize terminal when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Terminal will be initialized by main.js
});

// Export the Terminal class
window.Terminal = Terminal;

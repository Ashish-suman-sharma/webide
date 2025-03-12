// Server for Web IDE Terminal
const express = require("express");
const { exec } = require("child_process");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, "/")));

// Endpoint to execute terminal commands
app.post("/execute-command", (req, res) => {
  const { command, cwd } = req.body;

  if (!command) {
    return res.status(400).json({ error: "Command is required" });
  }

  console.log(`Executing command: ${command}`);

  // Execute the command with a shell option to ensure proper execution
  exec(
    command,
    {
      maxBuffer: 1024 * 1024,
      shell: true,
      windowsHide: true,
      cwd: cwd ? path.join(__dirname, cwd) : __dirname // Use the provided working directory
    },
    (error, stdout, stderr) => {
      console.log(
        `Command result - stdout: ${stdout ? "present" : "empty"}, stderr: ${
          stderr ? "present" : "empty"
        }, error: ${error ? error.message : "none"}`
      );

      // Always return a valid JSON response
      return res.json({
        output: stdout ? stdout : "",
        error: stderr ? stderr : error ? error.message : "",
      });
    }
  );
});

// Add a simple health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Web IDE terminal is now connected to your local machine`);
});

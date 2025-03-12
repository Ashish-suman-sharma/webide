# Web IDE with Local Terminal Integration

This is a web-based IDE with a terminal that connects to your local machine, allowing you to compile and run code directly from the browser.

## Features

- **Monaco Editor Integration**: Uses the same editor that powers VS Code
- **File Explorer**: Browse, create, rename, and delete files and folders
- **Terminal with local machine access**: Compile and run code directly from the browser
- **Syntax highlighting**: Highlight code syntax
- **Dark theme**: Classic VS Code dark theme styling

## Setup and Installation

1. Make sure you have Node.js installed on your machine
2. Clone this repository
3. Install dependencies:
   ```
   npm install
   ```
4. Start the server:
   ```
   npm start
   ```
5. Open your browser and navigate to `http://localhost:3000`

## Using the Terminal

The terminal in this Web IDE connects directly to your local machine, allowing you to:

1. Compile code using local compilers
2. Run build tools
3. Execute any command that you would normally run in your system's terminal

To use the terminal:

1. Click on the terminal icon in the status bar or press `` Ctrl+` `` to open the terminal panel
2. Type your commands as you would in a regular terminal
3. Press Enter to execute commands
4. Use Up/Down arrow keys to navigate through command history

Example commands:

- `gcc -o myprogram myprogram.c` - Compile a C program
- `python script.py` - Run a Python script
- `npm run build` - Run an npm script

## Security Note

Since the terminal has access to your local machine, be careful when using this in a shared environment. The server should only be run locally and not exposed to the internet.

## License

MIT

## Technologies Used

- **HTML5**: Structure of the application
- **CSS3**: Styling and layout
- **JavaScript**: Core functionality and interactivity
- **Monaco Editor**: Code editing capabilities
- **Font Awesome**: Icons for the interface

## Project Structure

```
webide/
├── index.html          # Main HTML file
├── css/                # CSS styles
│   ├── style.css       # Global styles
│   ├── sidebar.css     # Sidebar styles
│   ├── editor.css      # Editor styles
│   └── statusbar.css   # Status bar styles
├── js/                 # JavaScript files
│   ├── main.js         # Main application logic
│   ├── sidebar.js      # Sidebar functionality
│   ├── editor.js       # Editor functionality
│   └── fileExplorer.js # File explorer functionality
└── assets/             # Assets directory
    ├── icons/          # Icon files
    └── fonts/          # Font files
```

## Limitations

This is a demonstration project and has the following limitations:

- Files are stored in memory and will be lost on page refresh
- No server-side functionality for persistent storage
- Limited language support compared to the full VS Code
- Some advanced features are simulated or not implemented

## Future Enhancements

- Add persistent storage using IndexedDB or localStorage
- Implement more VS Code features (extensions, debugging)
- Add more themes and customization options
- Improve terminal functionality
- Add collaborative editing features

## Acknowledgements

- Microsoft for creating Visual Studio Code
- Monaco Editor team for making the editor available as a standalone component
- Font Awesome for the icons

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: 'TalentMatch - AI Healthcare Recruitment',
    backgroundColor: '#090d16',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: false,
    },
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devServerUrl).catch(() => {
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Native Windows folder dialog
ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Resume Folder to Watch',
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const dirPath = result.filePaths[0];
  return {
    path: dirPath,
    name: path.basename(dirPath),
  };
});

// Native Windows folder scanner with full OS file system permissions
ipcMain.handle('folder:readFiles', async (event, dirPath) => {
  if (!dirPath || !fs.existsSync(dirPath)) {
    return [];
  }

  const validExts = ['.pdf', '.docx', '.doc', '.txt'];
  const files = [];

  function traverseDir(currentPath) {
    try {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (validExts.includes(ext)) {
            try {
              const stat = fs.statSync(fullPath);
              const data = fs.readFileSync(fullPath);
              files.push({
                name: entry.name,
                path: fullPath,
                size: stat.size,
                lastModified: stat.mtimeMs,
                data: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
              });
            } catch (readErr) {
              console.warn(`Could not read file ${fullPath}:`, readErr);
            }
          }
        } else if (entry.isDirectory()) {
          traverseDir(fullPath);
        }
      }
    } catch (err) {
      console.warn(`Could not traverse directory ${currentPath}:`, err);
    }
  }

  traverseDir(dirPath);
  return files;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

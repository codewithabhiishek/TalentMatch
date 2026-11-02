const { app, BrowserWindow, ipcMain, dialog, Notification, shell } = require('electron');
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

  const isDev = process.env.NODE_ENV === 'development';
  const distHtmlPath = path.join(__dirname, '../dist/index.html');

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL).catch((err) => {
      console.warn('Dev server URL failed, falling back to dist/index.html:', err.message);
      if (fs.existsSync(distHtmlPath)) {
        mainWindow.loadFile(distHtmlPath);
      }
    });
  } else if (fs.existsSync(distHtmlPath)) {
    // Standard local desktop run (npm run electron -> builds dist and loads directly)
    mainWindow.loadFile(distHtmlPath);
  } else {
    // If dist hasn't been built yet, try default dev port or wait
    mainWindow.loadURL('http://localhost:3000').catch(() => {
      console.error('Cannot load application: dist/index.html does not exist and dev server is offline.');
    });
  }

  // Defensive navigation security: prevent opening arbitrary untrusted web URLs inside electron window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Only open trusted external protocols (http/https) in the user's default OS browser
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    // Prevent in-window navigation away from local bundle
    if (url !== mainWindow.webContents.getURL() && !url.startsWith('file://')) {
      event.preventDefault();
      if (url.startsWith('https://') || url.startsWith('http://')) {
        shell.openExternal(url);
      }
    }
  });

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

// Native OS Notifications with Sound & Window Attention
ipcMain.handle('notification:show', async (event, { title, body, silent = false }) => {
  try {
    if (Notification.isSupported()) {
      const iconPath = path.join(__dirname, '../public/favicon.svg');
      const notification = new Notification({
        title: title || 'TalentMatch',
        body: body || 'Clinical processing completed.',
        silent: Boolean(silent),
        icon: fs.existsSync(iconPath) ? iconPath : undefined,
      });

      notification.on('click', () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
        }
      });

      notification.show();

      // Alert user if window is backgrounded / minimized
      if (mainWindow && !mainWindow.isFocused()) {
        if (process.platform === 'darwin' && app.dock) {
          app.dock.bounce('informational');
        } else if (process.platform === 'win32') {
          mainWindow.flashFrame(true);
        }
      }

      return true;
    }
  } catch (err) {
    console.warn('Native notification failed:', err);
  }
  return false;
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

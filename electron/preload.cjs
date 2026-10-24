const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  readFolderFiles: (dirPath) => ipcRenderer.invoke('folder:readFiles', dirPath),
  platform: process.platform,
  isElectron: true,
});

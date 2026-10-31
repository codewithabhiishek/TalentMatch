const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  readFolderFiles: (dirPath) => ipcRenderer.invoke('folder:readFiles', dirPath),
  showNotification: (options) => ipcRenderer.invoke('notification:show', options || {}),
  platform: process.platform,
  isElectron: true,
});

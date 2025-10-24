const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('settings', {
  load: () => ipcRenderer.invoke('load-settings'),
  save: (data) => ipcRenderer.invoke('save-settings', data)
});

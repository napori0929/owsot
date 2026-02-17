const { contextBridge, ipcRenderer, shell } = require("electron");

contextBridge.exposeInMainWorld("settings", {
  load: () => ipcRenderer.invoke("load-settings"),
  save: (data) => ipcRenderer.invoke("save-settings", data)
});

contextBridge.exposeInMainWorld("electronAPI", {
  openExternal: (url) => ipcRenderer.invoke("open-external", url)
});

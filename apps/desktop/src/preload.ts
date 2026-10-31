import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("motionForgeDesktop", {
  isDesktop: true,
  platform: process.platform,
  version: "0.1.0",
  openExternal: (url: string) => ipcRenderer.invoke("desktop:open-external", url),
  showItemInFolder: (filePath: string) => ipcRenderer.invoke("desktop:show-in-folder", filePath),
  openFolder: (folderPath: string) => ipcRenderer.invoke("desktop:open-folder", folderPath),
  selectMediaFiles: () => ipcRenderer.invoke("desktop:select-media-files"),
  getServerUrl: () => "http://127.0.0.1:4100",
});

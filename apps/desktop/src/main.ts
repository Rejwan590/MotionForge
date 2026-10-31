import { app, BrowserWindow, ipcMain, shell, dialog } from "electron";
import path from "node:path";
import http from "node:http";
import { spawn, ChildProcess } from "node:child_process";

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;

const SERVER_PORT = 4100;
const WEB_PORT = 5173;

function isServerListening(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureBackendServer(): Promise<void> {
  const isRunning = await isServerListening(SERVER_PORT);
  if (isRunning) {
    console.log(`Backend server already running on port ${SERVER_PORT}`);
    return;
  }

  console.log("Starting backend server for desktop app...");
  const serverDist = path.resolve(__dirname, "../../server/dist/index.js");
  serverProcess = spawn(process.execPath, [serverDist], {
    stdio: "inherit",
    detached: false,
    env: { ...process.env, PORT: String(SERVER_PORT) },
  });

  // Wait for server ready
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 250));
    if (await isServerListening(SERVER_PORT)) {
      console.log("Backend server started successfully.");
      break;
    }
  }
}

async function createWindow() {
  await ensureBackendServer();

  mainWindow = new BrowserWindow({
    width: 1536,
    height: 1024,
    minWidth: 1200,
    minHeight: 800,
    backgroundColor: "#0d0f12",
    title: "MotionForge Studio",
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  // Try loading live Vite preview / dev server first, fallback to static built file
  const webUrl = `http://127.0.0.1:${WEB_PORT}`;
  try {
    await mainWindow.loadURL(webUrl);
  } catch (err) {
    console.warn(`Could not connect to ${webUrl}, loading built static files...`);
    const indexPath = path.resolve(__dirname, "../../web/dist/index.html");
    await mainWindow.loadFile(indexPath);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle("desktop:open-external", async (_event, url: string) => {
  if (typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://"))) {
    await shell.openExternal(url);
  }
});

ipcMain.handle("desktop:show-in-folder", async (_event, filePath: string) => {
  if (typeof filePath === "string") {
    shell.showItemInFolder(filePath);
  }
});

ipcMain.handle("desktop:open-folder", async (_event, folderPath: string) => {
  if (typeof folderPath === "string") {
    await shell.openPath(folderPath);
  }
});

ipcMain.handle("desktop:select-media-files", async () => {
  if (!mainWindow) return [];
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Select Media Assets",
    properties: ["openFile", "multiSelections"],
    filters: [
      { name: "Media Files", extensions: ["mp4", "mov", "avi", "png", "jpg", "jpeg", "wav", "mp3"] },
      { name: "Video Files", extensions: ["mp4", "mov", "webm", "avi"] },
      { name: "Audio Files", extensions: ["wav", "mp3", "m4a", "flac"] },
      { name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "svg"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });
  return result.canceled ? [] : result.filePaths;
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (serverProcess) {
      serverProcess.kill();
    }
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

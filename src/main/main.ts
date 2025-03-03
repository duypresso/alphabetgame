import { app, BrowserWindow, session, ipcMain } from 'electron';
import * as path from 'path';

async function clearCache() {
  const ses = session.defaultSession;
  try {
    await ses.clearCache();
    await ses.clearStorageData({
      storages: ['appcache', 'shadercache', 'cachestorage', 'localstorage', 'cookies']
    });
    console.log('Cache cleared successfully');
  } catch (err) {
    console.error('Error clearing cache:', err);
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(async () => {
  await clearCache();
  createWindow();
});

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

ipcMain.handle('clear-cache', async () => {
  await clearCache();
  return true;
});

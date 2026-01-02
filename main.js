const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 1280,
        height: 800,
        icon: path.join(__dirname, 'dist/garage-crm/browser/favicon.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadURL(
        url.format({
            pathname: path.join(__dirname, 'dist/garage-crm/browser/index.html'),
            protocol: 'file:',
            slashes: true
        })
    );

    // win.webContents.openDevTools();

    win.on('closed', () => {
        win = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});

const {app, BrowserWindow, ipcMain, Menu} = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url')
const isDev = process.env.NODE_ENV === 'production';
const {generateLicense, validateLicense} = require('./src/license');

ipcMain.handle('generate-license', (event, expiryDate, userCount) => {
    return generateLicense(expiryDate, userCount);
});

ipcMain.handle('validate-license', (event, license) => {
    return validateLicense(license);
});

// 定义存储激活结果的文件路径
const activationFilePath = path.join(app.getPath('userData'), 'xw-wicx2.pk');
console.log(activationFilePath)
ipcMain.handle('saveRegCode', (event, regCode) => {
    return fs.writeFileSync(activationFilePath, regCode);
});

ipcMain.handle('getRegCode', (event) => {
    if (fs.existsSync(activationFilePath)) {
        return fs.readFileSync(activationFilePath, 'utf-8');
    }
    return null;
});

function createWindow() {
    const mainWindow = new BrowserWindow({
        icon: path.join(__dirname, 'public', 'favicon.ico'), // 设置窗口图标
        width: 800,
        height: 680,
        resizable: false,      // 禁止调整窗口大小
        maximizable: false,    // 禁用最大化按钮
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    if (process.env.NODE_ENV === 'development') {
        //开发环境
        mainWindow.loadURL('http://localhost:3000');
    } else {
        // 生产环境
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, "build", 'index.html'),
            protocol: 'file:',
            slashes: true
        }))
    }
}

app.on('ready', createWindow);
// 取消默认菜单栏
Menu.setApplicationMenu(null);

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

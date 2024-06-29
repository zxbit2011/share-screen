const {app, BrowserWindow, dialog} = require('electron');
const {spawn, exec} = require('child_process');
const path = require('path');

let externalProcess;

// 检查并结束 vncproxy.exe 进程的函数
function killVNCProxy() {
    exec('taskkill /F /IM vncproxy.exe', (err, stdout, stderr) => {
        if (err) {
            console.error('Error killing vncproxy.exe:', err);
            return;
        }
        console.log('vncproxy.exe killed successfully:', stdout);
    });
}


function createWindow() {
    killVNCProxy()

// 获取应用程序的安装路径
    let exePath = null;
// 在开发环境中，可能会有不同的路径结构
    if (process.env.NODE_ENV === 'development') {
        console.log('1')
        exePath = path.join(__dirname, 'resources', 'vncproxy.exe');
    } else {
        console.log('2')
        exePath = path.join(process.cwd(), 'resources', 'resources', 'vncproxy.exe');
    }
    console.log(exePath)
    /*dialog.showMessageBox({
        type: 'warning',
        title: '执行文件路径',
        message: exePath,
        buttons: ['OK']
    }).then((result) => {
        console.log(result);
    }).catch((err) => {
        console.log(err);
    });*/


    const mainWindow = new BrowserWindow({
        icon: 'app.ico',
        width: 800,
        height: 600,
        webPreferences: {
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
        },
        resizable: false,    // 禁用放大按钮
        // minimizable: false,  // 禁用缩小按钮
        maximizable: false   // 禁用最大化按钮
    });
    mainWindow.setMenu(null); // 完全移除菜单栏
    mainWindow.loadFile('index.html');
    // 启动外部 exe
    // console.log('执行的exe路径：', exePath)
    // 弹出一个简单的警告框

    setTimeout(function () {
        externalProcess = spawn(exePath, [], {
            detached: true,
            stdio: 'ignore'
        });
        externalProcess.unref();
    },500)
}

app.on('ready', createWindow);
// 在应用程序退出前停止外部 exe
app.on('before-quit', () => {
    if (externalProcess) {
        exec(`taskkill /pid ${externalProcess.pid} /f /t`, (err, stdout, stderr) => {
            if (err) {
                console.error(`Error stopping the external process: ${stderr}`);
            } else {
                console.log(`External process stopped: ${stdout}`);
            }
        });
    }
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
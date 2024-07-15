const {app, BrowserWindow, Tray, Menu, ipcMain, dialog} = require('electron');
const {spawn, exec} = require('child_process');
const path = require('path');
const os = require('os')
// 引入 electron-log
const log = require('electron-log');

// 关闭控制台打印
// log.transports.console.level = false
log.transports.file.level = 'debug'
log.transports.file.maxSize = 10024300 // 文件最大不超过 10M
// 输出格式
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}'
let date = new Date()
let dateStr = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()
// 文件位置及命名方式
// 默认位置为：C:\Users\[user]\AppData\Roaming\[appname]\electron_log\
// 文件名为：年-月-日.log
// 自定义文件保存位置为安装目录下 \log\年-月-日.log
log.transports.file.resolvePath = () => 'log\\' + dateStr + '.log';

// 重定向 console 输出到日志库
console.log = log.info;
console.error = log.error;
console.warn = log.warn;

console.log('测试日志')

let externalProcess;
let tray = null

// 检查并结束 screego.exe 进程的函数
function killVNCProxy() {
    exec('taskkill /F /IM screego.exe', (err, stdout, stderr) => {
        if (err) {
            console.error('Error killing screego.exe:', err);
            return;
        }
        console.log('screego.exe killed successfully:', stdout);
    });
}


function createWindow() {
    killVNCProxy()

    // 获取应用程序的安装路径
    let exePath = null;
    // 在开发环境中，可能会有不同的路径结构
    if (process.env.NODE_ENV === 'development') {
        console.log('1')
        // exePath = path.join(__dirname, 'resources', 'screego.exe');
        exePath = path.join(__dirname, 'resources');
    } else {
        console.log('2')
        // exePath = path.join(process.cwd(), 'resources', 'resources', 'screego.exe');
        exePath = path.join(process.cwd(), 'resources', 'resources');
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
        width: 900,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
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

    // 点击关闭时，并没有真正关闭，而是隐藏窗口
    mainWindow.on('close', (event) => {
        if (!app.isQuiting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    // 创建托盘图标
    tray = new Tray(path.join(__dirname, 'app.ico'));
    const contextMenu = Menu.buildFromTemplate([
        {
            label: '打开',
            click: () => {
                mainWindow.show();
            },
        },
        {
            label: '退出',
            click: () => {
                app.isQuiting = true;
                app.quit();
            },
        },
    ]);

    tray.setToolTip('XW-WICX共享屏幕');
    tray.setContextMenu(contextMenu);

    // 当用户点击托盘图标时显示窗口
    tray.on('click', () => {
        mainWindow.show();
    });

    // 启动外部 exe
    // console.log('执行的exe路径：', exePath)
    // 弹出一个简单的警告框

    setTimeout(function () {

        const command = 'cmd.exe'; // Windows 环境下的命令行
        const args = ['/c', 'screego.exe', 'serve'];
        externalProcess = spawn(command, args, {
            // detached: true,
            stdio: 'ignore',
            cwd: exePath, // 指定工作目录
            shell: true, // 使用 shell 执行命令
        });
        /*// 捕获子进程的标准输出
        externalProcess.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
            dialog.showMessageBox({
                type: 'warning',
                title: '执行文件路径',
                message: `stdout: ${data}`,
                buttons: ['OK']
            }).then((result) => {
                console.log(result);
            }).catch((err) => {
                console.log(err);
            });
        });

        // 捕获子进程的标准错误输出
        externalProcess.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
            dialog.showMessageBox({
                type: 'warning',
                title: '执行文件路径',
                message: `stderr: ${data}`,
                buttons: ['OK']
            }).then((result) => {
                console.log(result);
            }).catch((err) => {
                console.log(err);
            });
        });*/

        externalProcess.unref();
    }, 1500)

    getLocalLanIp()
}

async function getLocalLanIp() {
    ipcMain.handle('get-local-lan-ip', async () => {
        // console.log('get-local-lan-ip')

        /*const {internalIpV4} = await import('internal-ip');
        let ip = await internalIpV4();
        // console.log('ip', ip);
        // If ip is '192.168.0.0', log network interfaces
        if (ip === '192.168.0.0') {
            const os = require('os');

            // Get all network interfaces
            const interfaces = os.networkInterfaces();
            // console.log('Network Interfaces:', interfaces);

            // Find the IPv4 address (assuming you want IPv4)
            for (const key in interfaces) {
                for (const iface of interfaces[key]) {
                    if (!iface.internal && iface.family === 'IPv4') {
                        ip = iface.address;
                        break;
                    }
                }
                if (ip) break;
            }
        }
        return ip;*/

         return getLocalIP()
    });
}

function getLocalIP() {
    const ifaces = os.networkInterfaces();
    let ip = '';
    for (let dev in ifaces) {
        for (let i = 0; i < ifaces[dev].length; i++) {
            if (!ifaces[dev][i].internal && ifaces[dev][i].family === 'IPv4' && !ifaces[dev][i].address.includes('::') && ifaces[dev][i].address !== '127.0.0.1') {
                ip = ifaces[dev][i].address;
                break;
            }
        }
    }
    return ip;
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

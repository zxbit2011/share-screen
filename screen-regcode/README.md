# 投屏软件注册码客户端
#### 本地开发环境
````
npm run electron 
````

#### 本地客户端打包
````
npm run package-win
````

> 注意调试和打包的时候需要修改main.js代码
````
    // if (isDev) {
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, "build", 'index.html'),
            protocol: 'file:',
            slashes: true
        }))
    /*} else {
        mainWindow.loadURL('http://localhost:3000');
    }*/
````
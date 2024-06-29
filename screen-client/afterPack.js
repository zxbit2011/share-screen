const path = require("path");
const fs = require("fs-extra"); // fs 的一个扩展
// const {extractFile, listPackage} = require('asar');

module.exports = async (context) => {
    const unpackedDir = path.join(context.appOutDir, "locales");

    // 删除除 zh-CN.pak 之外的所有文件
    let files = await fs.readdir(unpackedDir);
    for (const file of files) {
        if (!file.endsWith("zh-CN.pak")) {
            await fs.remove(path.join(unpackedDir, file));
        }
    }

    // 删除特定的文件
    const filesToDelete = ["LICENSE.electron.txt", "LICENSES.chromium.html"];

    for (const fileName of filesToDelete) {
        const filePath = path.join(context.appOutDir, fileName);
        if (await fs.pathExists(filePath)) {
            await fs.remove(filePath);
        }
    }
/*
    // 获取 asar 文件路径
    const asarPath = path.join(context.appOutDir, 'resources', 'app.asar');

// 使用 asar 模块的 listPackage 方法直接获取文件列表
    files = listPackage(asarPath);

// 打印文件列表及其路径
    console.log('Files in asar archive:');
    files.forEach(file => {
        console.log(file);
    });*/
};
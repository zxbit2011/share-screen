const crypto = require('crypto');
const keyHex = '0c7b6459aa659a84bf7dc573331d05c2ccd88c2e4f775bc0c47ca055b24818f3';
const ivHex = '61f4eb5a72dcbccbc023958aefc0fbb3';

// 将十六进制字符串转换为Buffer
const key = Buffer.from(keyHex, 'hex');
const iv = Buffer.from(ivHex, 'hex');
// 确保密钥和 IV 长度正确
console.log('Key length:', key.length); // 应该是 32
console.log('IV length:', iv.length);   // 应该是 16


// 加密函数
function encryptWithPublicKey(text) {
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

// 解密函数
function decryptWithPrivateKey(encryptedText) {
    try {
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        return null
    }
}

// 生成随机 10 位字符串
function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

// 生成注册码
function generateLicense(expiryDate, userCount) {
    const guid = generateRandomString(10);
    const licenseData = `${guid}|${expiryDate}|${userCount}`;
    return encryptWithPublicKey(licenseData);
}

// 验证注册码
function validateLicense(encryptedLicense) {
    try {
        return decryptWithPrivateKey(encryptedLicense)
    } catch (error) {
        console.error('解密失败:', error);
        return null;
    }
}

module.exports = {
    generateLicense,
    validateLicense
};

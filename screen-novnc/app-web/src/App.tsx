import {useEffect, useState} from 'react'
import {VncScreen} from './lib';
import CryptoJS from 'crypto-js';
import './App.css'

import noWifi from './assets/nowifi.png';
import loadingImg from './assets/loading.png';

const key = CryptoJS.enc.Hex.parse('0c7b6459aa659a84bf7dc573331d05c2ccd88c2e4f775bc0c47ca055b24818f3'); // 您需要从安全的地方获取这个密钥的十六进制表示
const iv = CryptoJS.enc.Hex.parse('61f4eb5a72dcbccbc023958aefc0fbb3');

function decrypt(encryptedText) {
    const result = {
        isSuccess: false,
        message: '激活码异常',
        expiryDate: '',
        userCount: '',
    };
    try {
        const decipher = CryptoJS.AES.decrypt({
            ciphertext: CryptoJS.enc.Hex.parse(encryptedText)
        }, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        const decrypted = decipher.toString(CryptoJS.enc.Utf8);
        if (decrypted) {
            const reg = decrypted.split('|');
            if (reg.length === 3) {
                const currentDate = new Date();
                const expiryDate = new Date(reg[1]);
                if (currentDate <= expiryDate || reg[1] === '') {
                    result.isSuccess = true;
                    result.expiryDate = reg[1];
                    result.userCount = reg[2];
                    result.message = '已激活';
                } else {
                    result.isSuccess = false;
                    result.expiryDate = reg[1];
                    result.userCount = reg[2];
                    result.message = '激活码已过期';
                }
            } else {
                result.isSuccess = false;
                result.message = '激活码错误';
            }
        } else {
            result.message = '激活码无效';
        }
        return result;
    } catch (e) {
        console.log(
            'decryptWithPrivateKey encryptedText：',
            encryptedText,
            'catch：',
            e
        );
        result.message = e.toString();
    }
    return result;
}

export default (props): React.ReactNode => {
    // 注册码激活
    const encrypted = 'f180caa779ae99e7a0d27bcea4ad5d5d6982134a01a103553dac9dd4148e61b9'; // 从Node.js加密函数获得的加密数据
    console.log('decrypted: ', decrypt(encrypted));


    console.log(location)
    let host = location.host

    // 测试环境
    // host = '192.168.0.117:3003'

    const [regCodeStr, setRegCodeStr] = useState('');
    const [isRegCodeValid, setIsRegCodeValid] = useState(null);
    const [isFullScreen, setIsFullScreen] = useState(false)
    const [activateFullScreen, setActivateFullScreen] = useState(false)
    const [isRegCode, setIsRegCode] = useState(false);
    const [showLog, setShowLog] = useState(false);
    const [connectState, setConnectState] = useState(false);
    const [loading, setLoading] = useState(true);

    // 验证码注册码
    const handleValidate = (str) => {
        if (str) {
            const regCodeInfo = decrypt(str);
            setIsRegCodeValid(regCodeInfo);
        } else {
            setIsRegCodeValid(null);
        }
    };

    // 保存注册码
    const saveRegCode = async () => {
        if (!regCodeStr) {
            alert('请输入激活码');
            return;
        }
        const regCodeInfo = decrypt(regCodeStr);
        if (!regCodeInfo.isSuccess) {
            alert(regCodeInfo.message);
            return;
        }
        fetch(`http://${host}/api/saveRegCode?key=${regCodeStr}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        }).then(function (res) {
            if (!res.ok) {
                alert('服务网络连接失败')
                return
            }
            res.json().then(json => {
                    if (json.code === 200) {
                        setIsRegCode(true);
                    } else {
                        alert(json.message)
                    }
                }
            );
        });
    };

    // 保存注册码
    const getRegCode = async () => {
        fetch(`http://${host}/api/getRegCode`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        }).then(function (res) {
            setLoading(false)
            if (!res.ok) {
                setConnectState(false)
                return
            }
            setConnectState(true)
            res.json().then(json => {
                    console.log('存储的授权码', json)
                    if (json.code === 200) {
                        const regCodeInfo = decrypt(json.data);
                        setIsRegCodeValid(regCodeInfo);
                        if (regCodeInfo.isSuccess) {
                            if (json.onlineCount >= parseInt(regCodeInfo.userCount)) {
                                alert('连接数已达上限');
                                return
                            }
                            setIsRegCode(true);
                        }
                    } else {
                        alert(json.message)
                    }
                }
            );
        })
    };
    useEffect(() => {
        getRegCode()
    }, []);


    return connectState ? (isRegCode ?
            <div className="screen-content">
                {activateFullScreen && <div className="full-screen-div" onClick={() => {
                    // setIsFullScreen(!isFullScreen)
                }}>
                    <div
                        className={isFullScreen ? "off-full-screen full-screen" : "full-screen"}>{isFullScreen ? '取消全屏' : '全屏'}</div>
                </div>}

                <VncScreen
                    className="screen"
                    url={`ws://${host}/ws`}
                    // url={`ws://${host}/socket/ws`} // vite 运行测试
                    password="S9sbd9gMXXghlX6u"
                    style={{
                        width: '100vw',
                        height: '100vh',
                    }}
                    scaleViewport
                    focusOnClick
                />
            </div> :
            <div className="codeBody">
                <h1>
                    XW-WICX软件授权
                </h1>
                <div className="tip">
                    输入XW-WICX注册码后验证成功，才能使用此软件！
                </div>
                <div className="form-item">
                    <div className="form-label">注册码：</div>
                    <textarea
                        className="no-resize"
                        placeholder="请输入XW-WICX注册码"
                        value={regCodeStr}
                        onChange={(e) => {
                            setRegCodeStr(e.target.value);
                            handleValidate(e.target.value);
                        }}
                    />
                </div>

                {isRegCodeValid && (
                    <p className="validateResult">
                        {isRegCodeValid.isSuccess ? (
                            <span className="codeYes">
                  注册码有效，到期时间：
                                {isRegCodeValid.expiryDate
                                    ? isRegCodeValid.expiryDate
                                    : '长期有效'}
                                ，最大连接数：
                                {isRegCodeValid.userCount
                                    ? isRegCodeValid.userCount
                                    : '无限制连接数'}
                </span>
                        ) : (
                            <span className="codeNo">{isRegCodeValid.message}</span>
                        )}
                    </p>
                )}
                <div className="generatebody form-item">
                    <div className="form-label"/>
                    <div className="form-content">
                        <button
                            type="button"
                            className="generateBtn"
                            disabled={!(isRegCodeValid && isRegCodeValid.isSuccess)}
                            onClick={saveRegCode}
                        >
                            注册激活
                        </button>
                    </div>
                </div>
                {showLog && (
                    <div>
                        <label>解析日志：</label>
                        <p>{decryptLog}</p>
                    </div>
                )}
            </div>

    ) : loading ? <div className="loading">
        <div>
            <img src={loadingImg}/>
        </div>
        <p>正在努力连接共享服务中...</p>
    </div> : <div className="no-wifi">
        <div>
            <img src={noWifi}/>
        </div>
        <p>请检查网络是否通畅，或共享屏幕服务是否开启！</p>
    </div>
}


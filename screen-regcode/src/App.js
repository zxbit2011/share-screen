// src/App.js
import React, {useEffect, useState} from 'react';
import './index.css'
const {ipcRenderer} = window.require('electron');

function App() {
    const [expiryDate, setExpiryDate] = useState('');
    const [userCount, setUserCount] = useState('');
    const [license, setLicense] = useState('');
    const [isValid, setIsValid] = useState(null);
    const [saveRegCodeResult, setSaveRegCodeResult] = useState(null);
    const [getRegCodeResult, setGetRegCodeResult] = useState(null);

    const handleGenerate = () => {
        ipcRenderer.invoke('generate-license', expiryDate, userCount).then(setLicense);
    };

    const handleValidate = () => {
        ipcRenderer.invoke('validate-license', license).then(setIsValid);

        saveRegCode(license)
    };

    const saveRegCode = (regCode) => {
        ipcRenderer.invoke('saveRegCode', regCode).then(setSaveRegCodeResult);
    };
    const getRegCode = () => {
        ipcRenderer.invoke('getRegCode').then(setGetRegCodeResult);
    };

    useEffect(()=>{
        getRegCode()
    },[])

    return (
        <div className="codeBody">
            {/*<p>写入状态：{saveRegCodeResult}</p>*/}
            {/*<p>激活数据：{getRegCodeResult}</p>*/}
            <h1>生成注册码</h1>
            <div className="tip">注：到期日期不填时为长期有效，用户连接数不填则不限连接数据！</div>
            <div className="form-item">
                <div className="form-label">到期日期：</div>
                <input
                    type="date"
                    placeholder="请选择到期日期"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                />
            </div>
            <div className="form-item">
                <div className="form-label">用户连接数：</div>
                <input
                    type="number"
                    placeholder="请输入连接数"
                    value={userCount}
                    onChange={(e) => setUserCount(e.target.value)}
                />
            </div>
            <div className="generatebody form-item">
                <div className="form-label"></div>
                <button className="generateBtn" onClick={handleGenerate}>生成注册码</button>
            </div>
            <div className="line"></div>
            <h1>验证注册码</h1>
            <div className="form-item">
                <div className="form-label">注册码：</div>
                <textarea
                    placeholder="注册码"
                    value={license}
                    onChange={(e) => setLicense(e.target.value)}
                />
            </div>
            <div className="validatebody form-item">
                <div className="form-label"></div>
                <button onClick={handleValidate}>验证注册码</button>
            </div>
            {isValid !== null && (
                <p className="validateResult">{isValid ? <label className="codeYes">注册码有效</label> :
                    <label className="codeNo">注册码无效</label>}</p>
            )}
            {isValid}
        </div>
    );
}

export default App;

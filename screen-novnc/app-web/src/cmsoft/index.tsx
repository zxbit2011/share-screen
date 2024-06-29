import {useEffect, useState} from "react"
import io from 'socket.io-client';


function CMSoft() {

    const [serverConfig, setServerConfig] = useState({
        ip: '192.168.0.7',
        port: 2111
    })
    const [msg, setMsg] = useState(0)
    /*const [socket, setSocket] = useState(io('ws://192.168.2.35:8080/ws'))

    socket.on("connect", (conn) => {
        console.log(conn)
        console.log(socket.id); // x8WIv7-mJelg7on_ALbx
        console.log('connect status：', socket.connected); // true
    });

    socket.on("connect_error", (e) => {
        console.log(e)
    });

    socket.on('message', function (message) {
        //processing incoming message here
        console.log(message);
    });


    function sendMsg() {
        socket.emit("message", msg);
    }*/

    const wsuri = "ws://192.168.0.7:2111";
    const [websock, setWebsock] = useState(new WebSocket(wsuri))

    websock.onmessage  = (e) => {
        console.log('onmessage：',e)
    }
    websock.onopen = (e) => {
        console.log('onopen：',e)
    }
    websock.onerror = (e) => {
        console.log('onerror：',e)
    }
    websock.onclose = (e) => {
        console.log('onclose：',e)
    }

    function sendMsg() {
        websock.send('123456')
    }
    useEffect(() => {

    }, [])


    return (
        <div className="com-toolbar">
            <div id="top_bar">
                <div id="com-setting">
                    <input value={serverConfig.ip}/>
                    <input value={serverConfig.port}/>
                    <button type='button' onClick={() => {

                    }}>连接
                    </button>
                </div>

                <div id="com-send">
                    <input value={msg} onChange={(event) => {
                        setMsg(event.target.value)
                    }}/>
                    <button type='button' onClick={() => {
                        sendMsg()
                    }}>连接
                    </button>
                </div>
            </div>

        </div>
    )
}

export default CMSoft

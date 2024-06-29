import React, {useEffect, useRef, useState} from 'react';
import RFB from '@novnc/novnc';

interface Props {
    url: string;
    style?: object;
    className?: string;
    viewOnly?: boolean;
    focusOnClick?: boolean;
    clipViewport?: boolean;
    dragViewport?: boolean;
    scaleViewport?: boolean;
    resizeSession?: boolean;
    showDotCursor?: boolean;
    background?: string;
    qualityLevel?: number;
    compressionLevel?: number;
    retryDuration?: number;
    debug?: boolean;
}

export default function VncScreen(props: Props) {
    const [rfb, setRfb] = useState<RFB | null>(null);
    const screen = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const {
        url,
        style,
        className,
        viewOnly,
        focusOnClick,
        clipViewport,
        dragViewport,
        scaleViewport,
        resizeSession,
        showDotCursor,
        background,
        qualityLevel,
        compressionLevel,
        retryDuration = 3000,
        password,
        debug = false,
    } = props;

    const logger = {
        log: (...args: any[]) => {
            if (debug) console.log(...args);
        },
        info: (...args: any[]) => {
            if (debug) console.info(...args);
        },
        error: (...args: any[]) => {
            if (debug) console.error(...args);
        },
    };

    const disconnect = () => {
        if (!rfb) {
            return;
        }

        rfb.disconnect();
        setRfb(null);
    };

    const connect = () => {
        try {
            disconnect();

            if (!screen.current) {
                return;
            }

            screen.current.innerHTML = '';

            const _rfb = new RFB(screen.current, url, {credentials: {password: password}});

            _rfb.viewOnly = viewOnly || true;
            _rfb.focusOnClick = focusOnClick || false;
            _rfb.clipViewport = clipViewport || false;
            _rfb.dragViewport = dragViewport || false;
            _rfb.resizeSession = resizeSession || true;
            // 缩放容器
            _rfb.scaleViewport = scaleViewport || true;
            _rfb.showDotCursor = showDotCursor || false;
            _rfb.background = background || '';
            _rfb.qualityLevel = qualityLevel || 6;
            _rfb.compressionLevel = compressionLevel || 2;
            setRfb(_rfb);

            _rfb.addEventListener('connect', () => {
                logger.info('Connected to remote VNC.');
                setLoading(false);
            });

            _rfb.addEventListener('disconnect', () => {
                logger.info(`Disconnected from remote VNC, retrying in ${retryDuration / 1000} seconds.`);
                setTimeout(connect, retryDuration);
                setLoading(true);
            });

            _rfb.addEventListener('credentialsrequired', () => {
                const password = prompt("Password Required:");
                _rfb.sendCredentials({password: password});
            });

            _rfb.addEventListener('desktopname', (e: { detail: { name: string } }) => {
                logger.info(`Desktop name is ${e.detail.name}`);
            });
        } catch (err) {
            logger.error(err);
        }
    };

    useEffect(() => {
        connect();

        return disconnect;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleClick = () => {
        if (!rfb) return;

        rfb.focus();
    }

    const handleMouseEnter = () => {
        if (document.activeElement && document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }

        handleClick();
    };

    const handleMouseLeave = () => {
        if (!rfb) {
            return;
        }

        rfb.blur();
    };

    return (
        <>
            <div
                style={style}
                className={className}
                ref={screen}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            />
            {loading &&
            <div className="text-white loading">
                <div className="noVNC_spinner"></div>
                <div className="noVNC_tip">XW-WICX共享屏幕连接中...</div>
            </div>}
        </>
    );
}

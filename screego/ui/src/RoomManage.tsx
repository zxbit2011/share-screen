import React from 'react';
import {
    Alert,
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    Grid,
    Paper,
    TextField,
    Typography
} from '@mui/material';
import {FCreateRoom, UseRoom} from './useRoom';
import {UIConfig} from './message';
import {getFromURL, getRoomFromURL} from './useRoomID';
import {authModeToRoomMode, UseConfig} from './useConfig';
import {LoginForm} from './LoginForm';

const CreateRoom = ({room, config}: Pick<UseRoom, 'room'> & { config: UIConfig }) => {
    const [id, setId] = React.useState(() => getRoomFromURL() ?? config.roomName);
    const mode = authModeToRoomMode(config.authMode, config.loggedIn);
    const [ownerLeave, setOwnerLeave] = React.useState(config.closeRoomWhenOwnerLeaves);
    const submit = () =>
        room({
            type: 'create',
            payload: {
                mode,
                closeOnOwnerLeave: ownerLeave,
                joinIfExist: true,
                id: id || undefined,
            },
        });
    return (
        <div>
            <FormControl fullWidth>
                <TextField
                    fullWidth
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    label="房间号"
                    margin="dense"
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={ownerLeave}
                            onChange={(_, checked) => setOwnerLeave(checked)}
                        />
                    }
                    label="离开后关闭房间"
                />
                {/*<Box paddingBottom={0.5}>
                    <Typography>
                        Nat Traversal via:{' '}
                        <Link
                            href="https://screego.net/#/nat-traversal"
                            target="_blank"
                            rel="noreferrer"
                        >
                            {mode.toUpperCase()}
                        </Link>
                    </Typography>
                </Box>*/}
                <Button onClick={submit} fullWidth variant="contained">
                    创建或加入房间
                </Button>
            </FormControl>
        </div>
    );
};

export const RoomManage = ({room, config}: { room: FCreateRoom; config: UseConfig }) => {
    const [showLogin, setShowLogin] = React.useState(false);
    const [isManage, setIsManage] = React.useState(false);

    const canCreateRoom = config.authMode !== 'all';
    const loginVisible = !config.loggedIn && (showLogin || !canCreateRoom);


    React.useEffect(() => {
        const manage = getFromURL('t') === 'manage';
        setIsManage(manage)
    }, []);
    return (
        <Grid
            container={true}
            justifyContent="center"
            style={{paddingTop: 50, maxWidth: 400, width: '100%', margin: '0 auto'}}
            spacing={4}
        >
            <Grid item xs={12}>
                <Typography align="center" gutterBottom>
                    <div><img src="./logo.svg" style={{width: 80}} alt="logo"/></div>
                    <h4>XW-WICX</h4>
                </Typography>

                {isManage ?
                    <Paper elevation={3} style={{padding: 20}}>
                        {loginVisible ? (
                            <LoginForm
                                config={config}
                                hide={canCreateRoom ? () => setShowLogin(false) : undefined}
                            />
                        ) : (
                            <>
                                <Typography style={{display: 'flex', alignItems: 'center'}}>
                                    <span style={{flex: 1}}>你好 {config.user}!</span>{' '}
                                    {config.loggedIn ? (
                                        <Button variant="outlined" size="small" onClick={config.logout}>
                                            退出
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => setShowLogin(true)}
                                        >
                                            登录
                                        </Button>
                                    )}
                                </Typography>

                                <CreateRoom room={room} config={config}/>
                            </>
                        )}
                    </Paper> :
                    <Alert variant="filled" severity="warning">
                        等待共享屏幕..
                    </Alert>
                }
            </Grid>
        </Grid>
    );
};

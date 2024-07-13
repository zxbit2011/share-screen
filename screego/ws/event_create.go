package ws

import (
	"errors"
	"fmt"

	"github.com/rs/xid"
	"github.com/screego/server/config"
)

func init() {
	register("create", func() Event {
		return &Create{}
	})
}

type Create struct {
	ID                string         `json:"id"`
	Mode              ConnectionMode `json:"mode"`
	CloseOnOwnerLeave bool           `json:"closeOnOwnerLeave"`
	UserName          string         `json:"username"`
	JoinIfExist       bool           `json:"joinIfExist,omitempty"`
}

func (e *Create) Execute(rooms *Rooms, current ClientInfo) error {
	if current.RoomID != "" {
		return fmt.Errorf("无法加入房间，您已在其中")
	}

	if _, ok := rooms.Rooms[e.ID]; ok {
		if e.JoinIfExist {
			join := &Join{UserName: e.UserName, ID: e.ID}
			return join.Execute(rooms, current)
		}

		return fmt.Errorf("【%s】房间已存在", e.ID)
	}

	name := e.UserName
	if current.Authenticated {
		name = current.AuthenticatedUser
	}
	if name == "" {
		name = rooms.RandUserName()
	}

	switch rooms.config.AuthMode {
	case config.AuthModeNone:
	case config.AuthModeAll:
		if !current.Authenticated {
			return errors.New("you need to login")
		}
	case config.AuthModeTurn:
		if e.Mode != ConnectionSTUN && e.Mode != ConnectionLocal && !current.Authenticated {
			return errors.New("you need to login")
		}
	default:
		return errors.New("invalid authmode:" + rooms.config.AuthMode)
	}

	room := &Room{
		ID:                e.ID,
		CloseOnOwnerLeave: e.CloseOnOwnerLeave,
		Mode:              e.Mode,
		Sessions:          map[xid.ID]*RoomSession{},
		Users: map[xid.ID]*User{
			current.ID: {
				ID:        current.ID,
				Name:      name,
				Streaming: false,
				Owner:     true,
				Addr:      current.Addr,
				Write:     current.Write,
				Close:     current.Close,
			},
		},
	}
	rooms.Rooms[e.ID] = room
	room.notifyInfoChanged()
	usersJoinedTotal.Inc()
	roomsCreatedTotal.Inc()
	return nil
}

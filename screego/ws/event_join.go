package ws

import (
	"fmt"
	"github.com/screego/server/status"
)

func init() {
	register("join", func() Event {
		return &Join{}
	})
}

type Join struct {
	ID       string `json:"id"`
	UserName string `json:"username,omitempty"`
}

func (e *Join) Execute(rooms *Rooms, current ClientInfo) error {
	if current.RoomID != "" {
		return fmt.Errorf("cannot join room, you are already in one")
	}

	room, ok := rooms.Rooms[e.ID]
	if !ok {
		return fmt.Errorf("【%s】未共享投屏", e.ID)
	}
	name := e.UserName
	if current.Authenticated {
		name = current.AuthenticatedUser
	}
	if name == "" {
		name = rooms.RandUserName()
	}

	room.Users[current.ID] = &User{
		ID:        current.ID,
		Name:      name,
		Streaming: false,
		Owner:     false,
		Addr:      current.Addr,
		Write:     current.Write,
		Close:     current.Close,
	}
	status.OnlineCount[e.ID] = len(room.Users)

	room.notifyInfoChanged()
	usersJoinedTotal.Inc()

	v4, v6, err := rooms.config.TurnIPProvider.Get()
	if err != nil {
		return err
	}

	for _, user := range room.Users {
		if current.ID == user.ID || !user.Streaming {
			continue
		}
		room.newSession(user.ID, current.ID, rooms, v4, v6)
	}

	return nil
}

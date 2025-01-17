package ws

import (
	"fmt"
)

func init() {
	register("share", func() Event {
		return &StartShare{}
	})
}

type StartShare struct{}

func (e *StartShare) Execute(rooms *Rooms, current ClientInfo) error {
	if current.RoomID == "" {
		return fmt.Errorf("not in a room")
	}

	room, ok := rooms.Rooms[current.RoomID]
	if !ok {
		return fmt.Errorf("【%s】未共享投屏", current.RoomID)
	}

	room.Users[current.ID].Streaming = true

	v4, v6, err := rooms.config.TurnIPProvider.Get()
	if err != nil {
		return err
	}

	for _, user := range room.Users {
		if current.ID == user.ID {
			continue
		}
		room.newSession(current.ID, user.ID, rooms, v4, v6)
	}

	room.notifyInfoChanged()
	return nil
}

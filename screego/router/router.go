package router

import (
	"encoding/base64"
	"encoding/json"
	"github.com/screego/server/status"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/rs/zerolog/hlog"
	"github.com/rs/zerolog/log"
	"github.com/screego/server/auth"
	"github.com/screego/server/config"
	"github.com/screego/server/ui"
	"github.com/screego/server/ws"
)

type UIConfig struct {
	AuthMode                 string `json:"authMode"`
	User                     string `json:"user"`
	LoggedIn                 bool   `json:"loggedIn"`
	Version                  string `json:"version"`
	RoomName                 string `json:"roomName"`
	CloseRoomWhenOwnerLeaves bool   `json:"closeRoomWhenOwnerLeaves"`
}

// JSONResponse 发送 JSON 响应
func JSONResponse(w http.ResponseWriter, statusCode int, data interface{}) {
	// 设置响应头
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	// 将响应内容编码为 JSON 并写入响应
	if err := json.NewEncoder(w).Encode(data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func Router(conf config.Config, rooms *ws.Rooms, users *auth.Users, version string) *mux.Router {
	router := mux.NewRouter()
	router.NotFoundHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// https://github.com/gorilla/mux/issues/416
		accessLogger(r, 404, 0, 0)
	})
	router.Use(hlog.AccessHandler(accessLogger))
	router.Use(handlers.CORS(handlers.AllowedMethods([]string{"GET", "POST"}), handlers.AllowedOriginValidator(conf.CheckOrigin)))
	router.HandleFunc("/stream", rooms.Upgrade)
	router.Methods("POST").Path("/login").HandlerFunc(users.Authenticate)
	router.Methods("POST").Path("/logout").HandlerFunc(users.Logout)
	router.Methods("GET").Path("/config").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, loggedIn := users.CurrentUser(r)
		_ = json.NewEncoder(w).Encode(&UIConfig{
			AuthMode:                 conf.AuthMode,
			LoggedIn:                 loggedIn,
			User:                     user,
			Version:                  version,
			RoomName:                 rooms.RandRoomName(),
			CloseRoomWhenOwnerLeaves: conf.CloseRoomWhenOwnerLeaves,
		})
	})

	router.Methods("POST").Path("/api/saveRegCode").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		key := r.URL.Query().Get("key")
		if key == "" {
			JSONResponse(w, http.StatusOK, map[string]interface{}{
				"code":    400,
				"message": "授权码不能为空",
			})
			return
		} else {
			// 验证key
			println(key) // 获取存储用户数据的路径
			keyPath := getFileKeyPath()
			println(keyPath)

			key = base64.StdEncoding.EncodeToString([]byte(key))
			if err := saveFileKey(keyPath, key); err != nil {
				JSONResponse(w, http.StatusOK, map[string]interface{}{
					"code":    400,
					"message": "授权码校验失败",
				})
				return
			}
			JSONResponse(w, http.StatusOK, map[string]interface{}{
				"code":    200,
				"message": "授权成功",
			})
			return
		}
	})
	router.Methods("POST").Path("/api/getRegCode").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		keyPath := getFileKeyPath()
		key, err := os.ReadFile(keyPath)
		if err != nil {
			JSONResponse(w, http.StatusOK, map[string]interface{}{
				"code":    400,
				"message": "未授权",
			})
			return
		}
		key, err = base64.StdEncoding.DecodeString(string(key))
		JSONResponse(w, http.StatusOK, map[string]interface{}{
			"code":        200,
			"message":     "授权成功",
			"data":        string(key),
			"onlineCount": status.OnlineCount["XW-WICX"],
		})
		return
	})
	if conf.Prometheus {
		log.Info().Msg("Prometheus enabled")
		router.Methods("GET").Path("/metrics").Handler(basicAuth(promhttp.Handler(), users))
	}

	ui.Register(router)

	return router
}

func accessLogger(r *http.Request, status, size int, dur time.Duration) {
	log.Debug().
		Str("host", r.Host).
		Int("status", status).
		Int("size", size).
		Str("ip", r.RemoteAddr).
		Str("path", r.URL.Path).
		Str("duration", dur.String()).
		Msg("HTTP")
}

func basicAuth(handler http.Handler, users *auth.Users) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user, pass, ok := r.BasicAuth()

		if !ok || !users.Validate(user, pass) {
			w.Header().Set("WWW-Authenticate", `Basic realm="screego"`)
			w.WriteHeader(401)
			_, _ = w.Write([]byte("Unauthorized.\n"))
			return
		}

		handler.ServeHTTP(w, r)
	}
}

// 获取存储用户数据的路径
func getFileKeyPath() string {
	// 使用用户的 home 目录作为基础路径
	homeDir, err := os.UserHomeDir()
	if err != nil {
		panic(err)
	}

	// 在用户的 home 目录下创建一个名为 ".myapp" 的子目录
	//appDir := filepath.Join(homeDir, ".xwwicx")
	//if err := os.MkdirAll(appDir, 0755); err != nil {
	//	panic(err)
	//}

	// 返回存储用户数据的文件路径
	return filepath.Join(homeDir, "xw-wicx2.pk")
}

// 保存用户数据到文件
func saveFileKey(filePath string, key string) error {
	// 将 JSON 数据写入文件
	if err := ioutil.WriteFile(filePath, []byte(key), 0644); err != nil {
		return err
	}
	return nil
}

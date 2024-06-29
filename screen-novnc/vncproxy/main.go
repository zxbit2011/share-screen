//go:generate goversioninfo
package main

import (
	"embed"
	"encoding/base64"
	"io/fs"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"golang.org/x/net/websocket"
)

//go:embed dist
var f embed.FS

func main() {
	r := gin.Default()

	st, _ := fs.Sub(f, "dist")
	r.StaticFS("/web", http.FS(st))

	//r.Static("/web", "./dist")

	vncProxy := NewVNCProxy()
	r.GET("/ws", func(ctx *gin.Context) {
		h := websocket.Handler(vncProxy.ServeWS)
		h.ServeHTTP(ctx.Writer, ctx.Request)
	})
	r.POST("/api/saveRegCode", func(ctx *gin.Context) {
		if key, flag := ctx.GetQuery("key"); !flag || key == "" {
			ctx.JSON(http.StatusOK, gin.H{
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
				ctx.JSON(http.StatusOK, gin.H{
					"code":    400,
					"message": "授权码校验失败",
				})
				return
			}

			ctx.JSON(http.StatusOK, gin.H{
				"code":    200,
				"message": "授权成功",
			})
			return
		}
	})
	r.POST("/api/getRegCode", func(ctx *gin.Context) {
		keyPath := getFileKeyPath()
		println(keyPath)
		key, err := os.ReadFile(keyPath)
		if err != nil {
			ctx.JSON(http.StatusOK, gin.H{
				"code":    400,
				"message": "未授权",
			})
			return
		}
		key, err = base64.StdEncoding.DecodeString(string(key))
		ctx.JSON(http.StatusOK, gin.H{
			"code":        200,
			"message":     "授权成功",
			"data":        string(key),
			"onlineCount": onlineCount,
		})
		return
	})
	if err := r.Run(":3003"); err != nil {
		panic(err)
	}
}

func NewVNCProxy() *Proxy {
	return New(&Config{
		LogLevel: DebugLevel,
		// Logger: customerLogger,	// inject a custom logger
		// DialTimeout: 10 * time.Second, // customer DialTimeout
		TokenHandler: func(r *http.Request) (addr string, err error) {
			return ":5900", nil
		},
	})
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

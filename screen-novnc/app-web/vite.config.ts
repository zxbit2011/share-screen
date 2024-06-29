import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        outDir: '../vncproxy/dist', // 指定构建输出目录
    },
    base: '/web/',
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        port: 3002,
        // 反向代理
        proxy: {
            '/socket': {
                target: 'ws://192.168.0.117:3003/',
                changeOrigin: true,
                ws: true,
                rewrite: (path) => path.replace(/^\/socket/, ''),
            },
            '/api': {
                target: 'http://192.168.0.117:3003/',
                changeOrigin: true,
            }
        }


    }
})

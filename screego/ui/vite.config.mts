import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
    base: './',
    server: {
        host: '127.0.0.1',
        port: 3008,
        open: false,
        proxy: {
            '^/(config|logout|login|stream)$': {
                target: 'https://127.0.0.1:3000',
                ws: true,
                changeOrigin: true,
                secure: false,
                headers: {
                    Referer: 'https://127.0.0.1:3000'
                }
            },
        },
    },
    build: {outDir: 'build/'},
    plugins: [react()],
});

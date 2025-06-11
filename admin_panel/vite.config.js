import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 新增：将 /api/orders/all 直接代理到用户端服务器
      '/api/orders/all': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      // 将所有以 /api 开头的请求代理到后端服务
      // 后端运行在 http://localhost:5002
      '/api': {
        target: 'http://localhost:5002', // 再次修改端口为 5002
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // 添加 /admin 路径的代理
      '/admin': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/admin/, '/'),
      },
    },
  },
})
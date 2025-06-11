import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app.jsx'; // 导入 App 组件
import './index.css';
import { BrowserRouter } from 'react-router-dom'; // 导入 BrowserRouter
import axios from 'axios';

// 配置 Axios 拦截器，自动携带 token
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {js
    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <BrowserRouter> {/* 使用 BrowserRouter 包裹 App 组件 */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom'; // 导入路由组件和 Navigate
// 导入页面组件
import Dashboard from './pages/dashboard'; // 导入 Dashboard 组件
import ProductManagementPage from './pages/ProductManagementPage';
import AddProductPage from './pages/AddProductPage'; // 导入 AddProductPage 组件
import LoginPage from './pages/LoginPage'; // 导入登录页面

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true); // 新增 loading 状态

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const storedUserInfo = localStorage.getItem('userInfo');
    if (token && storedUserInfo) {
      try {
        setIsLoggedIn(true);
        setUserInfo(JSON.parse(storedUserInfo));
      } catch (e) {
        console.error('解析用户信息失败:', e);
        setIsLoggedIn(false);
        setUserInfo(null);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('userInfo');
      }
    } else {
      setIsLoggedIn(false);
      setUserInfo(null);
    }
    setLoading(false); // 数据加载完成后设置 loading 为 false
  }, []); // 空依赖数组表示只在组件挂载时运行一次

  if (loading) {
    return <div>加载中...</div>; // 在加载时显示加载提示
  }

  return (
      <Routes>
        {/* 登录页路由，始终可访问 */}
        <Route path="/login" element={<LoginPage />} />
        {/* 其余路由需要登录后才能访问，使用 ProtectedRoute 包裹 */}
        <Route path="/" element={
          <ProtectedRoute isLoggedIn={isLoggedIn} userInfo={userInfo} allowedRoles={['merchant', 'admin']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/products" element={
          <ProtectedRoute isLoggedIn={isLoggedIn} userInfo={userInfo} allowedRoles={['merchant', 'admin']}>
            <ProductManagementPage />
          </ProtectedRoute>
        } />
        <Route path="/products/add" element={
          <ProtectedRoute isLoggedIn={isLoggedIn} userInfo={userInfo} allowedRoles={['merchant', 'admin']}>
            <AddProductPage />
          </ProtectedRoute>
        } />
        {/* TODO: 可以根据需要添加更多路由 */}
      </Routes>
  );
}

function ProtectedRoute({ children, isLoggedIn, userInfo, allowedRoles }) {
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const userRole = userInfo?.role;

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // 如果用户角色不在允许的角色列表中，重定向到登录页或显示无权限页面
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default App;
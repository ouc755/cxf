import React, { useState, useEffect } from 'react';
import './dashboard.css'; // 导入样式文件
import { useNavigate } from 'react-router-dom'; // 导入 useNavigate 钩子
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]); // 新增：订单数据状态

  useEffect(() => {
    // 获取最近订单数据
    axios.get('/api/orders/all').then(res => {
      setOrders(res.data);
    }).catch(() => {
      setOrders([]);
    });
  }, []);
  return (
    <div className="dashboard-container">
      {/* 侧边栏快捷导航 */}
      <aside className="dashboard-sidebar">
        <h2>快捷导航</h2>
        <ul>
          <li><a href="/productmanagement">商品管理</a></li>
          <li><a href="/ordermanagement">订单管理</a></li>
          {/* TODO: 添加更多导航链接 */}
        </ul>
      </aside>

      {/* 主内容区域 */}
      <main className="dashboard-main-content">
        <h1>商家管理后台仪表盘</h1>

        {/* 概览数据模块 */}
        <section className="dashboard-module overview-data">
          <h2>概览数据</h2>
          <div className="overview-cards">
            <div className="card">
              <h3>日营业额</h3>
              <p>¥ XXXX</p>
            </div>
            <div className="card">
              <h3>月营业额</h3>
              <p>¥ XXXXX</p>
            </div>
            <div className="card">
              <h3>待发货订单</h3>
              <p>XX 单</p>
            </div>
            <div className="card">
              <h3>库存预警商品</h3>
              <p>XX 件</p>
            </div>
          </div>
        </section>

        {/* 快捷操作模块 */}
        <section className="dashboard-module quick-actions">
          <h2>商品管理</h2>
          <button onClick={() => navigate('/products/add')}>新增商品</button>
          <button onClick={() => navigate('/products')}>修改商品</button>
          <button onClick={() => navigate('/products')}>删除商品</button>
          <button onClick={() => navigate('/products')}>查看商品</button>

          {/* TODO: 添加更多快捷操作按钮 */}
        </section>

        {/* 最近订单模块 */}
        <section className="dashboard-module recent-orders">
          <h2>最近订单</h2>
          {/* TODO: 添加最近订单列表 */}
          <table>
            <thead>
              <tr>
                <th>订单号</th>
                <th>客户</th>
                <th>金额</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan="4">暂无订单数据</td></tr>
              ) : (
                orders.map(order => (
                  <tr key={order._id}>
                    <td>{order._id}</td>
                    <td>{order.userId}</td>
                    <td>¥{order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}</td>
                    <td>{order.status === 0 ? '待付款' : order.status === 1 ? '待发货' : order.status === 2 ? '已完成' : order.status === 3 ? '已关闭' : order.status === 4 ? '已取消/售后' : '未知'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {/* TODO: 添加其他模块，如销售趋势、用户统计等 */}

      </main>
    </div>
  );
};

export default Dashboard;
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // 假设后端登录API为 /admin/login，返回 { token, userInfo }
      const response = await axios.post('/admin/login', { username, password });
      console.log('【登录页调试】后端响应:', response); // 添加日志，打印完整响应
      if (response.data && response.data.token) {
        localStorage.setItem('adminToken', response.data.token); // 登录成功后写入 token
        localStorage.setItem('userInfo', JSON.stringify(response.data.userInfo)); // 存储用户信息
        console.log('【登录页调试】localStorage 写入 adminToken:', localStorage.getItem('adminToken')); // 打印写入的 token
        console.log('【登录页调试】localStorage 写入 userInfo:', localStorage.getItem('userInfo')); // 打印写入的 userInfo
        alert('登录成功！');
        // 添加一个短暂的延迟，确保 localStorage 写入完成
        setTimeout(() => {
          navigate('/'); // 跳转到首页或仪表盘
        }, 100); 
      } else {
        setError('登录失败：未获取到令牌');
      }
    } catch (err) {
      console.error('【登录页错误】:', err.response?.data || err); // 打印完整的错误信息
      setError(err.response?.data?.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
      <h2>管理员登录</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="username">用户名：</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="password">密码：</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10 }}>
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
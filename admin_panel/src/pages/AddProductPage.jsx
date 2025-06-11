import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AddProductPage() {
  // 定义商品数据状态，包含名称、价格、库存和描述
  const [productData, setProductData] = useState({
    name: '',
    price: '',
    stock: '',
    description: '',
    // TODO: 根据后端API需要，可以在这里添加更多字段，如 images, category 等
  });
  // 定义加载状态，用于控制按钮的禁用和显示加载提示
  const [loading, setLoading] = useState(false);
  // 定义错误状态，用于显示错误信息
  const [error, setError] = useState(null);
  // 获取导航函数，用于页面跳转
  const navigate = useNavigate();

  // 处理输入框变化的函数
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // 更新对应的商品数据字段
    setProductData({ ...productData, [name]: value });
  };

  // 处理表单提交的函数
  const handleSubmit = async (e) => {
    e.preventDefault(); // 阻止表单默认提交行为
    setLoading(true); // 设置加载状态为 true
    setError(null); // 清空之前的错误信息

    try {
      // 调用后端API添加商品
      // 假设后端添加商品的API是 /api/admin/products (POST请求)
      const response = await axios.post('/api/admin/products', productData);
      // 检查后端响应，如果成功则提示并跳转
      if (response.status === 200 || response.status === 201) { // 假设成功状态码是200或201
        alert('商品添加成功！');
        navigate('/products'); // 添加成功后跳转回商品管理列表页
      } else {
        // 如果后端返回非成功状态码，设置错误信息
        setError(`添加商品失败: ${response.statusText}`);
        alert(`添加商品失败: ${response.statusText}`);
      }
    } catch (err) {
      // 捕获网络请求中的错误
      console.error('添加商品失败:', err);
      setError('添加商品失败，请检查输入或稍后重试');
      alert('添加商品失败！');
    } finally {
      // 无论成功或失败，都结束加载状态
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>添加新商品</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">商品名称:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={productData.name}
            onChange={handleInputChange}
            required // 设置为必填项
          />
        </div>
        <div>
          <label htmlFor="price">价格:</label>
          <input
            type="number"
            id="price"
            name="price"
            value={productData.price}
            onChange={handleInputChange}
            required // 设置为必填项
            step="0.01" // 允许输入小数
          />
        </div>
        <div>
          <label htmlFor="stock">库存:</label>
          <input
            type="number"
            id="stock"
            name="stock"
            value={productData.stock}
            onChange={handleInputChange}
            required // 设置为必填项
            min="0" // 库存不能小于0
          />
        </div>
        <div>
          <label htmlFor="description">商品描述:</label>
          <textarea
            id="description"
            name="description"
            value={productData.description}
            onChange={handleInputChange}
          />
        </div>
        {/* TODO: 根据需要添加文件上传（图片）等输入框 */}

        {/* 显示错误信息 */}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {/* 提交按钮，加载时禁用 */}
        <button type="submit" disabled={loading}>
          {loading ? '提交中...' : '添加商品'}
        </button>
      </form>
    </div>
  );
}

export default AddProductPage;
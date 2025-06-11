import React, { useState, useEffect } from 'react';
import axios from 'axios'; // 假设使用 axios 进行网络请求
import { useNavigate } from 'react-router-dom'; // 导入 useNavigate 钩子

function ProductManagementPage() {
  const navigate = useNavigate(); // 获取导航函数
  const [products, setProducts] = useState([]); // 商品列表状态
  const [loading, setLoading] = useState(true); // 加载状态，用于控制商品列表的显示
  const [error, setError] = useState(null); // 错误状态，用于显示加载商品列表时的错误信息
  const [showEditModal, setShowEditModal] = useState(false); // 控制编辑模态框显示状态
  const [editingProduct, setEditingProduct] = useState(null); // 当前正在编辑的商品数据
  const [editFormData, setEditFormData] = useState({ // 编辑表单数据状态
    name: '',
    price: '',
    stock: '',
    description: '',
    // TODO: 根据后端API需要，可以在这里添加更多编辑字段，如 images, category 等
  });
  const [savingEdit, setSavingEdit] = useState(false); // 保存编辑时的加载状态
  const [editError, setEditError] = useState(null); // 保存编辑时的错误状态

  // 获取商品列表的函数
  const fetchProducts = async () => {
    try {
      setLoading(true); // 开始加载商品列表
      setError(null); // 清空之前的错误信息
      console.log('正在尝试获取商品列表...'); // 添加日志
      const token = localStorage.getItem('adminToken'); // 获取认证令牌
      console.log('从 localStorage 获取的 adminToken:', token); // 打印获取到的 token
      // 假设后端商品列表API是 /api/admin/products (GET请求)
      const authHeaderValue = `Bearer ${token}`;
      console.log('将要发送的 Authorization 头部 (fetchProducts):', authHeaderValue); // 打印将要发送的头部
      const response = await axios.get('/api/products', {
        headers: {
          Authorization: authHeaderValue // 添加认证头部
        }
      });
      console.log('获取商品列表响应:', response); // 添加日志
      // 检查返回的数据是否为数组，后端返回的数据结构可能是 { products: [...] } 或者直接是 [...]，这里假设直接返回数组
      if (Array.isArray(response.data)) {
        console.log('商品数据是数组，正在更新状态:', response.data); // 添加日志
        setProducts(response.data); // 更新商品列表状态
      } else if (response.data && Array.isArray(response.data.products)) {
        console.log('商品数据在 response.data.products 中，正在更新状态:', response.data.products); // 添加日志
        setProducts(response.data.products); // 更新商品列表状态
      } else {
        console.log('后端返回的商品数据格式不正确:', response.data); // 添加日志
        // 如果不是数组，设置错误信息
        console.error('后端返回的商品数据不是数组或products数组:', response.data);
        setError('获取商品列表失败：后端数据格式不正确');
      }
    } catch (err) {
      console.error('获取商品列表失败:', err); // 打印错误到控制台
      console.log('获取商品列表错误对象:', err); // 添加日志
      console.error('获取商品列表失败详情:', err.response?.data || err.message); // 添加更详细的错误日志
      // 检查 err.response 是否存在，以及 err.response.status
      if (err.response) {
        console.error('后端响应状态码:', err.response.status);
        console.error('后端响应数据:', err.response.data);
      }
      setError('获取商品列表失败，请稍后重试'); // 设置用户友好的错误信息
    } finally {
      setLoading(false); // 无论成功或失败，都结束加载状态
    }
  };

  // 在渲染前添加日志，检查 products 状态
  console.log('当前商品列表状态 (products):', products);

  // 处理编辑按钮点击
  const handleEditClick = (product) => {
    setEditingProduct(product); // 设置当前正在编辑的商品
    setEditFormData({ // 填充编辑表单数据
      name: product.name || '',
      price: product.price || '',
      stock: product.stock || '',
      description: product.description || '', // 确保有默认值
      // TODO: 填充更多编辑字段
    });
    setEditError(null); // 清空编辑模态框的错误信息
    setShowEditModal(true); // 显示编辑模态框
  };

  // 处理删除按钮点击
  const handleDeleteClick = async (productId) => {
    if (window.confirm('确定要删除此商品吗？')) { // 弹出确认框
      try {
        const token = localStorage.getItem('adminToken'); // 获取认证令牌
        console.log('从 localStorage 获取的 adminToken (handleDeleteClick):', token); // 打印获取到的 token
        // 假设后端删除商品API是 /api/admin/products/:id (DELETE请求)
        const authHeaderValue = `Bearer ${token}`;
        console.log('将要发送的 Authorization 头部 (handleDeleteClick):', authHeaderValue); // 打印将要发送的头部
        await axios.delete(`/api/products/${productId}`, {
          headers: {
            Authorization: authHeaderValue // 添加认证头部
          }
        });
        alert('商品删除成功！'); // 删除成功提示
        fetchProducts(); // 删除成功后刷新商品列表
      } catch (err) {
        console.error('删除商品失败:', err); // 打印错误到控制台
        console.error('删除商品失败详情:', err.response?.data || err.message); // 添加更详细的错误日志
        alert('删除商品失败，请稍后重试'); // 删除失败提示
      }
    }
  };

  // 处理模态框输入变化
  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value }); // 更新编辑表单数据
  };

  // 处理保存编辑商品
  const handleSaveEdit = async () => {
    if (!editingProduct) return; // 如果没有正在编辑的商品，则不执行保存操作

    setSavingEdit(true); // 设置保存加载状态为 true
    setEditError(null); // 清空之前的编辑错误信息

    try {
      const token = localStorage.getItem('adminToken'); // 获取认证令牌
      console.log('从 localStorage 获取的 adminToken (handleSaveEdit):', token); // 打印获取到的 token
      // 假设后端更新商品API是 /api/admin/products/:id (PUT请求)
      const authHeaderValue = `Bearer ${token}`;
      console.log('将要发送的 Authorization 头部 (handleSaveEdit):', authHeaderValue); // 打印将要发送的头部
      const response = await axios.put(`/api/admin/products/${editingProduct._id}`, editFormData, {
        headers: {
          Authorization: authHeaderValue // 添加认证头部
        }
      });
      // 检查后端响应，如果成功则提示并刷新列表
      if (response.status === 200) { // 假设成功状态码是200
        alert('商品更新成功！');
        setShowEditModal(false); // 关闭模态框
        setEditingProduct(null); // 清空编辑中的商品
        fetchProducts(); // 更新成功后刷新列表
      } else {
        // 如果后端返回非成功状态码，设置错误信息
        setEditError(`更新商品失败: ${response.statusText}`);
        alert(`更新商品失败: ${response.statusText}`);
        console.error('更新商品失败详情:', response.data); // 添加更详细的错误日志
      }
    } catch (err) {
      console.error('更新商品失败:', err); // 打印错误到控制台
      console.error('更新商品失败详情:', err.response?.data || err.message); // 添加更详细的错误日志
      setEditError('更新商品失败，请检查输入或稍后重试'); // 设置用户友好的错误信息
      alert('更新商品失败！');
    } finally {
      setSavingEdit(false); // 无论成功或失败，都结束保存加载状态
    }
  };

  // 处理关闭模态框
  const handleCloseModal = () => {
    setShowEditModal(false); // 关闭模态框
    setEditingProduct(null); // 清空编辑中的商品
    setEditFormData({ // 清空表单数据
      name: '',
      price: '',
      stock: '',
      description: '',
      // TODO: 清空更多编辑字段
    });
    setEditError(null); // 清空编辑错误信息
  };

  // 组件加载时获取商品列表
  useEffect(() => {
    fetchProducts();
  }, []); // 空数组表示只在组件挂载时运行一次

  // 退出登录函数
  const handleLogout = () => {
    localStorage.removeItem('adminToken'); // 清除本地token
    navigate('/login'); // 跳转到登录页
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>商品管理</h1>
        <button onClick={handleLogout} style={{ background: '#f44336', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>退出登录</button>
      </div>
      <button onClick={() => setShowEditModal(true)}>添加新商品</button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {/* 其余页面内容保持不变 */}
      {loading && <p>加载中...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && ( // 当不在加载中且没有错误时显示商品列表
        <table>
          <thead>
            <tr>
              <th>商品名称</th>
              <th>价格</th>
              <th>库存</th>
              <th>描述</th> {/* 添加描述列 */}
              <th>分类</th> {/* 添加分类列 */}
              {/* TODO: 添加更多表头 */}
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {/* 遍历商品列表显示每一行 */}
            {products.map(product => (
              <tr key={product._id}> {/* 假设每个商品有唯一的 _id 作为 key */}
                <td>{product.name}</td>
                <td>{product.price}</td>
                <td>{product.stock}</td>
                <td>{product.description}</td> {/* 显示商品描述 */}
                <td>{product.category}</td> {/* 显示商品分类 */}
                {/* TODO: 添加更多商品数据单元格 */}
                <td>
                  {/* 编辑和删除按钮 */}
                  <button onClick={() => handleEditClick(product)}>编辑</button>
                  <button onClick={() => handleDeleteClick(product._id)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 编辑商品模态框 */}
      {showEditModal && editingProduct && ( // 当 showEditModal 为 true 且有 editingProduct 时显示模态框
        <div className="modal"> {/* 简单的模态框样式，实际应用中可能需要更复杂的CSS或组件库 */}
          <div className="modal-content">
            <h2>编辑商品</h2>
            <form>
              <div>
                <label htmlFor="edit-name">商品名称:</label>
                <input type="text" id="edit-name" name="name" value={editFormData.name} onChange={handleModalInputChange} />
              </div>
              <div>
                <label htmlFor="edit-price">价格:</label>
                <input type="number" id="edit-price" name="price" value={editFormData.price} onChange={handleModalInputChange} step="0.01" />
              </div>
              <div>
                <label htmlFor="edit-stock">库存:</label>
                <input type="number" id="edit-stock" name="stock" value={editFormData.stock} onChange={handleModalInputChange} min="0" />
              </div>
              <div>
                <label htmlFor="edit-description">描述:</label>
                <textarea id="edit-description" name="description" value={editFormData.description} onChange={handleModalInputChange}></textarea>
              </div>
              <div>
                <label htmlFor="edit-category">分类:</label>
                <input type="text" id="edit-category" name="category" value={editFormData.category} onChange={handleModalInputChange} />
              </div>
              {/* TODO: 添加更多编辑字段 */}
            </form>
            {editError && <p style={{ color: 'red' }}>{editError}</p>}
            <button onClick={handleSaveEdit} disabled={savingEdit}>{savingEdit ? '保存中...' : '保存'}</button>
            <button onClick={handleCloseModal} disabled={savingEdit}>取消</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductManagementPage;
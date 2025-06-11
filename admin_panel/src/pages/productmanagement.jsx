import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './productmanagement.css'; // 导入CSS文件

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false); // 控制模态框显示
  const [currentProduct, setCurrentProduct] = useState(null); // 当前编辑的商品数据
  const [formData, setFormData] = useState({ // 表单数据状态
    name: '',
    price: '',
    description: '',
    imageUrl: '', // 添加图片URL字段 (主图)
    stock: '', // 添加库存字段
    category: '', // 添加分类字段
    images: '', // 将images字段改为字符串，用于输入逗号分隔的URL
    // TODO: Add more fields as needed (e.g., variations)
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  // 当 currentProduct 变化时，更新表单数据
  useEffect(() => {
    if (currentProduct) {
      setFormData({
        name: currentProduct.name || '',
        price: currentProduct.price || '',
        description: currentProduct.description || '',
        imageUrl: currentProduct.imageUrl || '', // 填充主图URL
        stock: currentProduct.stock || '', // 填充库存
        category: currentProduct.category || '', // 填充分类
        images: (currentProduct.images || []).join(', '), // 将图片URL数组转换为逗号分隔的字符串填充
        // TODO: Populate more fields
      });
    } else {
      // 新增时清空表单
      setFormData({
        name: '',
        price: '',
        description: '',
        imageUrl: '', // 清空主图URL
        stock: '', // 清空库存
        category: '', // 清空分类
        images: '', // 清空图片URL字符串
        // TODO: Clear more fields
      });
    }
  }, [currentProduct]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual backend API endpoint for products
      const response = await axios.get('/api/products');
      setProducts(response.data);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };

  // 处理新增商品点击事件
  const handleAddProduct = () => {
    setCurrentProduct(null); // 清空当前商品数据，表示新增
    setShowModal(true); // 显示模态框
  };

  // 处理编辑商品点击事件
  const handleEditProduct = (product) => {
    setCurrentProduct(product); // 设置当前商品数据，表示编辑
    setShowModal(true); // 显示模态框
  };

  // 处理删除商品点击事件
  const handleDeleteProduct = async (productId) => {
    if (window.confirm('确定要删除此商品吗？')) {
      try {
        // TODO: Replace with actual backend API endpoint for deleting product
        await axios.delete(`/api/products/${productId}`);
        // 删除成功后刷新列表
        fetchProducts();
        console.log('商品删除成功:', productId);
      } catch (err) {
        console.error('删除商品失败:', err);
        alert('删除商品失败');
      }
    }
  };

  // 处理模态框关闭事件
  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentProduct(null); // 关闭时清空当前商品数据
  };

  // 处理表单输入变化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // 处理模态框表单提交事件 (新增或编辑)
  const handleSaveProduct = async () => {
    console.log('保存商品数据:', formData);
    // 将逗号分隔的图片URL字符串转换为数组
    const imagesArray = formData.images.split(',').map(url => url.trim()).filter(url => url);
    const dataToSave = { ...formData, images: imagesArray };

    try {
      if (currentProduct) {
        // 编辑商品
        await axios.put(`/api/products/${currentProduct._id}`, dataToSave); // 调用PUT API更新商品
        console.log('商品更新成功:', currentProduct._id);
      } else {
        // 新增商品
        await axios.post('/api/products', dataToSave); // 调用POST API新增商品
        console.log('商品新增成功');
      }
      handleCloseModal(); // 保存后关闭模态框
      fetchProducts(); // 保存后刷新列表
    } catch (err) {
      console.error('保存商品失败:', err);
      alert('保存商品失败');
    }
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  if (error) {
    return <div>加载商品失败: {error.message}</div>;
  }

  return (
    <div>
      <h1>商品管理</h1>
      <button onClick={handleAddProduct}>新增商品</button>
      <table>
        <thead>
          <tr>
            <th>商品名称</th>
            <th>价格</th>
            <th>库存</th> {/* 添加库存表头 */}
            <th>分类</th> {/* 添加分类表头 */}
            {/* Add more headers as needed */}
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product._id}>
              <td>{product.name}</td>
              <td>{product.price}</td>
              <td>{product.stock}</td> {/* 添加库存数据 */}
              <td>{product.category}</td> {/* 添加分类数据 */}
              {/* Add more data cells as needed */}
              <td>
                <button onClick={() => handleEditProduct(product)}>编辑</button>
                <button onClick={() => handleDeleteProduct(product._id)}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 模态框 */} 
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{currentProduct ? '编辑商品' : '新增商品'}</h2>
            {/* Add form fields for product details */}
            <form>
              <div>
                <label htmlFor="name">商品名称:</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} />
              </div>
              <div>
                <label htmlFor="price">价格:</label>
                <input type="number" id="price" name="price" value={formData.price} onChange={handleInputChange} />
              </div>
              <div>
                <label htmlFor="description">描述:</label>
                <textarea id="description" name="description" value={formData.description} onChange={handleInputChange}></textarea>
              </div>
              <div>
                <label htmlFor="imageUrl">主图URL:</label>
                <input type="text" id="imageUrl" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} />
              </div>
              <div>
                <label htmlFor="images">附加图片URL (逗号分隔):</label>
                <input type="text" id="images" name="images" value={formData.images} onChange={handleInputChange} />
              </div>
              <div>
                <label htmlFor="stock">库存:</label>
                <input type="number" id="stock" name="stock" value={formData.stock} onChange={handleInputChange} />
              </div>
              <div>
                <label htmlFor="category">分类:</label>
                <input type="text" id="category" name="category" value={formData.category} onChange={handleInputChange} />
              </div>
              {/* TODO: Add more form fields */}
            </form>
            <button onClick={handleSaveProduct}>保存</button>
            <button onClick={handleCloseModal}>取消</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
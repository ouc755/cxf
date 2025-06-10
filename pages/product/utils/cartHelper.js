const addToCart = async function(productData, quantity) {
  const db = wx.cloud.database();
  
  // 获取当前用户的购物车
  const { data: cartData } = await db.collection('toys').where({
    _openid: '{openid}',
    type: 'cart'
  }).get();

  if (cartData && cartData.length > 0) {
    // 更新现有购物车
    const cart = cartData[0];
    const products = cart.products || [];
    
    // 检查是否已存在相同商品
    const existingProductIndex = products.findIndex(p => 
      p._id === productData._id && 
      p.specification === productData.specification && 
      p.size === productData.size &&
      p.color === productData.color
    );

    if (existingProductIndex > -1) {
      products[existingProductIndex].quantity += quantity;
    } else {
      products.push({...productData, quantity, selected: true});
    }

    await db.collection('toys').doc(cart._id).update({
      data: {
        products: products,
        updateTime: db.serverDate()
      }
    });
  } else {
    // 创建新购物车
    await db.collection('toys').add({
      data: {
        type: 'cart',
        products: [{...productData, quantity, selected: true}],
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    });
  }
};

const checkSpecSelected = function(selectedStyle, selectedSize, selectedColor) {
  if (!selectedStyle) {
    wx.showToast({
      title: '请选择规格',
      icon: 'none'
    });
    return false;
  }
  
  if (!selectedSize) {
    wx.showToast({
      title: '请选择尺寸',
      icon: 'none'
    });
    return false;
  }
  
  if (!selectedColor) {
    wx.showToast({
      title: '请选择颜色',
      icon: 'none'
    });
    return false;
  }
  
  return true;
};

module.exports = {
  addToCart,
  checkSpecSelected
}; 
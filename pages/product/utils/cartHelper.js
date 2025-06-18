const addToCart = async function(productData, quantity) {
  const db = wx.cloud.database();
  
  // 获取当前用户的购物车
  const { data: cartData } = await db.collection('toys').where({
    _openid: '{openid}',
    type: 'cart'
  }).get();

  // 判断商品是否完全相同（所有规格、颜色、定制项等都一致才合并数量）
  const isSameProduct = (p1, p2) => {
    return (
      p1._id === p2._id &&
      p1.specification === p2.specification &&
      p1.size === p2.size &&
      p1.color === p2.color &&
      p1.style === p2.style &&
      p1.giftBag === p2.giftBag &&
      p1.packaging === p2.packaging &&
      JSON.stringify(p1.customOptions || {}) === JSON.stringify(p2.customOptions || {})
    );
  };

  if (cartData && cartData.length > 0) {
    // 更新现有购物车
    const cart = cartData[0];
    const products = cart.products || [];
    
    // 检查是否已存在相同商品
    const existingProductIndex = products.findIndex(p => isSameProduct(p, productData));

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
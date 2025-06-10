Page({
  handlePurchase() {
    // 验证是否选择了规格
    if (this.data.toy.specifications.length > 0 && this.data.selectedSpec === -1) {
      wx.showToast({
        title: '请选择规格',
        icon: 'none'
      });
      return;
    }

    // 验证是否选择了尺寸
    if (this.data.toy.sizes.length > 0 && this.data.selectedSize === -1) {
      wx.showToast({
        title: '请选择尺寸',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    wx.getStorage({
      key: 'token',
      success: res => {
        const token = res.data;
        wx.request({
          url: `${getApp().globalData.baseUrl}/api/orders`,
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          data: {
            productId: this.data.toy.id,
            specs: {
              specification: this.data.toy.specifications[this.data.selectedSpec],
              size: this.data.toy.sizes[this.data.selectedSize]
            },
            quantity: this.data.quantity,
            totalPrice: parseFloat(this.data.currentPrice) * this.data.quantity,
            shippingAddress: {
              name: '临时用户',
              phone: '13800138000',
              address: '临时配送地址'
            },
            paymentMethod: 'WeChatPay'
          },
          success: (response) => {
            if (response.statusCode === 201) {
              console.log('订单创建成功，准备跳转到订单详情页:', response.data);
              const url = `/pages/orderDetail/orderDetail?id=${response.data._id}`;
              console.log('跳转URL:', url);
              wx.navigateTo({ 
                url: url
              });
            } else {
              wx.showToast({
                title: response.data.message || '创建订单失败',
                icon: 'none'
              });
            }
          },
          fail: (error) => {
            console.error('创建订单失败:', error);
            wx.showToast({
              title: '创建订单失败，请稍后重试',
              icon: 'none'
            });
          },
          complete: () => {
            this.setData({ loading: false });
          }
        });
      },
      fail: () => {
        this.setData({ loading: false });
        wx.navigateTo({ url: '/pages/login/login' });
      }
    });
  },
  data: {
    toy: null,
    favorited: false,
    selectedSpec: -1,
    selectedSize: -1,
    currentPrice: 0,
    loading: false,
    quantity: 1
  },
  onLoad(options) {
    const { toyList } = require('../../utils/toyData.js');
    const toy = toyList.find(t => t.id === parseInt(options.id));
    if (toy) {
      this.setData({
        toy: {
          ...toy,
          priceVariations: toy.priceVariations || []
        },
        selectedSpec: toy.specifications.length > 0 ? 0 : -1,
        selectedSize: toy.sizes.length > 0 ? 0 : -1,
        currentPrice: (toy.priceVariations && toy.priceVariations[0]) ? toy.priceVariations[0][0].toFixed(2) : toy.price.toFixed(2)
      });
    }
  },
  toggleFavorite() {
    this.setData({ favorited: !this.data.favorited });
  },
  selectSpec(e) {
    const specIndex = e.currentTarget.dataset.index;
    const sizeIndex = this.data.selectedSize;
    const priceVariations = this.data.toy.priceVariations || [];
    const newPrice = (priceVariations[specIndex] && priceVariations[specIndex][sizeIndex]) 
      || this.data.toy.price;
    this.setData({
      selectedSpec: specIndex,
      currentPrice: Number(newPrice).toFixed(2)
    });
  },
  selectSize(e) {
    const sizeIndex = e.currentTarget.dataset.index;
    const specIndex = this.data.selectedSpec;
    const priceVariations = this.data.toy.priceVariations || [];
    const currentSpecPrices = priceVariations[specIndex] || [];
    const maxSizeIndex = currentSpecPrices.length > 0 ? currentSpecPrices.length - 1 : 0;
    const validIndex = Math.max(0, Math.min(sizeIndex, maxSizeIndex));
    const newPrice = currentSpecPrices[validIndex] || this.data.toy.price;
    this.setData({ 
      selectedSize: validIndex,
      currentPrice: Number(newPrice).toFixed(2)
    });
  },
  // 增加数量
  increaseQuantity() {
    this.setData({
      quantity: this.data.quantity + 1
    })
  },
  // 减少数量
  decreaseQuantity() {
    if (this.data.quantity > 1) {
      this.setData({
        quantity: this.data.quantity - 1
      })
    }
  },
  // 添加到购物车
  async addToCart() {
    try {
      // 验证是否选择了规格
      if (this.data.toy.specifications.length > 0 && this.data.selectedSpec === -1) {
        wx.showToast({
          title: '请选择规格',
          icon: 'none'
        });
        return;
      }

      // 验证是否选择了尺寸
      if (this.data.toy.sizes.length > 0 && this.data.selectedSize === -1) {
        wx.showToast({
          title: '请选择尺寸',
          icon: 'none'
        });
        return;
      }

      this.setData({ loading: true });

      const db = wx.cloud.database()
      
      // 获取当前用户的购物车
      const { data: cartData } = await db.collection('toys').where({
        _openid: '{openid}',
        type: 'cart'
      }).get()

      const productData = {
        _id: this.data.toy.id.toString(),
        name: this.data.toy.name,
        imageUrl: this.data.toy.imageUrl,
        price: parseFloat(this.data.currentPrice),
        quantity: this.data.quantity,
        selected: true,
        specification: this.data.toy.specifications[this.data.selectedSpec],
        size: this.data.toy.sizes[this.data.selectedSize],
        style: this.data.toy.style || '',
        color: this.data.toy.color || ''
      }

      if (cartData && cartData.length > 0) {
        // 更新现有购物车
        const cart = cartData[0]
        const products = cart.products || []
        
        // 检查是否已存在相同商品（相同ID、规格和尺寸）
        const existingProductIndex = products.findIndex(p => 
          p._id === productData._id && 
          p.specification === productData.specification && 
          p.size === productData.size
        )

        if (existingProductIndex > -1) {
          // 更新数量
          products[existingProductIndex].quantity += this.data.quantity
        } else {
          // 添加新商品
          products.push(productData)
        }

        await db.collection('toys').doc(cart._id).update({
          data: {
            products,
            updateTime: db.serverDate()
          }
        })
      } else {
        // 创建新购物车
        await db.collection('toys').add({
          data: {
            type: 'cart',
            products: [productData],
            createTime: db.serverDate(),
            updateTime: db.serverDate()
          }
        })
      }

      wx.showToast({
        title: '已加入购物车',
        icon: 'success'
      })

      setTimeout(() => {
        wx.switchTab({
          url: '/pages/cart/cart'
        })
      }, 1500)
    } catch (error) {
      console.error('添加到购物车失败：', error)
      wx.showToast({
        title: '添加失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  }
});
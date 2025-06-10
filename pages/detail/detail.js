const app = getApp()

Page({
  data: {
    product: null,
    isLoading: true
  },

  onLoad: async function(options) {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }

    // 获取商品ID
    const { id } = options
    if (!id) {
      wx.showToast({
        title: '商品不存在',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    // 加载商品详情
    await this.loadProductDetail(id)
  },

  // 加载商品详情
  async loadProductDetail(id) {
    try {
      const db = wx.cloud.database()
      const result = await db.collection('products').doc(id).get()
      
      if (result.data) {
        this.setData({
          product: result.data,
          isLoading: false
        })
      } else {
        wx.showToast({
          title: '商品不存在',
          icon: 'error'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    } catch (error) {
      console.error('Load product detail failed:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
      this.setData({
        isLoading: false
      })
    }
  },

  // 立即购买
  handleBuyNow() {
    const token = wx.getStorageSync('token');
    if (!token || !app.globalData.isLoggedIn) {
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }
    // 处理购买逻辑...
    const { product } = this.data
    if (product) {
      wx.navigateTo({
        url: `/pages/order/confirm/confirm?productId=${product._id}`
      })
    }
  },

  // 加入购物车
  handleAddToCart() {
    const token = wx.getStorageSync('token'); // token可选
    
    // 处理加入购物车逻辑
    const { product } = this.data
    if (product) {
      wx.cloud.callFunction({
        name: 'addToCart',
        data: {
          productId: product._id,
          quantity: 1,
          token // 传递token到后端，可选
        }
      }).then(() => {
        wx.showToast({
          title: '已加入购物车',
          icon: 'success'
        })
      }).catch(error => {
        console.error('Add to cart failed:', error)
        wx.showToast({
          title: '添加失败',
          icon: 'error'
        })
      })
    }
  }
}) 
const app = getApp()

Page({
  data: {
    product: null,
    isLoading: true,
    displayPrice: '0.00'
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
        // 处理价格显示
        let displayPrice = '0.00'
        if (result.data.prices && Array.isArray(result.data.prices) && result.data.prices.length > 0) {
          const firstPriceEntry = result.data.prices.find(p => typeof p.price === 'number')
          if (firstPriceEntry) {
            displayPrice = firstPriceEntry.price.toFixed(2)
          }
        }

        // 处理图片临时链接
        let imageUrl = result.data.imageUrl
        if (imageUrl && imageUrl.includes('cloud://')) {
          try {
            const { fileList } = await wx.cloud.getTempFileURL({
              fileList: [imageUrl]
            })
            if (fileList && fileList[0] && fileList[0].tempFileURL) {
              imageUrl = fileList[0].tempFileURL
            }
          } catch (err) {
            console.error('获取图片临时链接失败：', err)
          }
        }

        // 确保所有数组字段都存在
        const productData = {
          ...result.data,
          imageUrl,
          colors: result.data.colors || [],
          styles: result.data.styles || [],
          sizes: result.data.sizes || [],
          customProperties: result.data.customProperties || []
        }

        this.setData({
          product: productData,
          displayPrice,
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

  // 加入购物车
  async handleAddToCart() {
    if (!this.data.product) return;
    
    try {
      wx.showLoading({
        title: '添加中...',
        mask: true
      });

      const db = wx.cloud.database();
      await db.collection('carts').add({
        data: {
          productId: this.data.product._id,
          quantity: 1,
          selected: true,
          createTime: db.serverDate()
        }
      });

      wx.showToast({
        title: '已加入购物车',
        icon: 'success'
      });
    } catch (error) {
      console.error('Add to cart failed:', error);
      wx.showToast({
        title: '添加失败',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 立即购买
  handleBuyNow() {
    if (!this.data.product) return;
    
    wx.navigateTo({
      url: `/pages/order/confirm/confirm?productId=${this.data.product._id}`
    });
  }
}) 
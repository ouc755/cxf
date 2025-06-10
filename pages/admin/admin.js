// pages/admin/admin.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    loading: true,
    currentTab: 'carts',
    cartList: [],
    productList: [],
    currentPage: 1,
    pageSize: 20,
    totalPages: 1,
    hasMore: true,
    defaultAvatarUrl: '',
    defaultProductUrl: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    // 获取默认图片的临时链接
    await this.initDefaultImages()
    await this.checkLoginStatus()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  async onShow() {
    await this.checkLoginStatus()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  async onPullDownRefresh() {
    this.setData({
      currentPage: 1,
      hasMore: true,
      cartList: []
    })
    await this.loadData()
    wx.stopPullDownRefresh()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  async onReachBottom() {
    if (!this.data.hasMore) return
    
    this.setData({
      currentPage: this.data.currentPage + 1
    })
    await this.loadData()
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  // 初始化默认图片
  async initDefaultImages() {
    try {
      const { fileList } = await wx.cloud.getTempFileURL({
        fileList: [
          'cloud://cloud1-2g5ar9yr97b49f2f.636c-cloud1-2g5ar9yr97b49f2f-1361317451/default/default-avatar.png',
          'cloud://cloud1-2g5ar9yr97b49f2f.636c-cloud1-2g5ar9yr97b49f2f-1361317451/default/default-product.png'
        ]
      })
      
      this.setData({
        defaultAvatarUrl: fileList[0].tempFileURL,
        defaultProductUrl: fileList[1].tempFileURL
      })
    } catch (error) {
      console.error('获取默认图片临时链接失败：', error)
      // 设置一个备用的图片URL
      this.setData({
        defaultAvatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
        defaultProductUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
      })
    }
  },

  // 检查登录状态
  async checkLoginStatus() {
    if (!app.globalData.isAdminLoggedIn) {
      wx.showToast({
        title: '请先登录管理员账号',
        icon: 'none'
      })
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/adminLogin/adminLogin'
        })
      }, 1500)
      return
    }
    
    // 加载数据
    await this.loadData()
    this.setData({ loading: false })
  },

  // 加载数据
  async loadData() {
    if (this.data.currentTab === 'carts') {
      await this.loadCartList()
    } else {
      await this.loadProductList()
    }
  },

  // 处理图片URL
  async processImageUrls(data) {
    return await Promise.all(data.map(async (item) => {
      // 处理用户头像
      if (item.userInfo && item.userInfo.avatarUrl && item.userInfo.avatarUrl.includes('cloud://')) {
        try {
          const { fileList } = await wx.cloud.getTempFileURL({
            fileList: [item.userInfo.avatarUrl]
          })
          item.userInfo.avatarUrl = fileList[0].tempFileURL
        } catch (error) {
          console.error('获取用户头像临时链接失败：', error)
          item.userInfo.avatarUrl = this.data.defaultAvatarUrl
        }
      } else if (!item.userInfo || !item.userInfo.avatarUrl) {
        item.userInfo = item.userInfo || {}
        item.userInfo.avatarUrl = this.data.defaultAvatarUrl
      }

      // 处理商品图片
      if (item.products) {
        item.products = await Promise.all(item.products.map(async (product) => {
          if (product.imageUrl && product.imageUrl.includes('cloud://')) {
            try {
              const { fileList } = await wx.cloud.getTempFileURL({
                fileList: [product.imageUrl]
              })
              product.imageUrl = fileList[0].tempFileURL
            } catch (error) {
              console.error('获取商品图片临时链接失败：', error)
              product.imageUrl = this.data.defaultProductUrl
            }
          } else if (!product.imageUrl) {
            product.imageUrl = this.data.defaultProductUrl
          }
          return product
        }))
      }

      return item
    }))
  },

  // 加载购物车列表
  async loadCartList() {
    if (!this.data.hasMore) return

    try {
      const db = wx.cloud.database()
      const toys = db.collection('toys')
      
      // 获取总数
      const countResult = await toys.where({
        type: 'cart'
      }).count()

      // 获取购物车列表
      const { data } = await toys.where({
        type: 'cart'
      })
      .skip((this.data.currentPage - 1) * this.data.pageSize)
      .limit(this.data.pageSize)
      .orderBy('updateTime', 'desc')
      .get()

      // 处理图片URL
      const processedData = await this.processImageUrls(data)

      // 更新数据
      this.setData({
        cartList: this.data.currentPage === 1 ? processedData : [...this.data.cartList, ...processedData],
        totalPages: Math.ceil(countResult.total / this.data.pageSize),
        hasMore: this.data.currentPage < Math.ceil(countResult.total / this.data.pageSize)
      })
    } catch (error) {
      console.error('加载购物车列表失败：', error)
      wx.showToast({
        title: '加载购物车失败',
        icon: 'none'
      })
    }
  },

  // 加载商品列表
  async loadProductList() {
    try {
      const db = wx.cloud.database()
      const { data } = await db.collection('products').get()
      
      // 获取临时文件链接
      const productsWithTempUrls = await Promise.all(data.map(async (product) => {
        if (product.imageUrl && product.imageUrl.includes('cloud://')) {
          try {
            // 从云存储路径中提取文件ID
            const fileID = product.imageUrl
            const { fileList } = await wx.cloud.getTempFileURL({
              fileList: [fileID]
            })
            // 更新图片链接为临时链接
            return {
              ...product,
              imageUrl: fileList[0].tempFileURL
            }
          } catch (err) {
            console.error('获取图片临时链接失败：', err)
            return product
          }
        }
        return product
      }))

      this.setData({ 
        productList: productsWithTempUrls
      })
    } catch (error) {
      console.error('加载商品列表失败：', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  // 切换标签页
  async switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.currentTab) return
    
    this.setData({
      currentTab: tab,
      currentPage: 1,
      hasMore: true,
      cartList: [],
      productList: []
    })
    
    await this.loadData()
  },

  // 跳转到添加商品页面
  navigateToAddProduct() {
    wx.navigateTo({
      url: '/pages/admin/addProduct/addProduct'
    })
  },

  // 编辑商品
  editProduct(e) {
    const productId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/admin/addProduct/addProduct?id=${productId}`
    })
  },

  // 删除商品
  async deleteProduct(e) {
    const productId = e.currentTarget.dataset.id
    
    try {
      const res = await wx.showModal({
        title: '确认删除',
        content: '确定要删除这个商品吗？',
        confirmText: '删除',
        confirmColor: '#ff0000'
      })

      if (res.confirm) {
        const db = wx.cloud.database()
        await db.collection('products').doc(productId).remove()
        
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        })

        // 重新加载商品列表
        this.loadProductList()
      }
    } catch (error) {
      console.error('删除商品失败：', error)
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      })
    }
  },

  // 查看订单
  viewOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/admin/order/detail?id=${id}`
    })
  },

  // 删除购物车
  async deleteCart(e) {
    const id = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个购物车吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const db = wx.cloud.database()
            await db.collection('toys').doc(id).remove()

            // 从列表中移除
            this.setData({
              cartList: this.data.cartList.filter(cart => cart._id !== id)
            })

            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
          } catch (error) {
            console.error('删除购物车失败：', error)
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  }
})
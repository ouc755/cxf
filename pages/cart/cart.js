const app = getApp()

Page({
  data: {
    cartItems: [],
    isLoading: true,
    isEditing: false,
    totalPrice: 0,
    isSelectAll: false,
    selectedCount: 0,
    cartId: null,
    emptyCartIcon: '',
    checkboxSelectedIcon: '',
    checkboxNormalIcon: '',
    deleteIcon: ''
  },

  onLoad() {
    this.initIcons()
    this.checkLoginStatus()
  },

  onShow() {
    this.checkLoginStatus()
  },

  // 初始化图标
  async initIcons() {
    try {
      const { fileList } = await wx.cloud.getTempFileURL({
        fileList: [
          'cloud://cloud1-2g5ar9yr97b49f2f.636c-cloud1-2g5ar9yr97b49f2f-1361317451/default/empty-cart.png',
          'cloud://cloud1-2g5ar9yr97b49f2f.636c-cloud1-2g5ar9yr97b49f2f-1361317451/icons/checkbox-selected.png',
          'cloud://cloud1-2g5ar9yr97b49f2f.636c-cloud1-2g5ar9yr97b49f2f-1361317451/icons/checkbox-normal.png',
          'cloud://cloud1-2g5ar9yr97b49f2f.636c-cloud1-2g5ar9yr97b49f2f-1361317451/icons/delete.png'
        ]
      })

      this.setData({
        emptyCartIcon: fileList[0].tempFileURL,
        checkboxSelectedIcon: fileList[1].tempFileURL,
        checkboxNormalIcon: fileList[2].tempFileURL,
        deleteIcon: fileList[3].tempFileURL
      })
    } catch (error) {
      console.error('获取图标临时链接失败：', error)
    }
  },

  // 检查登录状态
  async checkLoginStatus() {
    this.setData({ isLoading: true })
    
    try {
      // 检查是否有openid
      const openid = wx.getStorageSync('openid')
      
      if (!openid) {
        console.log('用户未登录')
        this.handleNotLoggedIn()
        return
      }

      // 获取最新的用户信息
      try {
        const db = wx.cloud.database()
        const userResult = await db.collection('users').where({
          _openid: openid
        }).get()
        
        if (userResult.data.length > 0) {
          const latestUserInfo = userResult.data[0]
          // 更新本地存储的用户信息
          wx.setStorageSync('userInfo', {
            nickName: latestUserInfo.nickName,
            avatarUrl: latestUserInfo.avatarUrl,
            gender: latestUserInfo.gender,
            country: latestUserInfo.country,
            province: latestUserInfo.province,
            city: latestUserInfo.city,
            language: latestUserInfo.language
          })
        }
      } catch (error) {
        console.error('获取最新用户信息失败:', error)
      }

      // 检查是否有用户信息
      const userInfo = wx.getStorageSync('userInfo')
      if (!userInfo) {
        console.log('用户信息不存在')
        this.handleNotLoggedIn()
        return
      }

      // 已登录，加载购物车数据
      await this.loadCartData()
    } catch (error) {
      console.error('检查登录状态出错:', error)
      this.handleNotLoggedIn()
    }
  },

  // 处理未登录状态
  handleNotLoggedIn() {
    this.setData({ 
      isLoading: false,
      cartItems: []
    })
    wx.showToast({
      title: '请先登录',
      icon: 'none',
      duration: 1500
    })
    setTimeout(() => {
      // 先跳转到个人中心页面（因为购物车是tabBar页面，不能直接跳转到非tabBar页面）
      wx.switchTab({
        url: '/pages/profile/profile',
        success: () => {
          // 在个人中心页面中处理登录跳转
          getApp().globalData.needLogin = true
        }
      })
    }, 1500)
  },

  // 加载购物车数据
  async loadCartData() {
    try {
      const token = wx.getStorageSync('token') // token可选
      const { result } = await wx.cloud.callFunction({
        name: 'getCart',
        data: { token }
      })

      console.log('获取购物车数据结果：', result)

      if (result.success) {
        // 更新用户信息
        if (result.userInfo) {
          wx.setStorageSync('userInfo', {
            nickName: result.userInfo.nickName,
            avatarUrl: result.userInfo.avatarUrl,
            gender: result.userInfo.gender,
            country: result.userInfo.country,
            province: result.userInfo.province,
            city: result.userInfo.city,
            language: result.userInfo.language
          })
        }

        const cartData = result.cart || { products: [] }
        const formattedProducts = cartData.products.map(product => ({
          _id: product._id || product.productId,
          name: product.name,
          price: product.price || 0,
          quantity: product.quantity || 1,
          selected: product.selected || false,
          imageUrl: product.imageUrl,
          // 其他可能的商品属性
          specification: product.specification,
          size: product.size,
          color: product.color
        }))

        this.setData({
          cartItems: formattedProducts,
          cartId: result.cartId,
          isLoading: false
        })
        this.calculateTotal()
        this.checkSelectAll()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('加载购物车数据失败:', error)
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
      this.setData({ 
        isLoading: false,
        cartItems: []
      })
    }
  },

  // 计算总价和选中数量
  calculateTotal() {
    let total = 0
    let count = 0
    this.data.cartItems.forEach(item => {
      if (item.selected) {
        // 确保商品价格存在
        const price = item.price || 0
        const quantity = item.quantity || 1
        total += price * quantity
        count++
      }
    })
    this.setData({
      totalPrice: total.toFixed(2),
      selectedCount: count
    })
  },

  // 检查是否全选
  checkSelectAll() {
    const isSelectAll = this.data.cartItems.length > 0 && 
      this.data.cartItems.every(item => item.selected)
    this.setData({ isSelectAll })
  },

  // 切换商品选中状态
  async toggleSelect(e) {
    if (!this.checkLoginBeforeOperation()) return
    
    const { id } = e.currentTarget.dataset
    const item = this.data.cartItems.find(i => i._id === id)
    if (!item) return

    const newSelected = !item.selected
    try {
      await wx.cloud.callFunction({
        name: 'toggleCartItemSelected',
        data: { cartItemId: id, selected: newSelected }
      })
      this.setData({
        [`cartItems[${this.data.cartItems.indexOf(item)}].selected`]: newSelected
      })
      this.calculateTotal()
      this.checkSelectAll()
    } catch (error) {
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  // 全选/取消全选
  async toggleSelectAll() {
    if (!this.checkLoginBeforeOperation()) return

    const newSelectAll = !this.data.isSelectAll
    this.setData({ isSelectAll: newSelectAll })
    const promises = this.data.cartItems.map(item => 
      wx.cloud.callFunction({
        name: 'toggleCartItemSelected',
        data: { cartItemId: item._id, selected: newSelectAll }
      })
    )
    try {
      await Promise.all(promises)
      const updatedItems = this.data.cartItems.map(item => ({ ...item, selected: newSelectAll }))
      this.setData({ cartItems: updatedItems })
      this.calculateTotal()
    } catch (error) {
       wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  // 修改商品数量
  async changeQuantity(e) {
    if (!this.checkLoginBeforeOperation()) return

    const { id, value } = e.currentTarget.dataset
    const item = this.data.cartItems.find(i => i._id === id)
    if (!item) return

    const newQuantity = item.quantity + value
    if (newQuantity < 1) return

    try {
      await wx.cloud.callFunction({
        name: 'updateCartItem',
        data: { cartItemId: id, quantity: newQuantity }
      })
      this.setData({
        [`cartItems[${this.data.cartItems.indexOf(item)}].quantity`]: newQuantity
      })
      this.calculateTotal()
    } catch (error) {
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  // 删除商品
  async removeItem(e) {
    if (!this.checkLoginBeforeOperation()) return

    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '确认',
      content: '确定要删除这个商品吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await wx.cloud.callFunction({
              name: 'removeFromCart',
              data: { cartItemId: id }
            })
            const newCartItems = this.data.cartItems.filter(i => i._id !== id)
            this.setData({ cartItems: newCartItems })
            this.calculateTotal()
            this.checkSelectAll()
            wx.showToast({ title: '删除成功' })
          } catch (error) {
            wx.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  },
  
  // 结算
  handleCheckout() {
    if (!this.checkLoginBeforeOperation()) return

    if (this.data.selectedCount === 0) {
      wx.showToast({ title: '请选择要结算的商品', icon: 'none' })
      return
    }
    // 跳转到订单确认页面
    wx.navigateTo({
      url: '/pages/order/confirm/confirm?from=cart',
    })
  },

  // 操作前检查登录状态
  checkLoginBeforeOperation() {
    const openid = wx.getStorageSync('openid')
    const userInfo = wx.getStorageSync('userInfo')
    
    if (!openid || !userInfo) {
      this.handleNotLoggedIn()
      return false
    }
    return true
  }
}) 
// pages/admin/carts/carts.js

/**
 * 管理员购物车列表页面
 * 功能：
 * 1. 展示所有用户的购物车信息
 * 2. 支持分页加载和下拉刷新
 * 3. 包含本地缓存机制
 * 4. 处理各种错误情况和边界条件
 */
Page({
  /**
   * 页面状态数据
   * @property {Array} carts - 购物车列表数据
   * @property {number} currentPage - 当前页码，从1开始
   * @property {number} pageSize - 每页显示的数据条数
   * @property {number} totalPages - 总页数
   * @property {boolean} isLoading - 是否正在加载数据
   * @property {boolean} hasLoadedInitialData - 是否已加载初始数据
   */
  data: {
    carts: [],
    currentPage: 1,
    pageSize: 20,
    totalPages: 1,
    isLoading: false,
    hasLoadedInitialData: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.loadInitialData()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 只在未加载过数据或从编辑页面返回时重新加载
    if (!this.data.hasLoadedInitialData || this.data.needRefresh) {
      this.loadInitialData()
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    // 清除刷新标记
    this.data.needRefresh = false
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 清除所有状态和缓存
    this.setData({
      carts: [],
      currentPage: 1,
      hasLoadedInitialData: false
    })
    wx.removeStorageSync('adminCartsCache')
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.refreshData()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    this.loadMoreData()
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  /**
   * 初始化加载数据
   * 1. 重置页面状态
   * 2. 尝试从本地缓存加载数据（如果缓存未过期）
   * 3. 无论是否有缓存，都会请求最新数据
   * @async
   * @returns {Promise<void>}
   */
  async loadInitialData() {
    this.setData({ 
      currentPage: 1,
      hasLoadedInitialData: false 
    })
    
    // 尝试从缓存加载
    const cachedData = wx.getStorageSync('adminCartsCache')
    if (cachedData && Date.now() - cachedData.timestamp < 5 * 60 * 1000) { // 5分钟缓存
      this.setData({
        ...cachedData.data,
        hasLoadedInitialData: true
      })
    }
    
    // 无论是否有缓存都重新加载最新数据
    await this.loadCarts()
  },

  /**
   * 刷新数据
   * 用于下拉刷新时重新加载第一页数据
   * @async
   * @returns {Promise<void>}
   */
  async refreshData() {
    this.setData({ currentPage: 1 })
    await this.loadCarts()
    wx.stopPullDownRefresh()
  },

  /**
   * 加载更多数据
   * 用于上拉触底时加载下一页数据
   * 会检查是否还有更多数据可加载
   * @async
   * @returns {Promise<void>}
   */
  async loadMoreData() {
    if (this.data.currentPage >= this.data.totalPages) {
      wx.showToast({
        title: '没有更多数据了',
        icon: 'none'
      })
      return
    }

    const nextPage = this.data.currentPage + 1
    this.setData({ currentPage: nextPage })
    await this.loadCarts(true) // true表示追加模式
  },

  /**
   * 加载购物车列表数据
   * @async
   * @param {boolean} isAppend - 是否为追加模式（加载更多）
   * @returns {Promise<void>}
   * @throws {Error} 当网络请求失败或数据格式错误时抛出异常
   */
  async loadCarts(isAppend = false) {
    if (this.data.isLoading) return
    
    wx.showLoading({ title: '加载中...' })
    this.setData({ isLoading: true })
    
    try {
      const token = wx.getStorageSync('adminToken')
      if (!this.checkAndHandleToken(token)) return

      const { result } = await wx.cloud.callFunction({
        name: 'adminGetCarts',
        data: {
          token,
          page: this.data.currentPage,
          pageSize: this.data.pageSize
        }
      })

      if (!this.validateResponse(result)) return

      // 处理数据
      const cartsWithUserInfo = this.processCartsData(result.data)
      
      // 更新状态
      this.updateCartsState(cartsWithUserInfo, result.totalPages, isAppend)
      
      // 更新缓存
      this.updateCache()

    } catch (error) {
      this.handleError(error)
    } finally {
      this.setData({ isLoading: false })
      wx.hideLoading()
    }
  },

  /**
   * 验证管理员Token
   * @param {string} token - 管理员登录token
   * @returns {boolean} 如果token有效返回true，否则返回false
   */
  checkAndHandleToken(token) {
    if (!token) {
      this.handleNoToken()
      return false
    }
    return true
  },

  /**
   * 处理未登录或Token失效的情况
   * 1. 清除本地数据和缓存
   * 2. 显示提示信息
   * 3. 跳转到登录页面
   */
  handleNoToken() {
    // 清除敏感数据
    this.setData({
      carts: [],
      hasLoadedInitialData: false
    })
    wx.removeStorageSync('adminCartsCache')
    
    wx.showToast({
      title: '请先登录',
      icon: 'none'
    })
    setTimeout(() => {
      wx.navigateTo({
        url: '/pages/adminLogin/adminLogin'
      })
    }, 1500)
  },

  /**
   * 验证服务器响应数据的有效性
   * @param {Object} result - 服务器返回的响应数据
   * @param {boolean} result.success - 请求是否成功
   * @param {Array} result.data - 购物车数据数组
   * @returns {boolean} 数据格式是否有效
   */
  validateResponse(result) {
    if (!result || !result.success || !Array.isArray(result.data)) {
      wx.showToast({
        title: result?.error || '数据格式错误',
        icon: 'none'
      })
      return false
    }
    return true
  },

  /**
   * 处理购物车数据
   * 为每条购物车记录添加用户信息，包括头像和昵称
   * @param {Array} carts - 原始购物车数据
   * @returns {Array} 处理后的购物车数据
   */
  processCartsData(carts) {
    return carts.map(cart => ({
      ...cart,
      userNickName: cart.userInfo?.nickName || '未知用户',
      userAvatar: cart.userInfo?.avatarUrl || 'cloud://cloud1-2g5ar9yr97b49f2f.636c-cloud1-2g5ar9yr97b49f2f-1361317451/default/default-avatar.png'
    }))
  },

  /**
   * 更新页面购物车状态
   * @param {Array} cartsWithUserInfo - 处理后的购物车数据
   * @param {number} totalPages - 总页数
   * @param {boolean} isAppend - 是否为追加模式
   */
  updateCartsState(cartsWithUserInfo, totalPages, isAppend) {
    this.setData({
      carts: isAppend ? [...this.data.carts, ...cartsWithUserInfo] : cartsWithUserInfo,
      totalPages,
      hasLoadedInitialData: true
    })
  },

  /**
   * 更新本地缓存
   * 缓存包含：购物车数据、总页数、当前页码和时间戳
   */
  updateCache() {
    wx.setStorageSync('adminCartsCache', {
      timestamp: Date.now(),
      data: {
        carts: this.data.carts,
        totalPages: this.data.totalPages,
        currentPage: this.data.currentPage
      }
    })
  },

  /**
   * 统一错误处理
   * 处理不同类型的错误：
   * - 网络错误 (-404)
   * - 认证错误 (-401)
   * - 其他业务错误
   * @param {Error} error - 错误对象
   */
  handleError(error) {
    console.error('加载购物车列表失败：', error)
    let errorMessage = '加载失败'
    
    if (error.errCode === -404) {
      errorMessage = '网络连接失败'
    } else if (error.errCode === -401) {
      errorMessage = '登录已过期'
      this.handleNoToken()
      return
    } else if (error.message) {
      errorMessage = error.message
    }

    wx.showToast({
      title: errorMessage,
      icon: 'none'
    })
  }
})
// pages/admin/order/detail.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    cart: null,
    products: [],
    userInfo: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    const cartId = options.id
    if (!cartId) {
      wx.showToast({ title: '无效的购物车ID', icon: 'none' })
      wx.navigateBack()
      return
    }
    try {
      const db = wx.cloud.database()
      const cartRes = await db.collection('toys').doc(cartId).get()
      const cart = cartRes.data
      // 获取用户信息
      let userInfo = null
      if (cart.openid) {
        const userRes = await db.collection('users').where({ _openid: cart.openid }).get()
        if (userRes.data.length > 0) userInfo = userRes.data[0]
      }
      // 处理每个商品的customOptions为数组
      const products = (cart.products || []).map(product => {
        let customOptionsArr = []
        if (product.customOptions && typeof product.customOptions === 'object') {
          customOptionsArr = Object.keys(product.customOptions).map(key => ({
            key,
            value: product.customOptions[key]
          }))
        }
        return {
          ...product,
          customOptionsArr
        }
      })
      this.setData({
        cart,
        products,
        userInfo
      })
    } catch (error) {
      wx.showToast({ title: '加载订单失败', icon: 'none' })
    }
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
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})
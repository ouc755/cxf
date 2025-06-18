Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    defaultAvatarUrl: 'cloud://cloud1-2g5ar9yr97b49f2f.636c-cloud1-2g5ar9yr97b49f2f-1361317451/default/default-avatar.png',
    orderCounts: {
      unpaid: 0,
      undelivered: 0,
      delivered: 0,
      completed: 0
    }
  },

  onLoad() {
    // 在onShow中检查登录状态和获取订单数量
  },

  onShow() {
    this.checkLoginStatus()
    // 如果已登录，获取订单数量
    if (getApp().globalData.isLoggedIn) {
      this.getOrderCounts()
    }
  },

  // 检查登录状态，从全局数据获取
  async checkLoginStatus() {
    const app = getApp()
    this.setData({
      isLoggedIn: app.globalData.isLoggedIn,
      userInfo: app.globalData.userInfo
    })
  },

  // 获取各订单状态的数量
  async getOrderCounts() {
    const openid = getApp().globalData.openid
    if (!openid) return // 未登录则不获取订单数量
    
    try {
      const db = wx.cloud.database()
      const { data } = await db.collection('orders')
        .where({
          _openid: openid // 使用globalData中的openid
        })
        .get()

      const orderCounts = {
        unpaid: 0,
        undelivered: 0,
        delivered: 0,
        completed: 0
      }

      data.forEach(order => {
        switch(order.status) {
          case 'unpaid':
            orderCounts.unpaid++
            break
          case 'undelivered':
            orderCounts.undelivered++
            break
          case 'delivered':
            orderCounts.delivered++
            break
          case 'completed':
            orderCounts.completed++
            break
        }
      })

      this.setData({ orderCounts })
    } catch (error) {
      console.error('获取订单数量失败：', error)
    }
  },

  // 导航到订单页面
  navigateToOrders(e) {
    // 检查登录状态，如果未登录则跳转到登录页
    if (!getApp().globalData.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }
    const type = e.currentTarget.dataset.type
    wx.navigateTo({
      url: `/pages/orders/orders?type=${type}`
    })
  },

  // 导航到收货地址页面
  navigateToAddress() {
    // 检查登录状态，如果未登录则跳转到登录页
    if (!getApp().globalData.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/address/address'
    })
  },

  // 导航到登录页面
  navigateToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    })
  },

  // 联系客服
  contactService() {
    this.showFeatureNotAvailable()
  },

  // 导航到关于我们页面
  navigateToAbout() {
    wx.navigateTo({
      url: '/pages/about/about'
    })
  },

  // 导航到设置页面
  navigateToSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    })
  },

  // 显示功能未开放提示
  showFeatureNotAvailable() {
    wx.showToast({
      title: '功能暂未开放',
      icon: 'none',
      duration: 2000
    })
  },

  // 处理退出登录
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除登录信息
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          wx.removeStorageSync('openid')
          
          // 更新全局和页面状态
          const app = getApp()
          app.globalData.isLoggedIn = false
          app.globalData.userInfo = null
          app.globalData.openid = null

          this.setData({
            isLoggedIn: false,
            userInfo: null,
            orderCounts: {
              unpaid: 0,
              undelivered: 0,
              delivered: 0,
              completed: 0
            }
          })

          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
          // 退出登录后跳转到登录页面
          wx.reLaunch({
            url: '/pages/login/login'
          })
        }
      }
    })
  },

  handleScanCode() {
    this.showFeatureNotAvailable()
  },

  navigateToAdmin() {
    wx.navigateTo({
      url: '/pages/admin/admin'
    })
  },

  handleEditNickname() {
    // 检查登录状态
    if (!getApp().globalData.isLoggedIn || !getApp().globalData.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }

    console.log('当前用户信息:', {
      openid: getApp().globalData.openid,
      userInfo: getApp().globalData.userInfo
    })

    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入新的昵称',
      content: getApp().globalData.userInfo.nickName,
      success: async (res) => {
        if (res.confirm && res.content.trim()) {
          const newNickname = res.content.trim()
          
          try {
            // 更新云数据库中的用户信息
            const updateResult = await wx.cloud.callFunction({
              name: 'updateUserInfo',
              data: {
                userInfo: {
                  nickName: newNickname
                }
              }
            })

            if (!updateResult.result.success) {
              throw new Error('更新用户信息失败')
            }

            // 更新本地存储的用户信息
            const userInfo = wx.getStorageSync('userInfo')
            const updatedUserInfo = {
              ...userInfo,
              nickName: newNickname
            }
            wx.setStorageSync('userInfo', updatedUserInfo)
            getApp().globalData.userInfo = updatedUserInfo

            // 更新页面显示
            this.setData({
              'userInfo.nickName': newNickname
            })

            wx.showToast({
              title: '昵称修改成功',
              icon: 'success'
            })
          } catch (error) {
            console.error('修改昵称失败：', error)
            wx.showToast({
              title: '修改失败，请重试',
              icon: 'error'
            })
          }
        }
      }
    })
  }
})
Page({
  data: {
    notifications: true
  },

  onLoad() {
    // 从本地存储加载设置
    const notifications = wx.getStorageSync('notifications')
    if (notifications !== '') {
      this.setData({ notifications })
    }
  },

  // 切换通知设置
  toggleNotifications(e) {
    const notifications = e.detail.value
    this.setData({ notifications })
    wx.setStorageSync('notifications', notifications)
  },

  // 导航到管理员登录页面
  navigateToAdminLogin() {
    wx.navigateTo({
      url: '/pages/adminLogin/adminLogin'
    })
  },

  // 显示功能未开放提示
  showFeatureNotAvailable() {
    wx.showToast({
      title: '功能暂未开放',
      icon: 'none'
    })
  },

  // 初始化管理员账号
  async initAdminUser() {
    try {
      wx.showLoading({
        title: '初始化中...',
        mask: true
      })

      console.log('开始调用initAdminUser云函数...')
      const { result } = await wx.cloud.callFunction({
        name: 'initAdminUser'
      })
      console.log('云函数调用结果：', result)

      wx.hideLoading()

      if (result.code === 200) {
        // 显示成功提示，并清晰地展示账号信息
        wx.showModal({
          title: '初始化成功',
          content: '管理员账号已创建：\n\n账号：admin\n密码：admin123\n\n请记住这些信息！',
          showCancel: false,
          success: (res) => {
            if (res.confirm) {
              // 可以选择直接跳转到登录页面
              wx.navigateTo({
                url: '/pages/adminLogin/adminLogin'
              })
            }
          }
        })
      } else {
        // 显示具体的错误信息
        wx.showModal({
          title: '初始化失败',
          content: result.msg || '创建管理员账号失败，请重试',
          showCancel: false
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('初始化管理员账号失败：', error)
      // 显示详细的错误信息
      wx.showModal({
        title: '系统错误',
        content: '初始化失败：' + (error.message || '未知错误'),
        showCancel: false
      })
    }
  }
}) 
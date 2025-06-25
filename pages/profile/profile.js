Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    openid: '',
    defaultAvatarUrl: 'cloud://cloud1-2g5ar9yr97b49f2f.636c-cloud1-2g5ar9yr97b49f2f-1361317451/default/default-avatar.png',
    orderCounts: {
      unpaid: 0,
      undelivered: 0,
      delivered: 0,
      completed: 0
    },
    isLoggingIn: false,
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    avatarUrl: '',
    nickname: ''
  },

  onLoad() {
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
    this.checkLoginStatus()
  },

  onShow() {
    this.checkLoginStatus()
  },

  checkLoginStatus() {
    try {
      const openid = wx.getStorageSync('openid')
      const userInfo = wx.getStorageSync('userInfo')
      
      console.log('检查登录状态:', { openid, userInfo })
      
      if (openid && userInfo) {
        // 处理头像
        const avatarUrl = userInfo.avatarUrl || this.data.defaultAvatarUrl
        console.log('头像URL:', avatarUrl)
        const processedUserInfo = {
          ...userInfo,
          avatarUrl: avatarUrl
        }

        this.setData({
          isLoggedIn: true,
          userInfo: processedUserInfo,
          openid,
          hasUserInfo: true
        })
        
        // 获取订单数量
        this.getOrderCounts()
      } else {
        this.setData({
          isLoggedIn: false,
          userInfo: null,
          openid: '',
          hasUserInfo: false
        })
      }
    } catch (error) {
      console.error('检查登录状态失败：', error)
      this.setData({
        isLoggedIn: false,
        userInfo: null,
        openid: '',
        hasUserInfo: false
      })
    }
  },

  // 选择头像事件处理
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail 
    this.setData({ avatarUrl })
  },

  // 昵称输入事件处理
  onNicknameBlur(e) {
    const { value } = e.detail
    this.setData({ nickname: value.trim() })
  },

  // 获取用户信息
  async getUserProfile(e) {
    // 检查是否已选择头像和输入昵称
    if (!this.data.avatarUrl || !this.data.nickname) {
      wx.showToast({
        title: '请先选择头像并输入昵称',
        icon: 'none'
      })
      this.setData({ isLoggingIn: false })
      return
    }
    
    this.setData({ isLoggingIn: true })
    
    try {
      const loginRes = await wx.login()
      const result = await wx.cloud.callFunction({
        name: 'login',
        data: {
          code: loginRes.code,
          userInfo: {
            avatarUrl: this.data.avatarUrl,
            nickName: this.data.nickname
          }
        }
      })
      
      if (result) {
        wx.setStorageSync('userInfo', e.detail.userInfo)
        wx.setStorageSync('openid', result.result.openid)
        this.setData({
          isLoggedIn: true,
          userInfo: e.detail.userInfo,
          hasUserInfo: true
        })
      }
    } catch (error) {
      console.error('登录失败:', error)
    } finally {
      this.setData({ isLoggingIn: false })
    }
  },

  // 检查登录状态并执行操作
  checkLoginAndExecute(callback) {
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先选择头像并输入昵称',
        icon: 'none'
      })
      return false
    }
    callback && callback()
    return true
  },

  // 获取各订单状态的数量
  async getOrderCounts() {
    if (!this.data.openid) return
    
    try {
      const db = wx.cloud.database()
      const { data } = await db.collection('orders')
        .where({
          _openid: this.data.openid
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
    this.checkLoginAndExecute(() => {
      const type = e.currentTarget.dataset.type
      wx.navigateTo({
        url: `/pages/orders/orders?type=${type}`
      })
    })
  },

  // 导航到收货地址页面
  navigateToAddress() {
    this.checkLoginAndExecute(() => {
      wx.navigateTo({
        url: '/pages/address/address'
      })
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
          wx.removeStorageSync('openid')
          wx.removeStorageSync('userInfo')
          
          this.setData({
            isLoggedIn: false,
            userInfo: null,
            openid: '',
            hasUserInfo: false,
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
    if (!this.data.isLoggedIn || !this.data.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    console.log('当前用户信息:', {
      openid: this.data.openid,
      userInfo: this.data.userInfo
    })

    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入新的昵称',
      content: this.data.userInfo.nickName,
      success: async (res) => {
        if (res.confirm && res.content.trim()) {
          const newNickname = res.content.trim()
          
          try {
            // 更新云数据库中的用户信息
            const db = wx.cloud.database()
            const userResult = await db.collection('users').where({
              _openid: this.data.openid
            }).get()

            console.log('查询用户结果:', userResult)

            if (userResult.data.length === 0) {
              throw new Error('未找到用户记录')
            }

            const updateResult = await db.collection('users').doc(userResult.data[0]._id).update({
              data: {
                nickName: newNickname,
                updateTime: db.serverDate()
              }
            })

            console.log('更新结果:', updateResult)

            // 更新本地存储的用户信息
            const userInfo = wx.getStorageSync('userInfo')
            const updatedUserInfo = {
              ...userInfo,
              nickName: newNickname
            }
            wx.setStorageSync('userInfo', updatedUserInfo)

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
  },

  navigateToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    })
  }
})
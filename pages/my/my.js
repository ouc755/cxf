Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    openid: ''
  },

  onLoad() {
    // 检查登录状态
    const openid = wx.getStorageSync('openid')
    const userInfo = wx.getStorageSync('userInfo')
    if (openid && userInfo) {
      this.setData({
        isLoggedIn: true,
        userInfo,
        openid
      })
    }
  },

  onShow() {
    this.checkLoginStatus()
  },

  checkLoginStatus() {
    try {
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo) {
        this.setData({
          isLoggedIn: true,
          userInfo
        })
      }
    } catch (error) {
      console.error('检查登录状态失败：', error)
    }
  },

  handleLogin() {
    // 显示加载提示
    wx.showLoading({
      title: '登录中...',
      mask: true
    })

    // 1. 先调用 wx.login 获取 code
    wx.login({
      success: (res) => {
        if (res.code) {
          console.log('获取code成功：', res.code)
          
          // 2. 获取用户信息
          wx.getUserProfile({
            desc: '用于完善会员资料',
            success: (profileRes) => {
              console.log('获取用户信息成功：', profileRes.userInfo)

              // 3. 调用云函数登录，将code和用户信息一起传给云函数
              wx.cloud.callFunction({
                name: 'login',
                data: {
                  code: res.code,
                  userInfo: profileRes.userInfo
                },
                success: (loginRes) => {
                  console.log('云函数登录成功：', loginRes.result)
                  if (loginRes.result.success) {
                    const { openid } = loginRes.result.data
                    const userInfo = profileRes.userInfo

                    // 存储登录信息
                    wx.setStorageSync('openid', openid)
                    wx.setStorageSync('userInfo', userInfo)

                    this.setData({
                      isLoggedIn: true,
                      userInfo,
                      openid
                    })

                    wx.showToast({
                      title: '登录成功',
                      icon: 'success'
                    })
                  } else {
                    throw new Error(loginRes.result.error || '登录失败')
                  }
                },
                fail: (err) => {
                  console.error('云函数调用失败：', err)
                  wx.showToast({
                    title: '登录失败',
                    icon: 'none'
                  })
                }
              })
            },
            fail: (err) => {
              console.log('获取用户信息失败：', err)
              if (err.errMsg.includes('deny')) {
                wx.showToast({
                  title: '需要您的授权才能登录',
                  icon: 'none'
                })
              } else {
                wx.showToast({
                  title: '登录失败',
                  icon: 'none'
                })
              }
            }
          })
        } else {
          console.error('获取code失败：', res.errMsg)
          wx.showToast({
            title: '登录失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.error('wx.login 调用失败：', err)
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  handleLogout() {
    // 清除存储的用户信息
    wx.removeStorageSync('openid')
    wx.removeStorageSync('userInfo')
    
    // 更新页面状态
    this.setData({
      isLoggedIn: false,
      userInfo: null,
      openid: ''
    })

    wx.showToast({
      title: '已退出登录',
      icon: 'success'
    })
  }
}) 
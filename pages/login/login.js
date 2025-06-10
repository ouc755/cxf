const app = getApp()

Page({
  data: {
    isLoggingIn: false
  },

  onLoad() {
    // 页面加载时检查是否已登录
    const userInfo = wx.getStorageSync('userInfo')
    const openid = wx.getStorageSync('openid')
    if (userInfo && openid) {
      // 已登录，跳转到主页
      wx.switchTab({
        url: '/pages/index/index'
      })
    }
  },

  // 获取用户信息并登录
  getUserProfile() {
    if (this.data.isLoggingIn) return

    this.setData({ isLoggingIn: true })

    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        console.log('获取用户信息成功：', res)
        const userInfo = res.userInfo
        
        // 执行登录
        wx.login({
          success: (loginRes) => {
            if (loginRes.code) {
              // 调用云函数登录
              wx.cloud.callFunction({
                name: 'login',
                data: {
                  code: loginRes.code,
                  userInfo: userInfo  // 传递完整的用户信息
                },
                success: (result) => {
                  console.log('云函数登录成功：', result)
                  
                  if (result.result && result.result.openid) {
                    const { openid, token, userId } = result.result
                    // 保存用户信息
                    wx.setStorageSync('userInfo', userInfo)
                    wx.setStorageSync('openid', openid)
                    wx.setStorageSync('token', token)
                    wx.setStorageSync('userId', userId)

                    wx.showToast({
                      title: '登录成功',
                      icon: 'success',
                      duration: 1500
                    })

                    // 延迟跳转到主页面
                    setTimeout(() => {
                      wx.switchTab({
                        url: '/pages/index/index'
                      })
                    }, 1500)
                  }
                },
                fail: (err) => {
                  console.error('云函数登录失败：', err)
                  wx.showToast({
                    title: '登录失败',
                    icon: 'none'
                  })
                }
              })
            }
          },
          fail: (err) => {
            console.error('wx.login 调用失败：', err)
            wx.showToast({
              title: '登录失败，请重试',
              icon: 'none'
            })
          }
        })
      },
      fail: (err) => {
        console.error('获取用户信息失败：', err)
        wx.showToast({
          title: '需要您的授权才能继续',
          icon: 'none'
        })
      },
      complete: () => {
        this.setData({ isLoggingIn: false })
      }
    })
  },

  // 获取手机号
  async getPhoneNumber(e) {
    if (e.detail.errMsg !== "getPhoneNumber:ok") {
      wx.showToast({
        title: '获取手机号失败',
        icon: 'none'
      })
      return
    }

    try {
      const result = await app.updateUserInfo({
        phoneNumber: e.detail.code // 使用手机号获取凭证
      })

      if (result) {
        wx.showToast({
          title: '手机号更新成功',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: '手机号更新失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('Update phone number failed:', error)
      wx.showToast({
        title: '手机号更新失败',
        icon: 'none'
      })
    }
  }
}) 
Page({
  data: {
    username: '',
    password: '',
    loading: false
  },

  onUsernameInput(e) {
    this.setData({
      username: e.detail.value
    })
  },

  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    })
  },

  async handleLogin() {
    const { username, password } = this.data

    if (!username || !password) {
      wx.showToast({
        title: '请输入用户名和密码',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })

    try {
      console.log('开始调用adminLogin云函数...')
      const { result } = await wx.cloud.callFunction({
        name: 'adminLogin',
        data: {
          username,
          password
        }
      })
      console.log('云函数返回结果：', result)

      if (result.success) {
        // 设置全局登录状态
        const app = getApp()
        if (typeof app.setAdminLogin === 'function') {
          app.setAdminLogin(result.data.username)
        } else {
          console.error('app.setAdminLogin is not a function')
        }
        
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })
        
        // 使用redirectTo而不是navigateTo，防止返回到登录页
        setTimeout(() => {
          wx.redirectTo({
            url: '/pages/admin/admin',
            success: () => {
              console.log('页面跳转成功')
            },
            fail: (error) => {
              console.error('页面跳转失败：', error)
              // 如果跳转失败，尝试跳转到其他管理页面
              wx.redirectTo({
                url: '/pages/addProduct/addProduct'
              })
            }
          })
        }, 1500)
      } else {
        console.error('登录失败，返回结果：', result)
        wx.showToast({
          title: result.error || '登录失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('管理员登录失败：', error)
      wx.showToast({
        title: error.message || '登录失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  }
}) 
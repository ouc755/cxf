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
      const { result } = await wx.cloud.callFunction({
        name: 'adminLogin',
        data: {
          username,
          password
        }
      })

      if (result.code === 200) {
        // 设置全局登录状态
        const app = getApp()
        app.setAdminLogin(result.data.username)
        
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })
        
        // 使用redirectTo而不是navigateTo，防止返回到登录页
        setTimeout(() => {
          wx.redirectTo({
            url: '/pages/admin/admin'
          })
        }, 1500)
      } else {
        wx.showToast({
          title: result.msg || '登录失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('管理员登录失败：', error)
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  }
}) 
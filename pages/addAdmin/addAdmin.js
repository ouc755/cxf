Page({
  data: {
    wechatId: 'OY0808OT',  // 预设的微信号
    result: ''
  },

  onLoad() {
    this.addAdmin()
  },

  async addAdmin() {
    try {
      wx.showLoading({
        title: '添加管理员...',
      })

      const { result } = await wx.cloud.callFunction({
        name: 'addAdmin',
        data: {
          wechatId: this.data.wechatId
        }
      })

      if (result.code === 0) {
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        })
        
        // 延迟返回上一页
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({
          title: result.msg || '添加失败',
          icon: 'none'
        })
      }

      this.setData({
        result: JSON.stringify(result, null, 2)
      })
    } catch (error) {
      console.error('[添加管理员失败]', error)
      wx.showToast({
        title: '系统错误，请重试',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  }
}) 
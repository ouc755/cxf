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

  // 导航到管理员登录
  navigateToAdminLogin() {
    console.log('点击了管理员登录按钮');
    wx.navigateTo({
      url: '/pages/adminLogin/adminLogin',
      success: function() {
        console.log('跳转成功');
      },
      fail: function(error) {
        console.error('跳转失败:', error);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 显示功能未开放提示
  showFeatureNotAvailable() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 生成小程序码
  async generateQRCode() {
    console.log('开始生成小程序码...')
    wx.showLoading({
      title: '生成中...',
      mask: true
    })

    try {
      // 检查云开发是否初始化
      if (!wx.cloud) {
        throw new Error('请使用 2.2.3 或以上的基础库以使用云能力')
      }

      // 调用云函数生成小程序码
      console.log('调用云函数 getWXACode...')
      const { result } = await wx.cloud.callFunction({
        name: 'getWXACode',
        data: {
          scene: 'fromSettings',
          timestamp: Date.now() // 添加时间戳避免缓存
        }
      })

      console.log('云函数返回结果：', result)

      if (!result) {
        throw new Error('云函数返回结果为空')
      }

      if (!result.success) {
        throw new Error(result.error || '生成小程序码失败')
      }

      if (!result.fileID) {
        throw new Error('未获取到文件ID')
      }

      // 下载小程序码图片
      console.log('开始下载小程序码图片...')
      const { tempFilePath } = await wx.cloud.downloadFile({
        fileID: result.fileID
      })

      if (!tempFilePath) {
        throw new Error('下载小程序码失败')
      }

      console.log('小程序码下载成功，临时路径：', tempFilePath)

      // 更新UI显示
      this.setData({
        qrcodeUrl: tempFilePath
      })

      // 保存到相册
      console.log('准备保存到相册...')
      await new Promise((resolve, reject) => {
        wx.saveImageToPhotosAlbum({
          filePath: tempFilePath,
          success: (res) => {
            console.log('保存到相册成功：', res)
            resolve(res)
          },
          fail: (err) => {
            console.error('保存到相册失败：', err)
            if (err.errMsg.includes('auth deny')) {
              reject(new Error('没有保存到相册的权限，请在设置中允许访问相册'))
            } else {
              reject(new Error('保存到相册失败：' + err.errMsg))
            }
          }
        })
      })

      // 显示成功提示
      wx.showToast({
        title: '已保存到相册',
        icon: 'success',
        duration: 2000
      })

    } catch (err) {
      console.error('生成小程序码过程出错：', err)
      // 显示错误提示
      wx.showModal({
        title: '生成失败',
        content: err.message || '未知错误',
        showCancel: false
      })
    } finally {
      wx.hideLoading()
    }
  }
}) 
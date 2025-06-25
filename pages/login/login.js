// pages/login/login.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    defaultAvatarUrl: 'cloud://cloud1-2g5ar9yr97b49f2f.636c-cloud1-2g5ar9yr97b49f2f-1361317451/default/default-avatar.png',
    logoUrl: 'cloud://cloud1-2g5ar9yr97b49f2f.636c-cloud1-2g5ar9yr97b49f2f-1361317451/images/logo.png',
    isLoggingIn: false,
    avatarUrl: '',
    nickname: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 登录页面不需要在onLoad时检查登录状态
    // 登录状态的检查由app.js统一管理
    console.log('登录页面加载')
    
    // 初始化云开发
    if (!wx.cloud) {
      wx.redirectTo({
        url: '../chooseLib/chooseLib',
      })
      return
    }
    
    wx.cloud.init({
      env: 'cloud1-2g5ar9yr97b49f2f',
      traceUser: true
    })

    // 获取图片的临时链接
    this.getImageUrls()
  },

  // 获取图片的临时链接
  getImageUrls: function() {
    const imageUrls = [
      this.data.logoUrl,
      this.data.defaultAvatarUrl
    ].filter(url => url && url.startsWith('cloud://'))

    if (imageUrls.length === 0) {
      console.log('[getImageUrls] 没有需要转换的云存储图片')
      return
    }

    wx.cloud.getTempFileURL({
      fileList: imageUrls
    }).then(res => {
      console.log('[getImageUrls] 获取临时链接结果:', res)
      
      const updatedData = {}
      
      if (res.fileList && res.fileList.length > 0) {
        res.fileList.forEach(file => {
          if (file.fileID === this.data.logoUrl && file.tempFileURL) {
            updatedData.logoUrl = file.tempFileURL
            console.log('[getImageUrls] 更新 logoUrl:', file.tempFileURL)
          }
          if (file.fileID === this.data.defaultAvatarUrl && file.tempFileURL) {
            updatedData.defaultAvatarUrl = file.tempFileURL
            console.log('[getImageUrls] 更新 defaultAvatarUrl:', file.tempFileURL)
          }
        })
      }

      if (Object.keys(updatedData).length > 0) {
        this.setData(updatedData)
      }
    }).catch(err => {
      console.error('[getImageUrls] 获取图片临时链接失败:', err)
    })
  },

  // 图片加载失败的处理函数
  onImageError: function(e) {
    console.error('图片加载失败触发 onImageError：', e)
    const type = e.currentTarget.dataset.type // 'logo' 或 'avatar'
    const cloudDefaultImage = 'cloud://cloud1-2g5ar9yr97b49f2f.636c-cloud1-2g5ar9yr97b49f2f-1361317451/default/default.png'

    wx.cloud.getTempFileURL({
      fileList: [cloudDefaultImage]
    }).then(res => {
      if (res.fileList && res.fileList[0] && res.fileList[0].tempFileURL) {
        const tempDefaultImageUrl = res.fileList[0].tempFileURL
        if (type === 'logo') {
          this.setData({ logoUrl: tempDefaultImageUrl })
        } else if (type === 'avatar') {
          this.setData({ defaultAvatarUrl: tempDefaultImageUrl })
        }
      } else {
        console.error('[onImageError] 获取云端默认图片临时链接失败:', JSON.stringify(res))
      }
    }).catch(err => {
      console.error('[onImageError] 获取云端默认图片临时链接异常:', err)
    })
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

  },

  // 处理头像选择
  async onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    try {
      // 将临时文件上传到云存储
      const cloudPath = `avatars/${Date.now()}-${Math.random().toString(36).substr(2)}.jpg`
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath,
        filePath: avatarUrl
      })

      if (!uploadResult.fileID) {
        throw new Error('上传头像失败')
      }

      // 更新页面显示
      this.setData({
        avatarUrl: uploadResult.fileID
      })
    } catch (error) {
      console.error('处理头像失败:', error)
      wx.showToast({
        title: '头像上传失败',
        icon: 'none'
      })
    }
  },

  // 处理昵称输入
  onNicknameBlur(e) {
    this.setData({
      nickname: e.detail.value
    })
  },

  // 获取用户信息并登录
  async handleLogin() {
    if (this.data.isLoggingIn) return
    
    // 新增：登录前校验
    if (!this.data.nickname || !this.data.avatarUrl) {
      wx.showToast({ title: '请填写昵称并选择头像', icon: 'none' })
      return
    }

    this.setData({ isLoggingIn: true })
    
    try {
      // 1. 调用微信登录
      console.log('Login: 开始调用wx.login()...')
      const { code } = await wx.login()
      console.log('Login: wx.login() 返回 code:', code)
      
      // 2. 调用云函数登录
      console.log('Login: 开始调用云函数 login...')
      const loginResult = await wx.cloud.callFunction({
        name: 'login',
        data: { 
          code,
          userInfo: {
            nickName: this.data.nickname,
            avatarUrl: this.data.avatarUrl
          }
        }
      })

      console.log('Login: 云函数 login 返回结果:', loginResult)

      if (!loginResult.result.success) {
        throw new Error('登录失败')
      }

      // 3. 保存token和userInfo到本地
      wx.setStorageSync('token', loginResult.result.data.token)
      wx.setStorageSync('openid', loginResult.result.data.openid)
      wx.setStorageSync('userInfo', loginResult.result.data.userInfo)
      console.log('login.js 登录成功后本地token:', wx.getStorageSync('token'))
      // 4. 更新全局登录状态
      getApp().globalData.isLoggedIn = true
      getApp().globalData.userInfo = loginResult.result.data.userInfo
      getApp().globalData.openid = loginResult.result.data.openid
      console.log('Login: 全局globalData更新完成。isLoggedIn:', getApp().globalData.isLoggedIn, 'userInfo:', getApp().globalData.userInfo, 'openid:', getApp().globalData.openid)
      // 5. 跳转到个人中心页面
      wx.reLaunch({
        url: '/pages/profile/profile'
      })
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })

    } catch (error) {
      console.error('登录失败:', error)
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      })
      this.setData({ isLoggingIn: false })
    }
  }
})
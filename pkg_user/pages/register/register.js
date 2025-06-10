// pages/register/register.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    username: '', // 新增 username
    email: '',    // 新增 email
    // phone: '', // 暂时注释手机号
    // code: '', // 暂时注释验证码
    password: '',
    confirmPassword: '',
    loading: false
    // countdown: 0, // 暂时注释倒计时
    // canSendCode: true // 暂时注释发送验证码状态
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

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

  // 输入用户名
  onUsernameInput(e) {
    this.setData({ username: e.detail.value });
  },

  // 输入邮箱
  onEmailInput(e) {
    this.setData({ email: e.detail.value });
  },

  // 输入手机号
  // onPhoneInput(e) {
  //   this.setData({ 
  //     phone: e.detail.value,
  //     canSendCode: /^1[3-9]\d{9}$/.test(e.detail.value)
  //   });
  // },

  // 输入验证码
  // onCodeInput(e) {
  //   this.setData({ code: e.detail.value });
  // },

  // 输入密码
  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  // 输入确认密码
  onConfirmPasswordInput(e) {
    this.setData({ confirmPassword: e.detail.value });
  },

  // 发送验证码
  // sendCode() {
  //   if (!this.data.canSendCode || this.data.countdown > 0) return;

  //   const { phone } = this.data;
  //   if (!/^1[3-9]\d{9}$/.test(phone)) {
  //     wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
  //     return;
  //   }

  //   // 发送验证码请求
  //   wx.request({
  //     url: `${getApp().globalData.baseUrl}/api/auth/sendCode`,
  //     method: 'POST',
  //     data: { phone },
  //     success: (res) => {
  //       if (res.statusCode === 200) {
  //         wx.showToast({ title: '验证码已发送', icon: 'success' });
  //         // 开始倒计时
  //         this.setData({ countdown: 60 });
  //         this.startCountdown();
  //       } else {
  //         wx.showToast({ title: res.data.msg || '发送失败', icon: 'none' });
  //       }
  //     },
  //     fail: () => {
  //       wx.showToast({ title: '网络请求失败', icon: 'none' });
  //     }
  //   });
  // },

  // 倒计时
  // startCountdown() {
  //   const timer = setInterval(() => {
  //     if (this.data.countdown <= 1) {
  //       clearInterval(timer);
  //       this.setData({ 
  //         countdown: 0,
  //         canSendCode: /^1[3-9]\d{9}$/.test(this.data.phone)
  //       });
  //     } else {
  //       this.setData({ countdown: this.data.countdown - 1 });
  //     }
  //   }, 1000);
  // },

  // 验证表单
  validateForm() {
    const { username, email, /*phone, code,*/ password, confirmPassword } = this.data; // 暂时注释 phone 和 code

    if (!username) {
      wx.showToast({ title: '请输入用户名', icon: 'none' });
      return false;
    }
    // 简单的邮箱格式校验，您可以根据需要替换为更复杂的正则表达式
    if (!email || !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(email)) {
      wx.showToast({ title: '请输入有效的邮箱地址', icon: 'none' });
      return false;
    }
    
    // if (!phone) { // 暂时注释手机号校验
    //   wx.showToast({ title: '请输入手机号', icon: 'none' });
    //   return false;
    // }
    // if (!/^1[3-9]\d{9}$/.test(phone)) {
    //   wx.showToast({ title: '手机号格式错误', icon: 'none' });
    //   return false;
    // }
    // if (!code) { // 暂时注释验证码校验
    //   wx.showToast({ title: '请输入验证码', icon: 'none' });
    //   return false;
    // }
    // if (!/^\d{6}$/.test(code)) { // 注意这里原先的正则表达式是 /^d{6}$/，应该是 /^\d{6}$/
    //   wx.showToast({ title: '验证码格式错误', icon: 'none' });
    //   return false;
    // }
    if (!password) {
      wx.showToast({ title: '请设置密码', icon: 'none' });
      return false;
    }
    if (password.length < 6) {
      wx.showToast({ title: '密码不能少于6位', icon: 'none' });
      return false;
    }
    if (password !== confirmPassword) {
      wx.showToast({ title: '两次密码输入不一致', icon: 'none' });
      return false;
    }
    return true;
  },

  // 注册
  handleRegister() {
    if (!this.validateForm()) return;

    this.setData({ loading: true });
    wx.showLoading({ title: '注册中...' });

    wx.request({
      url: `${getApp().globalData.baseUrl}/api/auth/register`,
      method: 'POST',
      data: {
        username: this.data.username, // 添加 username
        email: this.data.email,       // 添加 email
        // phone: this.data.phone, // 暂时注释手机号
        // code: this.data.code, // 后端注册接口目前不处理code，暂时注释，如果需要请取消注释并确保后端同步修改
        password: this.data.password
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const { token, userInfo } = res.data;
          getApp().setUserInfo(token, userInfo);
          wx.showToast({
            title: '注册成功',
            icon: 'success',
            duration: 1500,
            success: () => {
              wx.reLaunch({ url: '/pages/index/index' });
            }
          });
        } else {
          wx.showToast({
            title: res.data.msg || '注册失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ loading: false });
        wx.hideLoading();
      }
    });
  },

  // 跳转到登录页面
  goToLogin() {
    wx.navigateBack();
  },

  // 跳转到用户协议页面
  goToUserAgreement() {
    wx.navigateTo({
      url: '/pages/agreement/user'
    });
  },

  // 跳转到隐私政策页面
  goToPrivacyPolicy() {
    wx.navigateTo({
      url: '/pages/agreement/privacy'
    });
  }
})
Page({
  data: {
    form: {
      receiver: '',
      contact: '',
      province: '',
      city: '',
      district: '',
      detail: '',
      isDefault: false
    },
    type: 'add',
    addressId: ''
  },

  updateReceiver(e) {
    this.setData({ 'form.receiver': e.detail.value });
  },

  updateContact(e) {
    this.setData({ 'form.contact': e.detail.value });
  },

  regionChange(e) {
    const [province, city, district] = e.detail.value;
    this.setData({
      'form.province': province,
      'form.city': city,
      'form.district': district
    });
  },

  updateDetail(e) {
    this.setData({ 'form.detail': e.detail.value });
  },

  toggleDefault() {
    this.setData({ 'form.isDefault': !this.data.form.isDefault });
  },

  validateForm() {
    const { receiver, contact, province, detail } = this.data.form;
    if (!receiver) {
      wx.showToast({ title: '请填写收货人', icon: 'none' });
      return false;
    }
    if (!/^1[3-9]\d{9}$/.test(contact)) {
      wx.showToast({ title: '手机号格式错误', icon: 'none' });
      return false;
    }
    if (!province) {
      wx.showToast({ title: '请选择所在地区', icon: 'none' });
      return false;
    }
    if (!detail) {
      wx.showToast({ title: '请填写详细地址', icon: 'none' });
      return false;
    }
    return true;
  },

  saveAddress() {
    if (!this.validateForm()) return;

    wx.showLoading({ title: '提交中' });
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      wx.hideLoading();
      return;
    }

    const apiUrl = this.data.type === 'add' 
      ? `${getApp().globalData.baseUrl}/api/addresses`
      : `${getApp().globalData.baseUrl}/api/addresses/${this.data.addressId}`;

    wx.request({
      url: apiUrl,
      method: this.data.type === 'add' ? 'POST' : 'PUT',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      data: this.data.form,
      success: (res) => {
        if (res.statusCode === 201 || res.statusCode === 200) {
          wx.showToast({ title: '保存成功' });
          const pages = getCurrentPages();
          const prevPage = pages[pages.length - 2];
          prevPage.getAddressList();
          wx.navigateBack();
        } else {
          wx.showToast({ title: res.data.msg || '保存失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络请求失败', icon: 'none' });
      },
      complete: () => wx.hideLoading()
    });
  },

  onLoad(options) {
    if (options.type === 'edit' && options.id) {
      this.setData({
        type: 'edit',
        addressId: options.id
      });
      this.loadAddressDetail(options.id);
    }
  },

  loadAddressDetail(id) {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '加载中' });
    wx.request({
      url: `${getApp().globalData.baseUrl}/api/addresses/${id}`,
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({ form: res.data });
        } else {
          wx.showToast({ title: '加载失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络请求失败', icon: 'none' });
      },
      complete: () => wx.hideLoading()
    });
  }
});
Page({
  data: {
    addressList: []
  },

  addAddress() {
    wx.navigateTo({
      url: '/pages/address/edit/edit'
    })
  },

  onLoad() {
    this.getAddressList();
  },

  getAddressList() {
    wx.showLoading({title: '加载中'});
    wx.request({
      url: 'http://localhost:5000/api/addresses/list',
      success: (res) => {
        if(res.data.code === 200) {
          this.setData({addressList: res.data.data})
        }
      },
      fail: () => {
        // 已移除错误提示
      },
      complete: () => wx.hideLoading()
    })
  },

  addAddress() {
    wx.navigateTo({
      url: '/pages/address/edit/edit?type=add'
    });
  },

  editAddress(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/address/edit/edit?type=edit&id=${id}`
    });
  },

  deleteAddress(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该地址吗？',
      success: (res) => {
        if (res.confirm) {
          // 对接后需替换为真实接口
          const newList = this.data.addressList.filter(item => item.id !== id);
          this.setData({ addressList: newList });
          wx.showToast({ title: '删除成功' });
        }
      }
    });
  }
});
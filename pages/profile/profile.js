Page({
  data: {
    userInfo: {
      avatar: '/images/exbi.png',
      nickname: '玩具收藏家',
      memberLevel: '黄金会员'
    },
    orders: require('../../utils/toyData.js').orderList
  },
  onLoad() {
    const { toyList } = require('../../utils/toyData.js');
    this.setData({ toysList: toyList });
  },
  viewOrderDetail(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/orderDetail/orderDetail?orderId=${orderId}`
    });
  },
  navigateToMyOrders() {
    wx.navigateTo({
      url: '/pages/orderDetail/orderDetail'
    });
  }
})
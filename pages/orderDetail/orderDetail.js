Page({
  data: {
    order: {}
  },

  onLoad(options) {
    const orderId = options.orderId;
    const orders = require('../../utils/toyData.js').orderList;
    const currentOrder = orders.find(order => order.id === parseInt(orderId));
    
    if (currentOrder) {
      this.setData({
        order: currentOrder
      });
    } else {
      wx.showToast({
        title: '订单不存在',
        icon: 'none'
      });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  }
})
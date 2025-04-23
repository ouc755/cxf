Page({
  data: {
    currentTab: 0,
    toysList: require('../../utils/toyData.js').toyList
  },
  switchTab(e) {
    const index = e.currentTarget.dataset.index;
    const urls = ['pages/index/index', 'pages/orderDetail/orderDetail', 'pages/profile/profile'];
    const currentPage = getCurrentPages().pop().route;
    
    if (currentPage !== urls[index]) {
      wx.switchTab({
        url: urls[index]
      });
    }
  },

  onLoad() {
    // 数据已通过require初始化
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  switchToIndex() {
    wx.switchTab({
      url: 'pages/index/index'
    })
  },

  switchToProfile() {
    wx.switchTab({
      url: 'pages/profile/profile'
    })
  }
})
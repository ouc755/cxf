Page({
  data: {
    toy: null,
    selectedSize: ''
  },
  onLoad(options) {
    const { toyList } = require('../../utils/toyData.js');
    const toy = toyList.find(t => t.id === parseInt(options.id));
    if (toy) {
      this.setData({ toy });
    } else {
      console.error('未找到对应的玩具信息', options.id);
    }
  },
  selectSize(e) {
    const size = e.currentTarget.dataset.size;
    this.setData({ selectedSize: size });
  }
});
const auth = require('../../utils/auth.js');

Page({
  data: {
    categoryId: null,
    categoryName: '',
    products: [],
    loading: true,
    loadingImageUrl: 'cloud://cloud1-2g5ar9yr97b49f2f.636c-cloud1-2g5ar9yr97b49f2f-1361317451/icons/loading.gif',
    emptyImageUrl: 'cloud://cloud1-2g5ar9yr97b49f2f.636c-cloud1-2g5ar9yr97b49f2f-1361317451/icons/empty.png'
  },

  onLoad: function(options) {
    const { id, name } = options;
    
    this.setData({
      categoryId: id,
      categoryName: name || '分类商品'
    });

    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: this.data.categoryName
    });

    // 获取图标的临时访问链接
    this.getIconUrls();

    // 获取上一页传递的商品数据
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('acceptProductsData', (data) => {
      if (data && data.products) {
        this.setData({
          products: data.products,
          loading: false
        });
      } else {
        // 如果没有传递数据，则从数据库加载
        this.loadCategoryProducts();
      }
    });
  },

  // 获取图标的临时访问链接
  getIconUrls: function() {
    const { loadingImageUrl, emptyImageUrl } = this.data;
    
    wx.cloud.getTempFileURL({
      fileList: [loadingImageUrl, emptyImageUrl]
    }).then(res => {
      if (res.fileList && res.fileList.length === 2) {
        this.setData({
          loadingImageUrl: res.fileList[0].tempFileURL,
          emptyImageUrl: res.fileList[1].tempFileURL
        });
      }
    }).catch(err => {
      console.error('获取图标临时链接失败：', err);
    });
  },

  // 加载分类商品
  loadCategoryProducts: function() {
    const db = wx.cloud.database();
    
    db.collection('products')
      .where({
        categoryId: this.data.categoryId
      })
      .get()
      .then(res => {
        const products = res.data.map(product => {
          let displayPrice = 'N/A';
          if (product.prices && Array.isArray(product.prices) && product.prices.length > 0) {
            const firstPriceEntry = product.prices.find(p => typeof p.price === 'number');
            if (firstPriceEntry) {
              displayPrice = firstPriceEntry.price;
            }
          } else if (typeof product.price === 'number') {
            displayPrice = product.price;
          }
          return { ...product, displayPrice };
        });

        this.setData({
          products: products,
          loading: false
        });

        // 获取商品图片的临时链接
        this.getProductImages(products);
      })
      .catch(err => {
        console.error('获取分类商品失败：', err);
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
        this.setData({ loading: false });
      });
  },

  // 获取商品图片临时链接
  getProductImages: function(products) {
    if (!products || products.length === 0) return;

    const promises = products.map(product => {
      if (product.imageUrl && product.imageUrl.startsWith('cloud://')) {
        return wx.cloud.getTempFileURL({
          fileList: [product.imageUrl]
        }).then(res => {
          if (res.fileList && res.fileList[0] && res.fileList[0].tempFileURL) {
            product.imageUrl = res.fileList[0].tempFileURL;
          }
          return product;
        });
      }
      return Promise.resolve(product);
    });

    Promise.all(promises).then(updatedProducts => {
      this.setData({
        products: updatedProducts
      });
    });
  },

  // 点击商品
  onProductTap: function(e) {
    const productId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/product/product?id=${productId}`
    });
  },

  // 点击立即购买
  onBuyNow: function(e) {
    const productId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/order/create?productId=${productId}`
    });
  }
}); 
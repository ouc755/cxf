const auth = require('../../utils/auth.js');

Page({
  data: {
    categoryId: null,
    categoryName: '',
    products: [],
    loading: true,
    loadingImageUrl: 'cloud://cloud1-2g5ar9yr97b49f2f.636c-cloud1-2g5ar9yr97b49f2f-1361317451/icons/loading.gif',
    emptyImageUrl: 'cloud://cloud1-2g5ar9yr97b49f2f.636c-cloud1-2g5ar9yr97b49f2f-1361317451/icons/empty.png',
    isLoggedIn: false,
    userInfo: null
  },

  onLoad: function(options) {
    const { id, name } = options;
    
    this.setData({
      categoryId: id,
      categoryName: name || '分类商品',
      isLoggedIn: auth.checkLogin(),
      userInfo: auth.getUserInfo()
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

    this.updateLoginStatus();
  },

  // 检查并更新登录状态
  updateLoginStatus() {
    this.setData({
      isLoggedIn: auth.checkLogin(),
      userInfo: auth.getUserInfo()
    });
  },

  // 用户点击登录按钮
  onGetUserProfile() {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        // 设置本地状态，直接存真实信息
        this.setData({
          isLoggedIn: true,
          userInfo: res.userInfo
        });
        wx.setStorageSync('user_info', res.userInfo);

        // 同步到云数据库，userInfo字段为真实信息
        wx.cloud.callFunction({
          name: 'login',
          success: cloudRes => {
            const openid = cloudRes.result.openid;
            const db = wx.cloud.database();
            db.collection('users').doc(openid).set({
              data: {
                _id: openid,
                userInfo: res.userInfo, // 真实信息
                updateTime: new Date()
              },
              success: () => {
                wx.showToast({ title: '登录成功', icon: 'success' });
              },
              fail: err => {
                // 已存在则更新
                db.collection('users').doc(openid).update({
                  data: {
                    userInfo: res.userInfo,
                    updateTime: new Date()
                  }
                });
              }
            });
          }
        });
      },
      fail: (err) => {
        wx.showToast({ title: '用户拒绝授权', icon: 'none' });
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
  onBuyNow: async function(e) {
    const productId = e.currentTarget.dataset.id;
    
    // 检查是否已登录
    if (!this.data.isLoggedIn) {
      try {
        // 尝试登录
        await auth.login();
        
        // 询问是否需要获取用户信息
        wx.showModal({
          title: '完善信息',
          content: '是否授权获取您的头像和昵称？',
          success: async (res) => {
            if (res.confirm) {
              try {
                const userInfo = await auth.getUserProfile();
                this.setData({
                  isLoggedIn: true,
                  userInfo: userInfo
                });
                // 继续购买流程
                this.proceedToBuy(productId);
              } catch (err) {
                // 用户拒绝授权个人信息，但已经登录，仍可继续购买
                this.setData({ isLoggedIn: true });
                this.proceedToBuy(productId);
              }
            } else {
              // 用户不想授权个人信息，但已经登录，仍可继续购买
              this.setData({ isLoggedIn: true });
              this.proceedToBuy(productId);
            }
          }
        });
      } catch (err) {
        wx.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        });
        return;
      }
    } else {
      // 已登录，直接继续购买流程
      this.proceedToBuy(productId);
    }
  },

  // 继续购买流程
  proceedToBuy: function(productId) {
    wx.navigateTo({
      url: `/pages/order/create?productId=${productId}`
    });
  }
}); 
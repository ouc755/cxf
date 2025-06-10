// index.js
Page({
  data: {
    // 轮播图数据 (假设这些ID对应products集合中的商品，或者您会调整为期望的云路径)
    banners: [
      {
        id: 1,
        // 云存储中的轮播图片路径
        imageUrl: 'cloud://cloud1-2g5ar9yr97b49f2f.636c-cloud1-2g5ar9yr97b49f2f-1361317451/banners/exbi.png'
      },
      {
        id: 2,
        imageUrl: 'cloud://cloud1-2g5ar9yr97b49f2f.636c-cloud1-2g5ar9yr97b49f2f-1361317451/banners/home.png'
      },
      {
        id: 3,
        imageUrl: 'cloud://cloud1-2g5ar9yr97b49f2f.636c-cloud1-2g5ar9yr97b49f2f-1361317451/banners/max.png'
      }
    ],
    categories: [
      {
        id: 1,
        name: '益智玩具',
        icon: 'info',
        class: 'bg-red',
        color: '#f56c6c'
      },
      {
        id: 2,
        name: '积木拼装',
        icon: 'success',
        class: 'bg-blue',
        color: '#409eff'
      },
      {
        id: 3,
        name: '科教玩具',
        icon: 'waiting',
        class: 'bg-green',
        color: '#67c23a'
      },
      {
        id: 4,
        name: '毛绒玩具',
        icon: 'success_no_circle',
        class: 'bg-yellow',
        color: '#e6a23c'
      },
      {
        id: 5,
        name: '智能玩具',
        icon: 'download',
        class: 'bg-purple',
        color: '#9c27b0'
      },
      {
        id: 6,
        name: '运动玩具',
        icon: 'clear',
        class: 'bg-orange',
        color: '#ff9800'
      },
      {
        id: 7,
        name: '手工玩具',
        icon: 'search',
        class: 'bg-cyan',
        color: '#00bcd4'
      },
      {
        id: 8,
        name: '全部分类',
        icon: 'more',
        class: 'bg-gray',
        color: '#909399'
      }
    ],
    // 热门商品数据 - 将从数据库加载
    hotProducts: [],
    searchValue: '', // 搜索关键词
    filteredProducts: [], // 搜索过滤后的商品
    isSearching: false, // 是否在搜索状态
  },

  onLoad: function() {
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

    this.loadHotProducts()    // 从数据库加载热门商品
    this.getBannerImages()    // 处理轮播图的临时链接 (假设banner的imageUrl已是正确的云路径)
  },

  // 新增：从数据库加载热门商品数据
  loadHotProducts: function() {
    const db = wx.cloud.database()
    db.collection('products').get().then(res => {
      if (res.data && res.data.length > 0) {
        const productsWithDisplayPrice = res.data.map(product => {
          let displayPrice = 'N/A'; // 默认价格，如果无法从prices数组获取
          if (product.prices && Array.isArray(product.prices) && product.prices.length > 0) {
            // 尝试找到第一个有效的 price 数字
            const firstPriceEntry = product.prices.find(p => typeof p.price === 'number');
            if (firstPriceEntry) {
              displayPrice = firstPriceEntry.price;
            } else if (typeof product.prices[0].price === 'number') {
                // 备用：如果find未找到，但第一个元素有price数字（理论上find应该能找到）
                displayPrice = product.prices[0].price; 
            }
          } else if (typeof product.price === 'number') {
            // 如果顶层有 price 字段且为数字 (作为一种兼容或备用)
            displayPrice = product.price;
          }
          // console.log(`[loadHotProducts] 商品 ID: ${product.id}, displayPrice 设置为: ${displayPrice}`);
          return { ...product, displayPrice: displayPrice }; // 添加 displayPrice 字段
        });
        console.log('[loadHotProducts] 从数据库加载并处理后的热门商品:', JSON.stringify(productsWithDisplayPrice)) 
        this.setData({
          hotProducts: productsWithDisplayPrice
        }, () => {
          this.getProducts() // 数据设置完成后，再获取商品图片的临时链接
        })
      } else {
        console.warn('[loadHotProducts] 数据库中没有商品数据或获取失败')
        this.setData({ hotProducts: [] }) // 清空，避免显示旧的硬编码数据
      }
    }).catch(err => {
      console.error('[loadHotProducts] 从数据库加载热门商品失败：', err)
      this.setData({ hotProducts: [] }) // 出错时也清空
    })
  },

  // 获取商品数据和图片真实链接 (现在由 loadHotProducts 回调中调用)
  getProducts: function() {
    const products = this.data.hotProducts // 此时的 hotProducts 是从数据库加载的
    if (!products || products.length === 0) {
      console.log('[getProducts] 没有热门商品数据可处理图片链接')
      return
    }
    // console.log('[getProducts] 开始为热门商品获取临时图片链接:', JSON.stringify(products))
    const promises = products.map(product => {
      console.log(`[getProducts] 处理商品 ID: ${product.id}, 原始 imageUrl: ${product.imageUrl}`);
      if (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.startsWith('cloud://')) {
        return wx.cloud.getTempFileURL({
          fileList: [product.imageUrl]
        }).then(res => {
          if (res.fileList && res.fileList[0] && res.fileList[0].tempFileURL) {
            product.imageUrl = res.fileList[0].tempFileURL;
            console.log(`[getProducts] 商品 ID: ${product.id}, 转换后 tempFileURL: ${product.imageUrl}`);
          } else {
            console.error(`[getProducts] 获取商品 ID: ${product.id} 临时链接失败 (数据格式问题或无tempFileURL):`, JSON.stringify(res), product.imageUrl);
          }
          return product;
        }).catch(err => {
          console.error(`[getProducts] 获取商品 ID: ${product.id} 临时链接异常:`, err, product.imageUrl);
          return product; 
        });
      } else {
         console.warn(`[getProducts] 商品 ID: ${product.id}, imageUrl 无效或不是云路径，不转换: ${product.imageUrl}`);
         return Promise.resolve(product);
      }
    });

    Promise.all(promises).then(updatedProducts => {
      console.log('[getProducts] 更新到页面的 hotProducts:', JSON.stringify(updatedProducts));
      this.setData({
        hotProducts: updatedProducts
      });
    }).catch(err => {
      console.error('[getProducts] Promise.all 处理 updatedProducts 失败:', err);
    });
  },

  // 新增：获取轮播图图片真实链接
  getBannerImages: function() {
    const banners = this.data.banners // banners 仍使用 data 中预设的云路径
    if (!banners || banners.length === 0) {
      console.log('[getBannerImages] 没有轮播图数据可处理图片链接')
      return
    }
    // console.log('[getBannerImages] 开始为轮播图获取临时图片链接:', JSON.stringify(banners))
    const promises = banners.map(banner => {
      console.log(`[getBannerImages] 处理 Banner ID: ${banner.id}, 原始 imageUrl: ${banner.imageUrl}`);
      if (banner.imageUrl && typeof banner.imageUrl === 'string' && banner.imageUrl.startsWith('cloud://')) {
        return wx.cloud.getTempFileURL({
          fileList: [banner.imageUrl]
        }).then(res => {
          if (res.fileList && res.fileList[0] && res.fileList[0].tempFileURL) {
            banner.imageUrl = res.fileList[0].tempFileURL;
            console.log(`[getBannerImages] Banner ID: ${banner.id}, 转换后 tempFileURL: ${banner.imageUrl}`);
          } else {
            console.error(`[getBannerImages] 获取 Banner ID: ${banner.id} 临时链接失败 (数据格式问题或无tempFileURL):`, JSON.stringify(res), banner.imageUrl);
          }
          return banner;
        }).catch(err => {
          console.error(`[getBannerImages] 获取 Banner ID: ${banner.id} 临时链接异常:`, err, banner.imageUrl);
          return banner; 
        });
      } else {
        console.warn(`[getBannerImages] Banner ID: ${banner.id}, imageUrl 无效或不是云路径，不转换: ${banner.imageUrl}`);
        return Promise.resolve(banner);
      }
    });

    Promise.all(promises).then(updatedBanners => {
      console.log('[getBannerImages] 更新到页面的 banners:', JSON.stringify(updatedBanners));
      this.setData({
        banners: updatedBanners
      });
    }).catch(err => {
      console.error('[getBannerImages] Promise.all 处理 updatedBanners 失败:', err);
    });
  },

  // 图片加载失败的处理函数
  onImageError: function(e) {
    console.error('图片加载失败触发 onImageError：', e)
    const index = e.currentTarget.dataset.index
    const type = e.currentTarget.dataset.type // 'banner' 或 'product'
    const cloudDefaultImage = 'cloud://cloud1-2g5ar9yr97b49f2f.636c-cloud1-2g5ar9yr97b49f2f-1361317451/default/default.png'

    wx.cloud.getTempFileURL({
      fileList: [cloudDefaultImage]
    }).then(res => {
      if (res.fileList && res.fileList[0] && res.fileList[0].tempFileURL) {
        const tempDefaultImageUrl = res.fileList[0].tempFileURL
        if (type === 'banner') {
          const banners = [...this.data.banners]
          if (banners[index] && banners[index].imageUrl !== tempDefaultImageUrl) { // 避免重复setData
            banners[index].imageUrl = tempDefaultImageUrl
            this.setData({ banners: banners })
          }
        } else if (type === 'product') {
          const products = [...this.data.hotProducts]
          if (products[index] && products[index].imageUrl !== tempDefaultImageUrl) { // 避免重复setData
            products[index].imageUrl = tempDefaultImageUrl
            this.setData({ hotProducts: products })
          }
        }
      } else {
        console.error('[onImageError] 获取云端默认图片临时链接失败:', JSON.stringify(res))
      }
    }).catch(err => {
      console.error('[onImageError] 获取云端默认图片临时链接异常:', err)
    })
  },

  // 加载轮播图数据
  loadBanners: function() {
    // TODO: 从云数据库获取轮播图数据
  },

  // 加载分类数据
  loadCategories: function() {
    // TODO: 从云数据库获取分类数据
  },

  // 点击分类
  onCategoryTap: function(e) {
    const categoryId = e.currentTarget.dataset.id;
    const categoryName = e.currentTarget.dataset.name;
    
    if (categoryId === 8) { // "全部分类"的ID
      wx.navigateTo({
        url: '/pages/category/category'
      });
      return;
    }

    const db = wx.cloud.database();
    
    // 根据分类ID查询商品
    db.collection('products')
      .where({
        categoryId: categoryId
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

        // 跳转到分类页面并传递数据
        wx.navigateTo({
          url: `/pages/category/category?id=${categoryId}&name=${categoryName}`,
          success: function(res) {
            // 将商品数据传递给分类页面
            res.eventChannel.emit('acceptProductsData', { products: products });
          }
        });
      })
      .catch(err => {
        console.error('获取分类商品失败：', err);
        wx.showToast({
          title: '获取分类失败',
          icon: 'none'
        });
      });
  },

  // 点击商品
  onProductTap: function(e) {
    const productId = e.currentTarget.dataset.id
    console.log('点击商品，ID：', productId)
    wx.navigateTo({
      url: `/pages/product/product?id=${productId}`
    })
  },

  // 点击立即购买
  onBuyNow: function(e) {
    const productId = e.currentTarget.dataset.id
    console.log('点击立即购买，ID：', productId)
    wx.navigateTo({
      url: `/pages/order/create?productId=${productId}`
    })
  },

  // 搜索框输入事件处理
  onSearchInput: function(e) {
    const value = e.detail.value;
    this.setData({ 
      searchValue: value,
      isSearching: value.length > 0
    });
    this.searchProducts(value);
  },

  // 搜索框确认搜索事件
  onSearchConfirm: function(e) {
    const value = e.detail.value;
    this.searchProducts(value);
  },

  // 清空搜索
  clearSearch: function() {
    this.setData({
      searchValue: '',
      isSearching: false,
      filteredProducts: []
    });
    // 重新加载热门商品
    this.loadHotProducts();
  },

  // 返回首页
  backToHome: function() {
    this.clearSearch();
  },

  // 搜索商品
  searchProducts: function(keyword) {
    if (!keyword.trim()) {
      this.setData({
        isSearching: false,
        filteredProducts: []
      });
      return;
    }

    const db = wx.cloud.database();
    const _ = db.command;
    
    // 构建搜索条件
    const searchCondition = {
      name: db.RegExp({
        regexp: keyword,
        options: 'i'
      })
    };

    // 从云数据库搜索商品
    db.collection('products')
      .where(searchCondition)
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
          filteredProducts: products,
          isSearching: true
        });

        // 获取商品图片的临时链接
        this.getProductImages(products);
      })
      .catch(err => {
        console.error('搜索商品失败：', err);
        wx.showToast({
          title: '搜索失败',
          icon: 'none'
        });
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
        filteredProducts: updatedProducts
      });
    });
  },
}) 
const { loadSwiperImages } = require('./utils/imageLoader');
const { addToCart, checkSpecSelected } = require('./utils/cartHelper');

Page({
  data: {
    product: null,
    selectedStyle: '',
    selectedSize: '',
    selectedColor: '',
    selectedPackaging: '',
    selectedGiftBag: '',
    selectedCustomOptions: {},
    currentPrice: 0,
    swiperImageUrls: [],
    quantity: 1,
  },

  onLoad: function(options) {
    if (!wx.cloud) {
      wx.showToast({
        title: '请使用 2.2.3 或以上的基础库以使用云能力',
        icon: 'none'
      });
      return;
    }

    if (!options.id) {
      wx.showToast({
        title: '无效的商品ID',
        icon: 'none'
      });
      wx.navigateBack();
      return;
    }
    this.loadProductDetail(options.id);
  },

  loadProductDetail: function(productId) {
    const db = wx.cloud.database();
    db.collection('products').doc(productId).get().then(res => {
      if (res.data) {
        const product = res.data;
        
        // 确保所有必要的数组都存在
        product.specifications = product.specifications || [];
        product.sizes = product.sizes || [];
        product.colors = product.colors || [];
        product.prices = product.prices || [];

        // 设置默认选中的规格和价格
        const defaultData = {
          product,
          selectedStyle: product.specifications[0] || '',
          selectedSize: product.sizes[0] || '',
          selectedColor: product.colors[0] || '',
          currentPrice: 0
        };
        
        this.setData(defaultData, () => {
          this.updatePrice();
          if (product.imageUrl) {
            this.loadProductImages([product.imageUrl]);
          }
        });
      } else {
        wx.showToast({
          title: '商品不存在',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('[loadProductDetail] 获取商品数据失败:', err);
      wx.showToast({
        title: '加载商品失败',
        icon: 'none'
      });
    });
  },

  async loadProductImages(imagePaths) {
    try {
      const urls = await loadSwiperImages(imagePaths);
      this.setData({ swiperImageUrls: urls });
    } catch (err) {
      console.error('[loadProductImages] 加载图片失败:', err);
      this.setData({ swiperImageUrls: [] });
    }
  },

  selectStyle: function(e) {
    this.setData({ selectedStyle: e.currentTarget.dataset.style }, () => {
      this.updatePrice();
    });
  },

  selectSize: function(e) {
    this.setData({ selectedSize: e.currentTarget.dataset.size }, () => {
      this.updatePrice();
    });
  },

  selectColor: function(e) {
    this.setData({ selectedColor: e.currentTarget.dataset.color });
  },

  selectPackaging: function(e) {
    this.setData({ selectedPackaging: e.currentTarget.dataset.packaging });
  },

  selectGiftBag: function(e) {
    this.setData({ selectedGiftBag: e.currentTarget.dataset.giftbag });
  },

  selectCustomOption(e) {
    const { propertyName, option } = e.currentTarget.dataset
    this.setData({
      [`selectedCustomOptions.${propertyName}`]: option
    })
  },

  validateSelections() {
    const { 
      product, 
      selectedStyle, 
      selectedSize, 
      selectedColor,
      selectedCustomOptions 
    } = this.data

    if (product.specifications && product.specifications.length > 0 && !selectedStyle) {
      wx.showToast({
        title: '请选择规格',
        icon: 'none'
      })
      return false
    }

    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      wx.showToast({
        title: '请选择尺寸',
        icon: 'none'
      })
      return false
    }

    if (product.colors && product.colors.length > 0 && !selectedColor) {
      wx.showToast({
        title: '请选择颜色',
        icon: 'none'
      })
      return false
    }

    if (product.customProperties) {
      for (const prop of product.customProperties) {
        if (prop.options && prop.options.length > 0 && !selectedCustomOptions[prop.name]) {
          wx.showToast({
            title: `请选择${prop.name}`,
            icon: 'none'
          })
          return false
        }
      }
    }

    return true
  },

  updatePrice: function() {
    const { product, selectedStyle, selectedSize } = this.data;
    
    if (!product?.prices?.length) {
      this.setData({ currentPrice: 0 });
      return;
    }

    if (!selectedStyle || !selectedSize) {
      this.setData({ currentPrice: product.prices[0].price });
      return;
    }

    const combination = `${selectedStyle}+${selectedSize}`;
    const priceInfo = product.prices.find(p => p.combination === combination);
    
    this.setData({ 
      currentPrice: priceInfo ? priceInfo.price : product.prices[0].price 
    });
  },

  async addToCart() {
    const { 
      product, 
      selectedStyle, 
      selectedSize, 
      selectedColor, 
      currentPrice, 
      quantity,
      selectedCustomOptions 
    } = this.data
    
    if (!this.validateSelections()) return

    try {
      const productData = {
        _id: product._id,
        name: product.name,
        imageUrl: product.imageUrl,
        price: currentPrice,
        specification: selectedStyle,
        size: selectedSize,
        color: selectedColor,
        customOptions: selectedCustomOptions,
        quantity: quantity
      }

      await addToCart(productData)

      wx.showToast({
        title: '已加入购物车',
        icon: 'success',
        duration: 2000
      })
    } catch (error) {
      console.error('[addToCart] 添加到购物车失败：', error)
      wx.showToast({
        title: '添加失败，请重试',
        icon: 'none'
      })
    }
  },

  decreaseQuantity: function() {
    if (this.data.quantity > 1) {
      this.setData({ quantity: this.data.quantity - 1 });
    }
  },

  increaseQuantity: function() {
    this.setData({ quantity: this.data.quantity + 1 });
  },

  handleQuantityChange: function(e) {
    const quantity = Math.max(1, parseInt(e.detail.value) || 1);
    this.setData({ quantity });
  },
}); 
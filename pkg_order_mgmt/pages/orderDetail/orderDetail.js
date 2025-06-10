const app = getApp()

Page({
  data: {
    order: null,
    loading: true,
    error: null,
    statusMap: {
      0: '待付款',
      1: '待发货',
      2: '待收货',
      3: '已完成',
      4: '已取消'
    }
  },

  onLoad(options) {
    if (options.id) {
      this.getOrderDetail(options.id)
    }
  },

  // 获取订单详情
  async getOrderDetail(orderId) {
    try {
      this.setData({ loading: true, error: null })
      
      const token = wx.getStorageSync('token')
      if (!token) {
        throw new Error('请先登录')
      }

      console.log(`Requesting order details for ID: ${orderId}`); // 新增日志
      const res = await wx.request({
        url: `${app.globalData.baseUrl}/api/orders/${orderId}`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      })

        console.log('Received response from /api/orders/:id :', JSON.stringify(res)); // 新增日志，打印完整响应

        if (res.statusCode === 200 && res.data) { // 增加对 res.data 的检查
          let orderData = res.data; // 使用 let 允许修改
          console.log('[DEBUG] Initial orderData from API /api/orders/:id :', JSON.stringify(orderData));

          // 辅助函数，用于判断地址是否包含有效信息以供显示
          const isAddressDisplayable = (address) => {
            return address && typeof address === 'object' && address.receiver && String(address.receiver).trim() !== '';
          };

          // 检查shippingAddress是否已经被populate
          // 后端使用了populate('shippingAddress')，所以这里需要处理populate后的对象
          let currentShippingAddress = orderData.shippingAddress;
          console.log('[DEBUG] Current shippingAddress type:', typeof currentShippingAddress);
          
          if (!isAddressDisplayable(currentShippingAddress)) {
            console.log('[DEBUG] Order shipping address is not displayable (receiver missing/empty) or address is missing. Attempting to get default address.');
            const defaultAddress = await this.getDefaultAddress();
            console.log('[DEBUG] defaultAddress from getDefaultAddress():', JSON.stringify(defaultAddress));

            if (isAddressDisplayable(defaultAddress)) {
              orderData.shippingAddress = defaultAddress;
              console.log('[DEBUG] Using displayable default address. orderData.shippingAddress is now:', JSON.stringify(orderData.shippingAddress));
            } else {
              // 创建一个空的地址对象，确保WXML中的绑定不会出错
              orderData.shippingAddress = { 
                receiver: '', 
                contact: '', 
                province: '', 
                city: '', 
                district: '', 
                detail: '' 
              };
              console.log('[DEBUG] Default address also not displayable or missing. Setting shippingAddress to empty object with required fields.');
            }
          } else {
            console.log('[DEBUG] Order already has a displayable shippingAddress from initial load:', JSON.stringify(orderData.shippingAddress));
          }

          console.log('[DEBUG] Final orderData object before setData (shippingAddress might be null):', JSON.stringify(orderData));
          // 新增超级调试日志
          if (orderData && orderData.shippingAddress && typeof orderData.shippingAddress === 'object' && Object.keys(orderData.shippingAddress).length > 0) {
            console.log('[SUPER_DEBUG] Type of orderData.shippingAddress before setData:', typeof orderData.shippingAddress);
            console.log('[SUPER_DEBUG] Value of orderData.shippingAddress before setData:', JSON.stringify(orderData.shippingAddress));
            console.log('[SUPER_DEBUG] orderData.shippingAddress is a non-empty object.');
            console.log('[SUPER_DEBUG] Does orderData.shippingAddress have receiver?:', orderData.shippingAddress.hasOwnProperty('receiver'));
            console.log('[SUPER_DEBUG] Receiver value:', orderData.shippingAddress.receiver);
          } else if (orderData && orderData.shippingAddress) {
            console.log('[SUPER_DEBUG] orderData.shippingAddress exists but might be an empty object or not an object. Type:', typeof orderData.shippingAddress, 'Value:', JSON.stringify(orderData.shippingAddress));
          } else {
            console.log('[SUPER_DEBUG] orderData.shippingAddress is null, undefined, or does not exist on orderData before setData.');
          }
          this.setData({
            order: orderData,
            loading: false
          });
        } else {
        console.error('Failed to get order details. Full response:', JSON.stringify(res)); // 新增日志，打印完整响应
        const errorMsg = res && res.data && res.data.message ? res.data.message : `获取订单详情失败 (状态码: ${res.statusCode})`;
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('获取订单详情失败:', error);
      const errorMessage = error && error.message ? error.message : '获取订单详情失败，请检查网络或稍后重试';
      this.setData({
        loading: false,
        error: errorMessage
      });
      wx.showToast({
        title: errorMessage,
        icon: 'none'
      });
    }
  },

  // 取消订单
  async cancelOrder() {
    try {
      const token = wx.getStorageSync('token')
      if (!token) {
        throw new Error('请先登录')
      }

      console.log(`Requesting order cancellation for ID: ${this.data.order._id}`); // 修正日志
      const res = await wx.request({
        url: `${app.globalData.baseUrl}/api/orders/${this.data.order._id}/cancel`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.statusCode === 200) {
        wx.showToast({
          title: '订单已取消',
          icon: 'success'
        })
        // 刷新订单详情
        this.getOrderDetail(this.data.order._id)
      } else {
        throw new Error(res.data.message || '取消订单失败')
      }
    } catch (error) {
      console.error('取消订单失败:', error);
      const cancelErrorMsg = error && error.message ? error.message : '取消订单失败';
      wx.showToast({
        title: cancelErrorMsg,
        icon: 'none'
      });
    }
  },

  // 申请售后
  async requestAfterSale() {
    try {
      const token = wx.getStorageSync('token')
      if (!token) {
        throw new Error('请先登录')
      }

      console.log(`Requesting after-sale for ID: ${this.data.order._id}`); // 修正日志
      const res = await wx.request({
        url: `${app.globalData.baseUrl}/api/orders/${this.data.order._id}/after-sale`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.statusCode === 200) {
        wx.showToast({
          title: '售后申请已提交',
          icon: 'success'
        })
        // 刷新订单详情
        this.getOrderDetail(this.data.order._id)
      } else {
        throw new Error(res.data.message || '申请售后失败')
      }
    } catch (error) {
      console.error('申请售后失败:', error);
      const afterSaleErrorMsg = error && error.message ? error.message : '申请售后失败';
      wx.showToast({
        title: afterSaleErrorMsg,
        icon: 'none'
      });
    }
  },

  // 复制订单号
  copyOrderId() {
    wx.setClipboardData({
      data: this.data.order._id,
      success: () => {
        wx.showToast({
          title: '订单号已复制',
          icon: 'success'
        })
      }
    })
  },

  // 查看商品详情
  goToProductDetail(e) {
    const productId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/productDetail/productDetail?id=${productId}`
    })
  },

  // 返回订单列表
  goBack() {
    wx.navigateBack()
  },

  // 获取用户默认收货地址
  async getDefaultAddress() {
    try {
      const token = wx.getStorageSync('token');
      if (!token) {
        console.log('No token found, cannot get default address.');
        return null;
      }

      console.log('Requesting default address.');
      // 使用Promise封装wx.request，确保能正确await响应
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${app.globalData.baseUrl}/api/addresses/default`,
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`
          },
          success: resolve,
          fail: reject
        });
      });

      console.log('Received response from /api/addresses/default:', JSON.stringify(res));

      if (res.statusCode === 200 && res.data && Object.keys(res.data).length > 0) { // 确保 res.data 不是空对象
        console.log('[DEBUG] Successfully fetched default address:', JSON.stringify(res.data));
        // 确保返回的地址对象包含所有必要的字段
        const address = res.data;
        return {
          receiver: address.receiver || '',
          contact: address.contact || '',
          province: address.province || '',
          city: address.city || '',
          district: address.district || '',
          detail: address.detail || ''
        };
      } else if (res.statusCode === 404) {
        console.log('[DEBUG] Default address not found (404).');
        // 返回一个空的地址对象而不是null，确保WXML绑定不会出错
        return {
          receiver: '',
          contact: '',
          province: '',
          city: '',
          district: '',
          detail: ''
        };
      } else {
        console.error('Failed to get default address or got empty data. Status:', res.statusCode, 'Data:', JSON.stringify(res.data));
        // 返回一个空的地址对象而不是null
        return {
          receiver: '',
          contact: '',
          province: '',
          city: '',
          district: '',
          detail: ''
        };
      }
    } catch (error) {
      console.error('获取默认收货地址失败:', error);
      // 返回一个空的地址对象而不是null
      return {
        receiver: '',
        contact: '',
        province: '',
        city: '',
        district: '',
        detail: ''
      };
    }
  }
})
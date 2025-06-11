Page({
  data: {
    isEdit: false,
    productId: '',
    imageUrl: '',
    product: {
      name: '',
      description: ''
    },
    colors: [''],
    variants: [{
      specification: '',
      size: '',
      price: ''
    }],
    customProperties: [],
    showCustomProperties: false,
    showPropertyDialog: false,
    newPropertyName: '',
    numericId: ''
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        isEdit: true,
        productId: options.id
      })
      this.loadProduct(options.id)
    }
  },

  // 加载商品信息
  async loadProduct(id) {
    try {
      wx.showLoading({
        title: '加载中...',
        mask: true
      })

      const db = wx.cloud.database()
      const { data } = await db.collection('products').doc(id).get()

      this.setData({
        product: {
          name: data.name || '',
          description: data.description || ''
        },
        imageUrl: data.imageUrl || '',
        colors: data.colors && data.colors.length ? data.colors : [''],
        variants: data.variants && data.variants.length ? data.variants : [{
          specification: '',
          size: '',
          price: ''
        }],
        customProperties: data.customProperties || [],
        showCustomProperties: data.customProperties && data.customProperties.length > 0,
        productId: id,
        numericId: data.id
      })
    } catch (error) {
      console.error('加载商品信息失败：', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 选择图片
  async chooseImage() {
    try {
      const { tempFilePaths } = await wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      if (tempFilePaths && tempFilePaths.length > 0) {
        wx.showLoading({
          title: '上传中...',
          mask: true
        })

        const cloudPath = `products/${Date.now()}-${Math.random().toString(36).substr(2)}.${tempFilePaths[0].match(/\.(\w+)$/)[1]}`
        const { fileID } = await wx.cloud.uploadFile({
          cloudPath,
          filePath: tempFilePaths[0]
        })

        this.setData({
          imageUrl: fileID
        })

        wx.hideLoading()
      }
    } catch (error) {
      console.error('上传图片失败：', error)
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      })
    }
  },

  // 处理规格变化
  handleVariantChange(e) {
    const { index, field } = e.currentTarget.dataset
    const { value } = e.detail
    const variants = [...this.data.variants]
    variants[index][field] = value
    this.setData({ variants })
  },

  // 添加规格
  addVariant() {
    const variants = [...this.data.variants, {
      specification: '',
      size: '',
      price: ''
    }]
    this.setData({ variants })
  },

  // 删除规格
  deleteVariant(e) {
    const { index } = e.currentTarget.dataset
    const variants = this.data.variants.filter((_, i) => i !== index)
    if (variants.length === 0) {
      variants.push({
        specification: '',
        size: '',
        price: ''
      })
    }
    this.setData({ variants })
  },

  // 处理颜色变化
  handleColorChange(e) {
    const { index } = e.currentTarget.dataset
    const { value } = e.detail
    const colors = [...this.data.colors]
    colors[index] = value
    this.setData({ colors })
  },

  // 添加颜色
  addColor() {
    const colors = [...this.data.colors, '']
    this.setData({ colors })
  },

  // 删除颜色
  deleteColor(e) {
    const { index } = e.currentTarget.dataset
    const colors = this.data.colors.filter((_, i) => i !== index)
    if (colors.length === 0) {
      colors.push('')
    }
    this.setData({ colors })
  },

  // 显示自定义属性区域
  showCustomPropertiesSection() {
    this.setData({
      showCustomProperties: true,
      customProperties: [{
        name: '',
        options: ['']
      }]
    })
  },

  // 隐藏自定义属性区域
  hideCustomPropertiesSection() {
    this.setData({
      showCustomProperties: false,
      customProperties: []
    })
  },

  // 显示自定义属性弹窗
  showCustomPropertyDialog() {
    this.setData({
      showPropertyDialog: true,
      newPropertyName: ''
    })
  },

  // 隐藏自定义属性弹窗
  hideCustomPropertyDialog() {
    this.setData({
      showPropertyDialog: false,
      newPropertyName: ''
    })
  },

  // 处理自定义属性名称变化
  handleCustomPropertyNameChange(e) {
    const { index } = e.currentTarget.dataset
    const { value } = e.detail
    const customProperties = [...this.data.customProperties]
    customProperties[index].name = value
    this.setData({ customProperties })
  },

  // 处理自定义属性选项变化
  handleCustomPropertyOptionChange(e) {
    const { propertyIndex, optionIndex } = e.currentTarget.dataset
    const { value } = e.detail
    const customProperties = [...this.data.customProperties]
    customProperties[propertyIndex].options[optionIndex] = value
    this.setData({ customProperties })
  },

  // 添加自定义属性
  addCustomProperty() {
    const customProperties = [...this.data.customProperties, {
      name: '',
      options: ['']
    }]
    this.setData({ customProperties })
  },

  // 删除自定义属性
  deleteCustomProperty(e) {
    const { index } = e.currentTarget.dataset
    const customProperties = this.data.customProperties.filter((_, i) => i !== index)
    if (customProperties.length === 0) {
      customProperties.push({
        name: '',
        options: ['']
      })
    }
    this.setData({ customProperties })
  },

  // 添加属性选项
  addPropertyOption(e) {
    const { index } = e.currentTarget.dataset
    const customProperties = [...this.data.customProperties]
    customProperties[index].options.push('')
    this.setData({ customProperties })
  },

  // 删除属性选项
  deletePropertyOption(e) {
    const { propertyIndex, optionIndex } = e.currentTarget.dataset
    const customProperties = [...this.data.customProperties]
    customProperties[propertyIndex].options = customProperties[propertyIndex].options.filter((_, i) => i !== optionIndex)
    if (customProperties[propertyIndex].options.length === 0) {
      customProperties[propertyIndex].options.push('')
    }
    this.setData({ customProperties })
  },

  // 处理新属性名称输入
  handleNewPropertyNameInput(e) {
    this.setData({
      newPropertyName: e.detail.value
    })
  },

  // 验证表单
  validateForm() {
    if (!this.data.imageUrl) {
      wx.showToast({
        title: '请上传商品图片',
        icon: 'none'
      })
      return false
    }

    if (!this.data.product.name.trim()) {
      wx.showToast({
        title: '请输入商品名称',
        icon: 'none'
      })
      return false
    }

    const validVariants = this.data.variants.filter(v => 
      v.specification.trim() && 
      v.size.trim() && 
      v.price !== '' && 
      !isNaN(Number(v.price))
    )
    if (validVariants.length === 0) {
      wx.showToast({
        title: '请至少添加一个完整的商品规格',
        icon: 'none'
      })
      return false
    }

    // 验证自定义属性
    const validProperties = this.data.showCustomProperties ? 
      this.data.customProperties.filter(prop => 
        prop.name.trim() && prop.options.some(opt => opt.trim())
      ).map(prop => ({
        name: prop.name.trim(),
        options: prop.options.filter(opt => opt.trim())
      })) : []
    const invalidProperties = this.data.customProperties.filter(prop => 
      prop.name.trim() && !prop.options.some(opt => opt.trim())
    )
    if (invalidProperties.length > 0) {
      wx.showToast({
        title: '请为所有属性添加至少一个选项',
        icon: 'none'
      })
      return false
    }

    return true
  },

  // 提交表单
  async handleSubmit(e) {
    try {
      // 从表单数据中获取商品名称和描述
      const formData = e.detail.value;
      this.setData({
        product: {
          name: formData.name,
          description: formData.description
        }
      });

      if (!this.validateForm()) {
        return;
      }

      wx.showLoading({
        title: '保存中...',
        mask: true
      });

      const validVariants = this.data.variants.filter(v => 
        v.specification.trim() && 
        v.size.trim() && 
        v.price !== '' && 
        !isNaN(Number(v.price))
      );

      const specifications = [...new Set(validVariants.map(v => v.specification.trim()))];
      const sizes = [...new Set(validVariants.map(v => v.size.trim()))];

      const prices = validVariants.map(v => ({
        combination: `${v.specification.trim()}+${v.size.trim()}`,
        price: Number(v.price)
      }));

      const validProperties = this.data.showCustomProperties ? 
        this.data.customProperties.filter(prop => 
          prop.name.trim() && prop.options.some(opt => opt.trim())
        ).map(prop => ({
          name: prop.name.trim(),
          options: prop.options.filter(opt => opt.trim())
        })) : [];

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        imageUrl: this.data.imageUrl,
        colors: this.data.colors.filter(color => color.trim()),
        specifications,
        sizes,
        styles: specifications,
        prices,
        variants: validVariants.map(v => ({
          specification: v.specification.trim(),
          size: v.size.trim(),
          price: Number(v.price)
        })),
        customProperties: validProperties
      };

      const db = wx.cloud.database();

      if (this.data.isEdit) {
        await db.collection('products').doc(this.data.productId).update({
          data: {
            ...productData,
            updateTime: db.serverDate()
          }
        });
      } else {
        await db.collection('products').add({
          data: {
            ...productData,
            createTime: db.serverDate(),
            updateTime: db.serverDate()
          }
        });
      }

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);

    } catch (error) {
      console.error('保存商品失败：', error);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  }
}) 
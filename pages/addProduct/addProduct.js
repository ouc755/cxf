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
          name: data.name,
          description: data.description
        },
        imageUrl: data.imageUrl,
        colors: data.colors || [''],
        variants: data.variants || [{
          specification: '',
          size: '',
          price: ''
        }],
        customProperties: data.customProperties || [],
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

  // 处理新属性名称输入
  handleNewPropertyNameInput(e) {
    this.setData({
      newPropertyName: e.detail.value
    })
  },

  // 添加自定义属性
  addCustomProperty() {
    const { newPropertyName, customProperties } = this.data
    if (!newPropertyName.trim()) {
      wx.showToast({
        title: '请输入属性名称',
        icon: 'none'
      })
      return
    }

    // 检查属性名是否重复
    if (customProperties.some(p => p.name === newPropertyName.trim())) {
      wx.showToast({
        title: '属性名称已存在',
        icon: 'none'
      })
      return
    }

    const updatedProperties = [...customProperties, {
      name: newPropertyName.trim(),
      values: [],
      currentValue: ''
    }]

    this.setData({
      customProperties: updatedProperties,
      showPropertyDialog: false,
      newPropertyName: ''
    })
  },

  // 删除自定义属性
  deleteCustomProperty(e) {
    const { index } = e.currentTarget.dataset
    const customProperties = this.data.customProperties.filter((_, i) => i !== index)
    this.setData({ customProperties })
  },

  // 添加属性值
  addPropertyValue(e) {
    const { index } = e.currentTarget.dataset
    const { value } = e.detail
    const { customProperties } = this.data

    if (!value.trim()) return

    // 检查值是否重复
    if (customProperties[index].values.includes(value.trim())) {
      wx.showToast({
        title: '该值已存在',
        icon: 'none'
      })
      return
    }

    const updatedProperties = [...customProperties]
    updatedProperties[index].values.push(value.trim())
    updatedProperties[index].currentValue = ''

    this.setData({
      customProperties: updatedProperties
    })
  },

  // 删除属性值
  deletePropertyValue(e) {
    const { propertyIndex, valueIndex } = e.currentTarget.dataset
    const customProperties = [...this.data.customProperties]
    customProperties[propertyIndex].values.splice(valueIndex, 1)
    this.setData({ customProperties })
  },

  // 清空属性值输入框
  clearPropertyInput(e) {
    const { index } = e.currentTarget.dataset
    const customProperties = [...this.data.customProperties]
    customProperties[index].currentValue = ''
    this.setData({ customProperties })
  },

  // 提交表单
  async handleSubmit(e) {
    try {
      const formData = e.detail.value
      
      // 验证表单
      if (!this.validateForm(formData)) {
        return
      }

      wx.showLoading({
        title: '保存中...',
        mask: true
      })

      const db = wx.cloud.database()
      const validVariants = this.data.variants.filter(v => v.specification && v.size && v.price)
      
      // 从价格组合中提取所有不重复的规格和尺寸
      const specifications = [...new Set(validVariants.map(v => v.specification))]
      const sizes = [...new Set(validVariants.map(v => v.size))]
      
      // 构建价格数组
      const prices = validVariants.map(v => ({
        combination: `${v.specification}+${v.size}`,
        price: Number(v.price)
      }))

      // 确保规格和尺寸数组存在且不为空
      if (!specifications.length || !sizes.length) {
        wx.showToast({
          title: '请至少添加一个规格和尺寸',
          icon: 'none'
        })
        return
      }

      const productData = {
        name: formData.name,
        description: formData.description,
        imageUrl: this.data.imageUrl,
        colors: this.data.colors.filter(color => color.trim()),
        variants: validVariants,
        specifications,  // 添加规格数组
        sizes,          // 添加尺寸数组
        prices,         // 添加价格数组
        styles: specifications,  // 添加styles字段，与specifications保持一致
        customProperties: this.data.customProperties,
        updateTime: db.serverDate()
      }

      if (this.data.isEdit) {
        await db.collection('products').doc(this.data.productId).update({
          data: {
            ...productData,
            id: this.data.numericId
          }
        })
      } else {
        // 获取当前最大ID
        const { data: existingProducts } = await db.collection('products')
          .orderBy('id', 'desc')
          .limit(1)
          .get()
        
        const nextId = existingProducts.length > 0 ? existingProducts[0].id + 1 : 1

        await db.collection('products').add({
          data: {
            ...productData,
            id: nextId,
            createTime: db.serverDate()
          }
        })
      }

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })

      // 返回上一页
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('保存商品失败：', error)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 验证表单
  validateForm(formData) {
    if (!this.data.imageUrl) {
      wx.showToast({
        title: '请上传商品图片',
        icon: 'none'
      })
      return false
    }

    if (!formData.name) {
      wx.showToast({
        title: '请输入商品名称',
        icon: 'none'
      })
      return false
    }

    const validVariants = this.data.variants.filter(v => v.specification && v.size && v.price)
    if (validVariants.length === 0) {
      wx.showToast({
        title: '请至少添加一个完整的商品规格',
        icon: 'none'
      })
      return false
    }

    return true
  }
}) 
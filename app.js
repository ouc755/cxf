// app.js
const { ensureLogin } = require('./utils/auth')

App({
  onLaunch: async function () {
    try {
      // 初始化云开发
      if (!wx.cloud) {
        console.error('请使用 2.2.3 或以上的基础库以使用云能力')
        return
      }

      try {
        await wx.cloud.init({
          env: 'cloud1-2g5ar9yr97b49f2f',
          traceUser: true
        })
        console.log('云开发初始化成功')
      } catch (cloudError) {
        console.error('云开发初始化失败:', cloudError)
        wx.showToast({
          title: '云服务初始化失败',
          icon: 'none',
          duration: 2000
        })
        return // 如果云开发初始化失败，直接返回
      }

      // 获取系统信息
      try {
        const systemInfo = wx.getSystemInfoSync()
        this.globalData.systemInfo = systemInfo
      } catch (systemError) {
        console.error('获取系统信息失败:', systemError)
      }

      // 展示本地存储能力
      try {
        const logs = wx.getStorageSync('logs') || []
        logs.unshift(Date.now())
        wx.setStorageSync('logs', logs)
      } catch (storageError) {
        console.error('存储操作失败:', storageError)
      }

      // 检查登录状态并决定是否跳转到登录页
      // console.log('开始检查登录状态...')
      // const isLoggedIn = await this.checkLoginStatus()
      // console.log('登录状态检查结果:', isLoggedIn)
      // if (!isLoggedIn) {
      //   console.log('用户未登录或登录失效，跳转到登录页')
      //   wx.reLaunch({
      //     url: '/pages/login/login'
      //   })
      //   return // 确保在跳转后不再执行后续代码
      // } else {
      //   console.log('用户已登录，继续初始化其他数据')
      // }

      // 初始化商品数据
      await this.initProductsData()

      // 检查管理员登录状态
      try {
        const adminUsername = wx.getStorageSync('adminUsername')
        if (adminUsername) {
          this.globalData.isAdminLoggedIn = true
          this.globalData.adminUsername = adminUsername
        }
      } catch (adminError) {
        console.error('获取管理员状态失败:', adminError)
      }
    } catch (error) {
      console.error('应用启动失败:', error)
      wx.showToast({
        title: '应用启动失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  // 检查登录状态
  checkLoginStatus: async function() {
    try {
      const token = wx.getStorageSync('token')
      const userInfo = wx.getStorageSync('userInfo')
      
      if (!token) {
        console.log('未找到token，未登录状态')
        this.globalData.isLoggedIn = false
        this.globalData.userInfo = null
        return false
      }

      console.log('开始验证token有效性...')
      // 验证token有效性
      const { result } = await wx.cloud.callFunction({
        name: 'checkToken',
        data: { token }
      })

      console.log('token验证结果:', result)

      if (result && result.success) {
        console.log('token有效，设置登录状态')
        this.globalData.isLoggedIn = true
        this.globalData.userInfo = userInfo || result.userInfo
        // 确保本地存储的用户信息是最新的
        if (result.userInfo) {
          wx.setStorageSync('userInfo', result.userInfo)
        }
        return true
      } else {
        console.log('token无效，清除登录状态')
        this.globalData.isLoggedIn = false
        this.globalData.userInfo = null
        // 清除无效的token和用户信息
        wx.removeStorageSync('token')
        wx.removeStorageSync('userInfo')
        return false
      }
    } catch (error) {
      console.error('检查登录状态失败:', error)
      this.globalData.isLoggedIn = false
      this.globalData.userInfo = null
      return false
    }
  },

  // 登录方法
  login: async function() {
    try {
      console.log('开始登录流程...')
      // 调用登录云函数
      const { result } = await wx.cloud.callFunction({
        name: 'login'
      })

      console.log('登录云函数返回结果:', result)

      if (!result.success || !result.token) {
        console.error('登录失败:', result)
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        })
        return false
      }

      console.log('保存token:', result.token)
      // 保存token
      wx.setStorageSync('token', result.token)
      
      // 设置基础登录状态
      this.globalData.isLoggedIn = true

      try {
        console.log('尝试获取用户信息...')
        // 获取用户信息
        const userProfile = await wx.getUserProfile({
          desc: '用于完善用户资料'
        })

        console.log('获取到用户信息:', userProfile)

        // 更新用户信息
        const updateResult = await wx.cloud.callFunction({
          name: 'updateUserInfo',
          data: {
            token: result.token,
            userInfo: {
              avatarUrl: userProfile.userInfo.avatarUrl,
              nickName: userProfile.userInfo.nickName
            }
          }
        })

        console.log('更新用户信息结果:', updateResult)

        if (updateResult.result.success) {
          this.globalData.userInfo = updateResult.result.userInfo
          wx.setStorageSync('userInfo', updateResult.result.userInfo)
        }
      } catch (error) {
        console.log('用户拒绝授权或获取信息失败:', error)
        // 用户拒绝授权，但token已经生成，仍然可以使用基础功能
        // 不影响登录状态
      }

      return true
    } catch (error) {
      console.error('登录失败:', error)
      this.globalData.isLoggedIn = false
      this.globalData.userInfo = null
      return false
    }
  },

  // 更新用户信息
  updateUserInfo: async function(userInfo) {
    try {
      const token = wx.getStorageSync('token')
      if (!token) return false

      const { result } = await wx.cloud.callFunction({
        name: 'updateUserInfo',
        data: { token, userInfo }
      })

      if (result.success) {
        this.globalData.userInfo = result.userInfo
        wx.setStorageSync('userInfo', result.userInfo)
        return true
      }
      return false
    } catch (error) {
      console.error('Update user info failed:', error)
      return false
    }
  },

  // 初始化商品数据
  async initProductsData() {
    const db = wx.cloud.database()
    
    // 实际商品数据 (根据 新建文本文档.txt 更新)
    const products = [
      {
        id: 2,
        name: "O型基础套装",
        colors: ["银粉蓝"],
        styles: ["天猫款", "基础款"],
        sizes: ["金球", "北斗"],
        packaging: "无",
        giftBag: "无",
        prices: [
          { combination: "天猫款+金球", price: 199 },
          { combination: "金球+基础款", price: 219 },
          { combination: "天猫款+金球", price: 239 }, // 注意：源数据中 "天猫款+金球" 重复
          { combination: "金球+基础款", price: 209 }  // 注意：源数据中 "金球+基础款" 重复，这里保留了第二个价格
        ],
        description: "站务",
        imageUrl: "cloud://cloud1-2g5ar9yr97b49f2f.636c-cloud1-2g5ar9yr97b49f2f-1361317451/products/ox/oxing1.png"
      },
      {
        id: 1,
        name: "磁悬浮猫语世界",
        colors: ["桃夭粉", "天青色"],
        styles: ["天猫"],
        sizes: ["金球", "北斗"],
        packaging: ["礼盒", "天地盖"],
        giftBag: ["是", "否"],
        prices: [
          { combination: "天猫+金球", price: 399 },
          { combination: "天猫+北斗", price: 359 }
        ],
        description: "沾污",
        imageUrl: "cloud://cloud1-2g5ar9yr97b49f2f.636c-cloud1-2g5ar9yr97b49f2f-1361317451/products/tm/tianmao2s.png"
      },
      {
        id: 3,
        name: "积木天猫套装",
        colors: ["白色"],
        styles: ["天猫款", "基础款"],
        sizes: ["金球", "北斗"],
        packaging: "无",
        giftBag: "无",
        prices: [
          { combination: "天猫款+金球", price: 599 },
          { combination: "基础款+金球", price: 499 },
          { combination: "天猫款+北斗", price: 455 },
          { combination: "基础款+北斗", price: 459 }
        ],
        description: "暂无",
        imageUrl: "cloud://cloud1-2g5ar9yr97b49f2f.636c-cloud1-2g5ar9yr97b49f2f-1361317451/products/my/tianmao1.png"
      }
    ]

    try {
      // 检查products集合是否为空
      const { total } = await db.collection('products').count()
      
      // 只有当集合为空时才添加数据
      if (total === 0) {
        console.log('开始初始化商品数据...')
        
        // 添加商品数据
        for (const product of products) {
          await db.collection('products').add({
            data: product
          })
        }
        
        console.log('商品数据初始化成功')
      } else {
        console.log('商品数据已存在，无需初始化')
      }
    } catch (error) {
      console.error('初始化商品数据失败：', error)
    }
  },

  // 设置管理员登录状态
  setAdminLogin(username) {
    this.globalData.isAdminLoggedIn = true
    this.globalData.adminUsername = username
    wx.setStorageSync('adminUsername', username)
  },

  // 管理员退出登录
  adminLogout() {
    this.globalData.isAdminLoggedIn = false
    this.globalData.adminUsername = null
    wx.removeStorageSync('adminUsername')
  },

  globalData: {
    systemInfo: null,
    userInfo: null,
    isLoggedIn: false,
    isAdminLoggedIn: false,
    adminUsername: null,
    needLogin: false
  }
}) 
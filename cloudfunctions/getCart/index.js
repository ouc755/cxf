// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const toysCollection = db.collection('toys')
const productsCollection = db.collection('products')
const tokensCollection = db.collection('tokens')
const usersCollection = db.collection('users')

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { token } = event
  
  try {
    // 验证OPENID
    if (!wxContext.OPENID) {
      return {
        success: false,
        error: '无法获取用户标识'
      }
    }

    // 获取最新的用户信息
    const userResult = await usersCollection.where({
      _openid: wxContext.OPENID
    }).get()

    let userInfo = null
    if (userResult.data.length > 0) {
      userInfo = userResult.data[0]
    }

    // 如果提供了token，则验证token
    if (token) {
      // 查询token有效性
      const tokenResult = await tokensCollection.where({ token }).get()
      if (tokenResult.data.length === 0) {
        return {
          success: false,
          error: '登录已失效，请重新登录'
        }
      }

      // 检查token是否过期
      const tokenData = tokenResult.data[0]
      if (new Date(tokenData.expireTime) < new Date()) {
        return {
          success: false,
          error: 'token已过期，请重新登录'
        }
      }

      // 校验token和openid是否匹配
      if (tokenData.openid !== wxContext.OPENID) {
        return {
          success: false,
          error: '登录状态异常，请重新登录'
        }
      }
    }

    // 获取用户的购物车
    const { data: cart } = await toysCollection.where({
      _openid: wxContext.OPENID,
      type: 'cart'
    }).get()

    // 如果用户没有购物车，创建一个新的
    if (!cart || cart.length === 0) {
      const newCart = {
        _openid: wxContext.OPENID,
        type: 'cart',
        products: [],
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
      
      const addResult = await toysCollection.add({
        data: newCart
      })
      
      return {
        success: true,
        cart: newCart,
        cartId: addResult._id,
        userInfo // 返回用户信息
      }
    }

    // 获取购物车中商品的详细信息
    const cartData = cart[0]
    if (cartData.products && cartData.products.length > 0) {
      const productsWithDetails = await Promise.all(
        cartData.products.map(async (product) => {
          try {
            const productDetail = await productsCollection.doc(product.productId).get()
            return {
              ...productDetail.data,
              ...product // 保证购物车中的 quantity、selected 等字段优先
            }
          } catch (error) {
            console.error('获取商品详情失败:', error)
            return product
          }
        })
      )
      cartData.products = productsWithDetails
    }
    
    return {
      success: true,
      cart: cartData,
      cartId: cartData._id,
      userInfo // 返回用户信息
    }
    
  } catch (error) {
    console.error('获取购物车失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
} 
// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-2g5ar9yr97b49f2f'
})

const db = cloud.database()
const toysCollection = db.collection('toys')
const tokensCollection = db.collection('tokens')

// 云函数入口函数
exports.main = async (event, context) => {
  const { token, cartId } = event
  const wxContext = cloud.getWXContext()
  
  try {
    // 验证管理员token
    const tokenResult = await tokensCollection.where({
      token,
      isAdmin: true
    }).get()

    if (tokenResult.data.length === 0) {
      return {
        success: false,
        error: '无管理员权限'
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

    // 删除购物车
    await toysCollection.doc(cartId).remove()

    return {
      success: true
    }
  } catch (error) {
    console.error('删除购物车失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
} 
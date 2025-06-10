// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-2g5ar9yr97b49f2f'
})

const db = cloud.database()
const toysCollection = db.collection('toys')

// 验证参数
function validateParams(cartItemId, openid) {
  if (!cartItemId) {
    throw new Error('商品ID不能为空')
  }
  if (!openid) {
    throw new Error('获取用户openid失败')
  }
}

// 删除购物车商品
async function removeCartItem(cartItemId, openid) {
  const result = await toysCollection.where({
    _id: cartItemId,
    _openid: openid,
    type: 'cart'
  }).remove()

  if (result.stats.removed === 0) {
    throw new Error('商品不存在或无权限删除')
  }

  return result
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { cartItemId } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  try {
    // 验证参数
    validateParams(cartItemId, openid)

    // 删除商品
    await removeCartItem(cartItemId, openid)

    return {
      success: true,
      message: '删除成功'
    }

  } catch (error) {
    console.error('[删除购物车商品失败]', error)
    return {
      success: false,
      error: error.message || '删除失败，请重试'
    }
  }
} 
// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-2g5ar9yr97b49f2f'
})

const db = cloud.database()
const cartsCollection = db.collection('carts')

// 验证参数
function validateParams(cartItemId, selected, openid) {
  if (!cartItemId) {
    throw new Error('商品ID不能为空')
  }
  if (!openid) {
    throw new Error('获取用户openid失败')
  }
  if (typeof selected !== 'boolean') {
    throw new Error('选中状态参数无效')
  }
}

// 获取用户购物车
async function getUserCart(openid) {
  const cartResult = await cartsCollection
    .where({
      _openid: openid
    })
    .get()

  if (!cartResult.data.length) {
    throw new Error('购物车不存在')
  }

  return cartResult.data[0]
}

// 更新商品选中状态
async function updateItemSelectedStatus(cart, cartItemId, selected) {
  const products = cart.products || []
  const productIndex = products.findIndex(p => p._id === cartItemId)
  
  if (productIndex === -1) {
    throw new Error('商品不存在')
  }

  products[productIndex].selected = selected

  await cartsCollection.doc(cart._id).update({
    data: {
      products: products,
      updateTime: db.serverDate()
    }
  })

  return products
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { cartItemId, selected } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  try {
    // 验证参数
    validateParams(cartItemId, selected, openid)

    // 获取用户购物车
    const cart = await getUserCart(openid)

    // 更新商品选中状态
    const updatedProducts = await updateItemSelectedStatus(cart, cartItemId, selected)

    return {
      success: true,
      data: {
        products: updatedProducts
      }
    }

  } catch (error) {
    console.error('[更新商品选中状态失败]', error)
    return {
      success: false,
      error: error.message || '更新失败，请重试'
    }
  }
} 
// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-2g5ar9yr97b49f2f'
})

const db = cloud.database()
const cartsCollection = db.collection('carts')

// 验证参数
function validateParams(cartItemId, quantity, openid) {
  if (!cartItemId) {
    throw new Error('商品ID不能为空')
  }
  if (!openid) {
    throw new Error('获取用户openid失败')
  }
  if (typeof quantity !== 'number' || quantity < 1) {
    throw new Error('商品数量必须大于0')
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

// 更新商品数量
async function updateItemQuantity(cart, cartItemId, quantity) {
  const products = cart.products || []
  const productIndex = products.findIndex(p => p._id === cartItemId)
  
  if (productIndex === -1) {
    throw new Error('商品不存在')
  }

  products[productIndex].quantity = quantity

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
  const { cartItemId, quantity } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  try {
    // 验证参数
    validateParams(cartItemId, quantity, openid)

    // 获取用户购物车
    const cart = await getUserCart(openid)

    // 更新商品数量
    const updatedProducts = await updateItemQuantity(cart, cartItemId, quantity)

    return {
      success: true,
      data: {
        products: updatedProducts
      }
    }

  } catch (error) {
    console.error('[更新购物车商品数量失败]', error)
    return {
      success: false,
      error: error.message || '更新失败，请重试'
    }
  }
} 
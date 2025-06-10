// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-2g5ar9yr97b49f2f'
})

const db = cloud.database()
const toysCollection = db.collection('toys')
const _ = db.command

// 验证商品参数
function validateToyParams(toy) {
  if (!toy) {
    throw new Error('商品信息不能为空')
  }

  const requiredFields = ['name', 'price', 'image']
  const missingFields = requiredFields.filter(field => !toy[field])
  
  if (missingFields.length > 0) {
    throw new Error(`缺少必要的商品信息: ${missingFields.join(', ')}`)
  }

  if (typeof toy.price !== 'number' || toy.price <= 0) {
    throw new Error('商品价格必须大于0')
  }
}

// 检查购物车中是否已存在该商品
async function checkExistingCartItem(openid, toyId) {
  const result = await toysCollection.where({
    _openid: openid,
    type: 'cart',
    toyId: toyId
  }).get()

  return result.data[0]
}

// 更新购物车商品数量
async function updateCartItemQuantity(cartItem) {
  await toysCollection.doc(cartItem._id).update({
    data: {
      quantity: _.inc(1),
      updateTime: db.serverDate()
    }
  })

  return {
    ...cartItem,
    quantity: cartItem.quantity + 1
  }
}

// 创建新的购物车项目
async function createCartItem(openid, toy) {
  const result = await toysCollection.add({
    data: {
      type: 'cart',
      _openid: openid,
      toyId: toy._id,
      name: toy.name,
      price: toy.price,
      image: toy.image,
      quantity: 1,
      selected: true,
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  })

  return {
    _id: result._id,
    type: 'cart',
    _openid: openid,
    toyId: toy._id,
    name: toy.name,
    price: toy.price,
    image: toy.image,
    quantity: 1,
    selected: true
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { toy } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  try {
    // 验证参数
    if (!openid) {
      throw new Error('获取用户openid失败')
    }

    validateToyParams(toy)

    // 检查购物车中是否已存在该商品
    const existingItem = await checkExistingCartItem(openid, toy._id)

    let cartItem
    if (existingItem) {
      // 更新数量
      cartItem = await updateCartItemQuantity(existingItem)
    } else {
      // 创建新项目
      cartItem = await createCartItem(openid, toy)
    }

    return {
      success: true,
      data: cartItem
    }

  } catch (error) {
    console.error('[添加购物车失败]', error)
    return {
      success: false,
      error: error.message || '添加购物车失败，请重试'
    }
  }
} 
// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-2g5ar9yr97b49f2f'
})

const db = cloud.database()
const productsCollection = db.collection('products')
const MAX_LIMIT = 100

// 商品数据验证
function validateProduct(product) {
  const requiredFields = ['id', 'name', 'price', 'imageUrl', 'description']
  const missingFields = requiredFields.filter(field => !product[field])
  
  if (missingFields.length > 0) {
    throw new Error(`商品缺少必要字段: ${missingFields.join(', ')}`)
  }

  if (typeof product.price !== 'number' || product.price <= 0) {
    throw new Error(`商品 ${product.name} 的价格无效`)
  }

  if (!product.imageUrl.startsWith('cloud://')) {
    throw new Error(`商品 ${product.name} 的图片URL必须是云存储路径`)
  }
}

// 批量删除数据
async function batchDelete() {
  const total = await productsCollection.count()
  const batchTimes = Math.ceil(total.total / MAX_LIMIT)
  
  const tasks = []
  for (let i = 0; i < batchTimes; i++) {
    const promise = productsCollection
      .skip(i * MAX_LIMIT)
      .limit(MAX_LIMIT)
      .get()
      .then(async res => {
        const ids = res.data.map(item => item._id)
        const deletePromises = ids.map(id => 
          productsCollection.doc(id).remove()
        )
        return Promise.all(deletePromises)
      })
    tasks.push(promise)
  }

  await Promise.all(tasks)
}

// 批量插入数据
async function batchInsert(products) {
  const tasks = []
  const batchSize = 20 // 每批次插入的数量

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize)
    const promise = Promise.all(
      batch.map(product => 
        productsCollection.add({
          data: {
            ...product,
            createTime: db.serverDate(),
            updateTime: db.serverDate(),
            sales: 0,
            status: 'on' // on: 上架, off: 下架
          }
        })
      )
    )
    tasks.push(promise)
  }

  await Promise.all(tasks)
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { products = [], clearExisting = true } = event
  
  try {
    // 验证所有商品数据
    products.forEach(validateProduct)

    // 清空现有数据
    if (clearExisting) {
      console.log('开始清空现有商品数据...')
      await batchDelete()
      console.log('清空商品数据完成')
    }

    // 插入新的商品数据
    if (products.length > 0) {
      console.log('开始插入新商品数据...')
      await batchInsert(products)
      console.log('插入商品数据完成')
    }

    return {
      success: true,
      message: '商品数据初始化成功',
      data: {
        totalProducts: products.length
      }
    }

  } catch (error) {
    console.error('[初始化商品数据失败]', error)
    return {
      success: false,
      error: error.message || '初始化商品数据失败，请重试'
    }
  }
} 
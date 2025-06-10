// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-2g5ar9yr97b49f2f'
})

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  
  try {
    // 获取所有集合
    const { data: collections } = await db.listCollections().get()
    
    // 检查必要的集合是否存在
    const requiredCollections = [
      'admins',
      'adminUsers',
      'products',
      'orders',
      'users',
      'carts'
    ]
    
    const existingCollections = collections.map(col => col.name)
    const missingCollections = requiredCollections.filter(
      name => !existingCollections.includes(name)
    )
    
    // 如果有缺失的集合，创建它们
    for (const colName of missingCollections) {
      await db.createCollection(colName)
    }

    return {
      code: 200,
      data: {
        existing: existingCollections,
        created: missingCollections
      },
      msg: missingCollections.length > 0 
        ? `已创建缺失的集合: ${missingCollections.join(', ')}` 
        : '所有必要的集合都已存在'
    }
  } catch (error) {
    console.error('检查集合失败：', error)
    return {
      code: 500,
      msg: error.message
    }
  }
} 
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-2g5ar9yr97b49f2f'
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const collection = db.collection('toys')
    
    // 创建所有需要的索引
    const indexes = [
      {
        key: { createTime: -1 },
        name: 'createTime_desc'
      },
      {
        key: { price: 1 },
        name: 'price_asc'
      },
      {
        key: { category: 1 },
        name: 'category'
      },
      {
        key: { viewCount: -1 },
        name: 'viewCount_desc'
      },
      {
        key: { isRecommend: 1, createTime: -1 },
        name: 'recommend_time'
      }
    ]

    // 创建每个索引
    for (const index of indexes) {
      try {
        await collection.createIndex(index.key, { name: index.name })
        console.log(`索引 ${index.name} 创建成功`)
      } catch (error) {
        console.error(`索引 ${index.name} 创建失败:`, error)
      }
    }

    return {
      success: true,
      message: '所有索引创建完成'
    }
  } catch (error) {
    console.error('创建索引失败：', error)
    return {
      success: false,
      error: error
    }
  }
} 
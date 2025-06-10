// 创建 toys 集合的索引
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-2g5ar9yr97b49f2f'  // 您的云环境 ID
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    // 创建 createTime 降序索引
    const result = await db.collection('toys')
      .createIndex({
        createTime: -1  // -1 表示降序
      }, {
        name: 'createTime_desc'  // 索引名称
      })
    
    console.log('索引创建成功：', result)
    return {
      success: true,
      message: '索引创建成功'
    }
  } catch (error) {
    console.error('创建索引失败：', error)
    return {
      success: false,
      error: error
    }
  }
} 
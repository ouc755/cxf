// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-2g5ar9yr97b49f2f'
})

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  
  try {
    // 检查admins集合是否存在
    const collections = await db.listCollections().get()
    const hasAdmins = collections.data.some(col => col.name === 'admins')
    const hasAdminUsers = collections.data.some(col => col.name === 'adminUsers')
    
    // 如果集合不存在，创建集合
    if (!hasAdmins) {
      await db.createCollection('admins')
    }
    if (!hasAdminUsers) {
      await db.createCollection('adminUsers')
    }

    return {
      code: 200,
      msg: '初始化管理员集合成功'
    }
  } catch (error) {
    console.error('初始化管理员集合失败：', error)
    return {
      code: 500,
      msg: error.message
    }
  }
} 
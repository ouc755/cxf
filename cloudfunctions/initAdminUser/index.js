// 云函数入口文件
const cloud = require('wx-server-sdk')
const crypto = require('crypto')
const PASSWORD_SALT = 'your-salt-here' // 保持和adminLogin里一致

cloud.init({
  env: 'cloud1-2g5ar9yr97b49f2f'
})

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  
  try {
    console.log('开始初始化管理员账号...')

    // 1. 尝试直接创建集合（已存在会报错，忽略即可）
    try { await db.createCollection('adminUsers') } catch (e) {}
    try { await db.createCollection('loginAttempts') } catch (e) {}

    // 2. 检查 adminUsers 集合中是否已有管理员账号
    try {
      const { data } = await db.collection('adminUsers')
        .where({
          username: 'admin'
        })
        .get()
      
      console.log('查询现有管理员账号结果：', data)

      if (data && data.length > 0) {
        console.log('管理员账号已存在')
        return {
          code: 200,
          msg: '管理员账号已存在'
        }
      }
    } catch (err) {
      console.error('查询管理员账号失败：', err)
      throw err
    }

    // 3. 创建新的管理员账号
    try {
      const hashedPassword = crypto
        .createHash('sha256')
        .update('admin123' + PASSWORD_SALT)
        .digest('hex')
      const result = await db.collection('adminUsers').add({
        data: {
          username: 'admin',
          password: hashedPassword,
          role: 'admin',
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })

      console.log('创建管理员账号成功：', result)

      return {
        code: 200,
        msg: '初始化管理员账号成功',
        data: {
          username: 'admin',
          password: hashedPassword
        }
      }
    } catch (err) {
      console.error('创建管理员账号失败：', err)
      throw err
    }
  } catch (error) {
    console.error('初始化管理员账号失败：', error)
    return {
      code: 500,
      msg: '初始化失败：' + error.message,
      error: error
    }
  }
} 
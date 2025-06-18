// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const usersCollection = db.collection('users')

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { userInfo } = event

  try {
    if (!openid) {
      throw new Error('获取用户openid失败')
    }

    if (!userInfo) {
      throw new Error('用户信息不能为空')
    }

    // 更新用户信息
    const result = await usersCollection.where({
      _openid: openid
    }).update({
      data: {
        ...userInfo,
        updateTime: db.serverDate()
      }
    })

    if (result.stats.updated === 0) {
      throw new Error('用户不存在')
    }

    // 获取更新后的用户信息
    const updatedUser = await usersCollection.where({
      _openid: openid
    }).get()

    return {
      success: true,
      data: updatedUser.data[0]
    }

  } catch (error) {
    console.error('[更新用户信息失败]', error)
    return {
      success: false,
      error: error.message || '更新用户信息失败'
    }
  }
} 
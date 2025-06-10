// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-2g5ar9yr97b49f2f'
})

const db = cloud.database()
const usersCollection = db.collection('users')

// 生成唯一token
function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// 验证用户信息格式
function validateUserInfo(userInfo) {
  if (!userInfo) {
    throw new Error('缺少用户信息')
  }

  const requiredFields = ['nickName', 'avatarUrl', 'gender', 'country', 'province', 'city']
  const missingFields = requiredFields.filter(field => !userInfo[field])
  
  if (missingFields.length > 0) {
    throw new Error(`缺少必要的用户信息字段: ${missingFields.join(', ')}`)
  }
}

// 更新或创建用户记录
async function upsertUser(openid, userInfo) {
  const { nickName, avatarUrl, gender, country, province, city } = userInfo
  const now = db.serverDate()

  const userRecord = {
    nickName,
    avatarUrl,
    gender,
    country,
    province,
    city,
    updateTime: now
  }

  // 查找现有用户
  const existingUser = await usersCollection.where({
    _openid: openid
  }).get()

  if (existingUser.data.length > 0) {
    // 更新现有用户
    await usersCollection.where({
      _openid: openid
    }).update({
      data: userRecord
    })
    return existingUser.data[0]._id
  } else {
    // 创建新用户
    const result = await usersCollection.add({
      data: {
        ...userRecord,
        _openid: openid,
        createTime: now,
        isAdmin: false
      }
    })
    return result._id
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { userInfo } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  try {
    // 验证参数
    if (!openid) {
      throw new Error('获取用户openid失败')
    }

    validateUserInfo(userInfo)

    // 更新或创建用户记录
    const userId = await upsertUser(openid, userInfo)

    // 生成登录token
    const token = generateToken()

    return {
      success: true,
      data: {
        openid,
        userId,
        token
      }
    }

  } catch (error) {
    console.error('[登录失败]', error)
    return {
      success: false,
      error: error.message || '登录失败，请重试'
    }
  }
} 
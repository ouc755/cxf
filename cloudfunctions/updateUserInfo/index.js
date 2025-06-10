// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-2g5ar9yr97b49f2f'
})

const db = cloud.database()
const usersCollection = db.collection('users')
const tokensCollection = db.collection('tokens')

// 验证参数
function validateParams(token, userInfo) {
  if (!token) {
    throw new Error('缺少token参数')
  }
  if (!userInfo) {
    throw new Error('缺少用户信息')
  }
  
  // 验证必要的用户信息字段
  const requiredFields = ['nickName', 'avatarUrl']
  const missingFields = requiredFields.filter(field => !userInfo[field])
  
  if (missingFields.length > 0) {
    throw new Error(`缺少必要的用户信息字段: ${missingFields.join(', ')}`)
  }
}

// 验证token并获取用户openid
async function verifyToken(token) {
  const tokenResult = await tokensCollection.where({
    token: token,
    expireTime: db.command.gt(db.serverDate())
  }).get()
  
  if (tokenResult.data.length === 0) {
    throw new Error('无效的token或token已过期')
  }
  
  return tokenResult.data[0].openid
}

// 更新用户信息
async function updateUser(openid, userInfo) {
  // 过滤掉不允许更新的字段
  const allowedFields = ['nickName', 'avatarUrl', 'gender', 'country', 'province', 'city']
  const updateData = {}
  
  allowedFields.forEach(field => {
    if (userInfo[field] !== undefined) {
      updateData[field] = userInfo[field]
    }
  })

  // 添加更新时间
  updateData.updateTime = db.serverDate()

  // 更新用户信息
  await usersCollection.where({
    _openid: openid
  }).update({
    data: updateData
  })

  // 获取更新后的用户信息
  const userResult = await usersCollection.where({
    _openid: openid
  }).get()

  if (userResult.data.length === 0) {
    throw new Error('获取更新后的用户信息失败')
  }

  return userResult.data[0]
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { token, userInfo } = event
  
  try {
    // 验证参数
    validateParams(token, userInfo)

    // 验证token并获取openid
    const openid = await verifyToken(token)

    // 更新用户信息
    const updatedUser = await updateUser(openid, userInfo)

    return {
      success: true,
      data: updatedUser
    }

  } catch (error) {
    console.error('[更新用户信息失败]', error)
    return {
      success: false,
      error: error.message || '更新用户信息失败，请重试'
    }
  }
} 
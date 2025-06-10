// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-2g5ar9yr97b49f2f'
})

const db = cloud.database()
const usersCollection = db.collection('users')

// 默认用户信息
const DEFAULT_USER_INFO = {
  nickName: '未知用户',
  avatarUrl: 'cloud://cloud1-2g5ar9yr97b49f2f.636c-cloud1-2g5ar9yr97b49f2f-1361317451/default/default-avatar.png',
  gender: 0,
  country: '',
  province: '',
  city: ''
}

// 验证参数
function validateParams(openid) {
  if (!openid) {
    throw new Error('缺少openid参数')
  }
}

// 获取用户信息
async function getUserData(openid) {
  const userResult = await usersCollection.where({
    _openid: openid
  }).get()

  if (userResult.data.length === 0) {
    return DEFAULT_USER_INFO
  }

  const userData = userResult.data[0]
  return {
    nickName: userData.nickName || DEFAULT_USER_INFO.nickName,
    avatarUrl: userData.avatarUrl || DEFAULT_USER_INFO.avatarUrl,
    gender: userData.gender || DEFAULT_USER_INFO.gender,
    country: userData.country || DEFAULT_USER_INFO.country,
    province: userData.province || DEFAULT_USER_INFO.province,
    city: userData.city || DEFAULT_USER_INFO.city
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { openid } = event
  
  try {
    // 验证参数
    validateParams(openid)

    // 获取用户信息
    const userInfo = await getUserData(openid)

    return {
      success: true,
      data: userInfo
    }

  } catch (error) {
    console.error('[获取用户信息失败]', error)
    return {
      success: false,
      error: error.message || '获取用户信息失败，请重试'
    }
  }
} 
// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const usersCollection = db.collection('users')

// 生成token
function generateToken() {
  return Math.random().toString(36).substr(2) + Date.now().toString(36)
}

// 验证用户信息格式
function validateUserInfo(userInfo) {
  if (!userInfo) {
    throw new Error('缺少用户信息')
  }

  // 只校验 nickName 和 avatarUrl
  const requiredFields = ['nickName', 'avatarUrl']
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
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { userInfo } = event // 从前端接收userInfo

  try {
    if (!openid) {
      throw new Error('获取用户openid失败')
    }

    // 查找用户是否已存在
    const userResult = await usersCollection.where({
      _openid: openid
    }).get()

    const now = db.serverDate()
    let userId
    let updatedUserData = { // 准备要更新或创建的用户数据
      nickName: userInfo?.nickName || '',
      avatarUrl: userInfo?.avatarUrl || '',
      gender: userInfo?.gender || 0,
      country: userInfo?.country || '',
      province: userInfo?.province || '',
      city: userInfo?.city || '',
      updateTime: now
    }

    if (userResult.data.length === 0) {
      // 新用户，创建用户记录
      const result = await usersCollection.add({
        data: {
          _openid: openid,
          createTime: now,
          isAdmin: false,
          ...updatedUserData // 包含昵称、头像等
        }
      })
      userId = result._id
    } else {
      // 已存在用户，更新登录时间和用户信息
      userId = userResult.data[0]._id
      await usersCollection.doc(userId).update({
        data: updatedUserData
      })
    }

    // 获取最新完整的用户信息返回给前端
    const latestUserResult = await usersCollection.doc(userId).get()
    const latestUserInfo = latestUserResult.data

    // 生成登录token
    const token = generateToken()
    const tokensCollection = db.collection('tokens')

    // 清理该用户旧的token（可选）
    await tokensCollection.where({ openid }).remove()

    // 设置token过期时间（7天）
    const expireTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await tokensCollection.add({
      data: {
        token,
        openid,
        expireTime
      }
    })

    return {
      success: true,
      data: {
        openid,
        userId,
        token,
        userInfo: latestUserInfo // 返回完整的用户信息
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
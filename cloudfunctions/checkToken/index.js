// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-2g5ar9yr97b49f2f'
})

const db = cloud.database()
const tokensCollection = db.collection('tokens')
const usersCollection = db.collection('users')

// 云函数入口函数
exports.main = async (event, context) => {
  const { token } = event
  const wxContext = cloud.getWXContext()
  
  console.log('开始检查token:', token)
  console.log('当前用户OPENID:', wxContext.OPENID)
  
  if (!token) {
    console.log('未提供token')
    return {
      success: false,
      error: 'Token is required'
    }
  }
  
  try {
    // 查找token记录
    console.log('查询token记录...')
    const tokenResult = await tokensCollection.where({
      token: token
    }).get()
    
    console.log('token查询结果:', tokenResult)
    
    if (tokenResult.data.length === 0) {
      console.log('未找到token记录')
      return {
        success: false,
        error: 'Invalid token'
      }
    }
    
    const tokenData = tokenResult.data[0]
    console.log('找到token记录:', tokenData)
    
    // 检查token是否过期
    const now = new Date()
    const expireTime = new Date(tokenData.expireTime)
    console.log('当前时间:', now)
    console.log('过期时间:', expireTime)
    
    if (expireTime < now) {
      console.log('token已过期')
      // 删除过期token
      await tokensCollection.doc(tokenData._id).remove()
      return {
        success: false,
        error: 'Token expired'
      }
    }
    
    // 检查token是否属于当前用户
    if (tokenData.openid !== wxContext.OPENID) {
      console.log('token与当前用户不匹配')
      return {
        success: false,
        error: 'Token not belong to current user'
      }
    }
    
    // 获取用户信息
    console.log('获取用户信息...')
    const userResult = await usersCollection.where({
      _openid: wxContext.OPENID
    }).get()
    
    console.log('用户信息查询结果:', userResult)
    
    if (userResult.data.length === 0) {
      console.log('未找到用户信息，创建新用户')
      // 创建新用户
      const userData = {
        _openid: wxContext.OPENID,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
      
      const addResult = await usersCollection.add({
        data: userData
      })
      
      return {
        success: true,
        userInfo: {
          ...userData,
          _id: addResult._id
        }
      }
    }
    
    console.log('返回用户信息')
    return {
      success: true,
      userInfo: userResult.data[0]
    }
    
  } catch (error) {
    console.error('检查token失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
} 
// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    return {
      success: true,
      message: 'Test function working'
    }
  } catch (error) {
    return {
      success: false,
      error: error
    }
  }
} 
 
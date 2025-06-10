// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  const _ = db.command
  const $ = db.command.aggregate

  try {
    // 验证管理员token
    const { token, page = 1, pageSize = 20 } = event
    if (!token) {
      return {
        success: false,
        error: '未提供认证信息',
        errCode: -401
      }
    }

    // 验证token有效性
    const adminResult = await db.collection('admins')
      .where({
        token,
        tokenExpireTime: _.gt(Date.now())
      })
      .get()

    if (!adminResult.data || adminResult.data.length === 0) {
      return {
        success: false,
        error: '认证已过期或无效',
        errCode: -401
      }
    }

    // 计算总数
    const countResult = await db.collection('carts').count()
    const total = countResult.total
    const totalPages = Math.ceil(total / pageSize)

    // 获取购物车数据
    const cartsResult = await db.collection('carts')
      .aggregate()
      .lookup({
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userInfo'
      })
      .unwind({
        path: '$userInfo',
        preserveNullAndEmptyArrays: true
      })
      .sort({
        updateTime: -1
      })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .end()

    return {
      success: true,
      data: cartsResult.list,
      total,
      totalPages,
      currentPage: page
    }

  } catch (error) {
    console.error('获取购物车列表失败：', error)
    return {
      success: false,
      error: error.message || '服务器内部错误',
      errCode: error.errCode || -500
    }
  }
} 
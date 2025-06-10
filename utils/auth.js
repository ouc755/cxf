// 登录相关的工具函数

const TOKEN_KEY = 'user_token';
const USER_INFO_KEY = 'user_info';

// 检查登录状态
const checkSession = () => {
  return new Promise((resolve) => {
    const app = getApp()
    // 直接使用全局登录状态
    resolve(app.globalData.isLoggedIn)
  })
}

// 基础登录，获取openid和session_key
const login = () => {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'login',  // 需要创建云函数login
      success: async (res) => {
        if (res.result && res.result.openid) {
          const { openid } = res.result;
          // 查询或创建用户记录
          const db = wx.cloud.database();
          try {
            // 查询用户是否存在
            const userResult = await db.collection('users').where({
              _openid: openid
            }).get();
            
            let userData;
            if (userResult.data.length === 0) {
              // 用户不存在，创建新用户记录
              const newUser = {
                _openid: openid,
                createTime: db.serverDate(),
                lastLoginTime: db.serverDate(),
                // 可以添加其他默认用户数据
              };
              const addResult = await db.collection('users').add({
                data: newUser
              });
              userData = { ...newUser, _id: addResult._id };
            } else {
              // 用户存在，更新登录时间
              userData = userResult.data[0];
              await db.collection('users').doc(userData._id).update({
                data: {
                  lastLoginTime: db.serverDate()
                }
              });
            }
            
            // 存储用户数据
            wx.setStorageSync(TOKEN_KEY, openid);
            wx.setStorageSync(USER_INFO_KEY, userData);
            resolve(userData);
          } catch (err) {
            console.error('处理用户数据失败：', err);
            reject(err);
          }
        } else {
          reject(new Error('登录失败'));
        }
      },
      fail: reject
    });
  });
};

// 获取用户信息并更新到数据库
const getUserProfile = () => {
  return new Promise((resolve, reject) => {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: async (res) => {
        const userInfo = res.userInfo;
        try {
          // 更新数据库中的用户信息
          const db = wx.cloud.database();
          const openid = wx.getStorageSync(TOKEN_KEY);
          
          if (!openid) {
            throw new Error('未登录');
          }

          await db.collection('users').where({
            _openid: openid
          }).update({
            data: {
              userInfo: userInfo,
              updateTime: db.serverDate()
            }
          });

          // 更新本地存储
          const localUserData = wx.getStorageSync(USER_INFO_KEY) || {};
          const updatedUserData = { ...localUserData, userInfo };
          wx.setStorageSync(USER_INFO_KEY, updatedUserData);
          
          resolve(updatedUserData);
        } catch (err) {
          console.error('更新用户信息失败：', err);
          reject(err);
        }
      },
      fail: reject
    });
  });
};

// 检查是否已登录
const checkLogin = () => {
  const token = wx.getStorageSync(TOKEN_KEY);
  const userInfo = wx.getStorageSync(USER_INFO_KEY);
  return !!token && !!userInfo;
};

// 获取存储的token (openid)
const getToken = () => {
  return wx.getStorageSync(TOKEN_KEY);
};

// 获取存储的用户信息
const getUserInfo = () => {
  return wx.getStorageSync(USER_INFO_KEY);
};

// 登出
const logout = () => {
  wx.removeStorageSync(TOKEN_KEY);
  wx.removeStorageSync(USER_INFO_KEY);
};

// 检查并更新用户信息
const refreshUserInfo = async () => {
  const openid = getToken();
  if (!openid) {
    return null;
  }

  try {
    const db = wx.cloud.database();
    const userResult = await db.collection('users').where({
      _openid: openid
    }).get();

    if (userResult.data.length > 0) {
      const userData = userResult.data[0];
      wx.setStorageSync(USER_INFO_KEY, userData);
      return userData;
    }
    return null;
  } catch (err) {
    console.error('刷新用户信息失败：', err);
    return null;
  }
};

// 检查并执行登录
const ensureLogin = async () => {
  const isSessionValid = await checkSession()
  if (!isSessionValid) {
    return await login()
  }
  return true
}

module.exports = {
  checkSession,
  login,
  getUserProfile,
  checkLogin,
  getToken,
  getUserInfo,
  logout,
  refreshUserInfo,
  ensureLogin
} 
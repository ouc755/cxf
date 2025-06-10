const cloud = require('wx-server-sdk');

cloud.init({
  env: 'cloud1-2g5ar9yr97b49f2f'
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const { collection, items } = event;
  
  try {
    const results = [];
    
    // 批量导入数据
    for (const item of items) {
      const { _id, ...data } = item;
      
      const result = await db.collection(collection).add({
        data: {
          ...data,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      });
      
      results.push(result);
    }
    
    return {
      success: true,
      data: results
    };
  } catch (error) {
    return {
      success: false,
      error: error
    };
  }
}; 
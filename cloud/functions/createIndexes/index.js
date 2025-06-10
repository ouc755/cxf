const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  const db = cloud.database();
  
  try {
    // 创建商品集合的索引
    await db.collection('toys').createIndexes([
      {
        // 分类索引
        key: {
          category: 1
        },
        name: 'category_idx'
      },
      {
        // 创建时间索引（用于新品排序）
        key: {
          createTime: -1
        },
        name: 'createTime_idx'
      },
      {
        // 销量索引（用于热销排序）
        key: {
          sales: -1
        },
        name: 'sales_idx'
      },
      {
        // 商品名称索引（用于搜索）
        key: {
          name: 'text'
        },
        name: 'name_text_idx'
      }
    ]);

    return {
      success: true,
      message: '索引创建成功'
    };
  } catch (error) {
    console.error('创建索引失败：', error);
    return {
      success: false,
      error: error
    };
  }
}; 
 
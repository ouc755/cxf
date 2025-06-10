// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 定义所有需要创建的索引
const INDEXES = {
  products: [
    {
      name: 'name_search',
      keys: { name: 1 },
      options: { unique: false }
    },
    {
      name: 'price_sort',
      keys: { price: 1 },
      options: { unique: false }
    },
    {
      name: 'createTime_sort',
      keys: { createTime: -1 },
      options: { unique: false }
    },
    {
      name: 'sales_sort',
      keys: { sales: -1 },
      options: { unique: false }
    },
    {
      name: 'status_compound',
      keys: { status: 1, createTime: -1 },
      options: { unique: false }
    }
  ],
  users: [
    {
      name: 'openid_unique',
      keys: { _openid: 1 },
      options: { unique: true }
    },
    {
      name: 'createTime_sort',
      keys: { createTime: -1 },
      options: { unique: false }
    }
  ],
  adminUsers: [
    {
      name: 'username_unique',
      keys: { username: 1 },
      options: { unique: true }
    },
    {
      name: 'session_compound',
      keys: { sessionId: 1, sessionExpireTime: 1 },
      options: { unique: false }
    }
  ],
  orders: [
    {
      name: 'user_time',
      keys: { _openid: 1, createTime: -1 },
      options: { unique: false }
    },
    {
      name: 'status_time',
      keys: { status: 1, createTime: -1 },
      options: { unique: false }
    }
  ]
};

// 创建单个集合的索引
async function createCollectionIndexes(collectionName, indexes) {
  const collection = db.collection(collectionName);
  const results = [];

  for (const index of indexes) {
    try {
      await collection.createIndex(index.keys, {
        name: index.name,
        ...index.options
      });
      results.push({
        collection: collectionName,
        index: index.name,
        status: 'success'
      });
    } catch (error) {
      console.error(`创建索引失败 [${collectionName}][${index.name}]:`, error);
      results.push({
        collection: collectionName,
        index: index.name,
        status: 'error',
        error: error.message
      });
    }
  }

  return results;
}

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const results = [];

    // 创建所有集合的索引
    for (const [collectionName, indexes] of Object.entries(INDEXES)) {
      console.log(`开始为集合 ${collectionName} 创建索引...`);
      const collectionResults = await createCollectionIndexes(collectionName, indexes);
      results.push(...collectionResults);
    }

    // 为carts集合创建索引
    await db.collection('carts').createIndexes([
      {
        key: {
          updateTime: -1
        },
        name: 'updateTime_desc'
      },
      {
        key: {
          userId: 1
        },
        name: 'userId_asc'
      }
    ]);

    // 为admins集合创建token索引
    await db.collection('admins').createIndexes([
      {
        key: {
          token: 1,
          tokenExpireTime: 1
        },
        name: 'token_expire'
      }
    ]);

    // 统计成功和失败的数量
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;

    return {
      success: true,
      message: '索引创建完成',
      data: {
        total: results.length,
        successful,
        failed,
        details: results
      }
    };
  } catch (error) {
    console.error('[创建索引失败]', error);
    return {
      success: false,
      error: error.message || '创建索引失败，请重试'
    };
  }
}; 
 
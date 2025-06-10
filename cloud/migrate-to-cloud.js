const cloud = require('wx-server-sdk');
const { MongoClient } = require('mongodb');

// 初始化云开发
cloud.init({
  env: 'cloud1-2g5ar9yr97b49f2f' // 替换为你的云开发环境ID
});

// MongoDB Atlas 连接信息
const atlasUri = 'mongodb+srv://2542134550:4EB21mxzySAd7DAY@cluster0.tdxavnf.mongodb.net/toyShop?retryWrites=true&w=majority';
const dbName = 'toyShop';

async function migrateCollection(mongoCollection, cloudCollection, transform = (item) => item) {
  const items = await mongoCollection.find({}).toArray();
  console.log(`开始迁移 ${cloudCollection} 集合，共 ${items.length} 条数据`);
  
  for (const item of items) {
    try {
      const data = transform(item);
      await cloud.database().collection(cloudCollection).add({ data });
      console.log(`成功迁移 ${cloudCollection} 数据：${item._id}`);
    } catch (error) {
      console.error(`迁移 ${cloudCollection} 数据失败：${item._id}`, error);
    }
  }
  
  console.log(`${cloudCollection} 集合迁移完成`);
}

async function migrateToCloud() {
  const mongoClient = await MongoClient.connect(atlasUri);
  const db = mongoClient.db(dbName);
  
  try {
    // 1. 迁移商品数据
    await migrateCollection(
      db.collection('toys'),
      'toys',
      (toy) => ({
        name: toy.name,
        price: toy.price,
        desc: toy.desc,
        image: toy.image,
        category: toy.category,
        size: toy.size,
        createTime: new Date(),
        updateTime: new Date()
      })
    );

    // 2. 迁移订单数据
    await migrateCollection(
      db.collection('orders'),
      'orders',
      (order) => ({
        userId: order.userId || 'legacy_user',
        status: order.status,
        totalPrice: order.totalPrice,
        items: order.items,
        address: order.address,
        createTime: new Date(order.createTime) || new Date(),
        updateTime: new Date()
      })
    );

    // 3. 迁移地址数据
    await migrateCollection(
      db.collection('addresses'),
      'addresses',
      (address) => ({
        userId: address.userId || 'legacy_user',
        name: address.name,
        phone: address.phone,
        province: address.province,
        city: address.city,
        district: address.district,
        detail: address.detail,
        isDefault: address.isDefault || false,
        createTime: new Date()
      })
    );

  } catch (error) {
    console.error('迁移过程中出错：', error);
  } finally {
    await mongoClient.close();
  }
}

// 执行迁移
migrateToCloud().then(() => {
  console.log('数据迁移完成！');
}).catch((error) => {
  console.error('迁移失败：', error);
}); 
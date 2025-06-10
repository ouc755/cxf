const cloud = require('wx-server-sdk');
const fs = require('fs');
const path = require('path');

// 初始化云开发
cloud.init({
  env: 'cloud1-2g5ar9yr97b49f2f'
});

const db = cloud.database();

async function importCollection(jsonPath, collectionName) {
  console.log(`开始导入 ${collectionName} 集合...`);
  
  try {
    // 读取 JSON 文件
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const items = Array.isArray(data) ? data : [data];
    
    console.log(`读取到 ${items.length} 条数据`);
    
    // 批量导入数据
    for (const item of items) {
      try {
        // 移除 MongoDB 的 _id 字段
        const { _id, ...itemData } = item;
        
        // 添加时间戳
        const dataToAdd = {
          ...itemData,
          createTime: new Date(),
          updateTime: new Date()
        };
        
        await db.collection(collectionName).add({
          data: dataToAdd
        });
        
        console.log(`成功导入 ${collectionName} 数据：${_id}`);
      } catch (error) {
        console.error(`导入 ${collectionName} 数据失败：`, error);
      }
    }
    
    console.log(`${collectionName} 集合导入完成`);
  } catch (error) {
    console.error(`导入 ${collectionName} 集合失败：`, error);
  }
}

async function importAllData() {
  const exportPath = path.join(__dirname, '..', 'export_data');
  
  try {
    // 导入玩具数据
    await importCollection(
      path.join(exportPath, 'toys.json'),
      'toys'
    );
    
    // 导入订单数据
    await importCollection(
      path.join(exportPath, 'orders.json'),
      'orders'
    );
    
    // 导入地址数据
    await importCollection(
      path.join(exportPath, 'addresses.json'),
      'addresses'
    );
    
    console.log('所有数据导入完成！');
  } catch (error) {
    console.error('导入过程中出错：', error);
  }
}

// 执行导入
importAllData().catch(console.error); 
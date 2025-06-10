import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 打印当前工作目录
console.log('当前工作目录:', process.cwd());
console.log('脚本所在目录:', __dirname);

// 加载环境变量
const envPath = path.join(__dirname, '../../.env');
console.log('尝试加载 .env 文件:', envPath);
dotenv.config({ path: envPath });

// 打印环境变量（不包含敏感信息）
console.log('环境变量 MONGODB_URI 是否存在:', !!process.env.MONGODB_URI);
console.log('环境变量 PORT:', process.env.PORT);
console.log('环境变量 NODE_ENV:', process.env.NODE_ENV);

const LOCAL_URI = 'mongodb://localhost:27017/toyShop';
const ATLAS_URI = process.env.MONGODB_URI;

if (!ATLAS_URI) {
  console.error('错误: 未找到 MONGODB_URI 环境变量，请确保在 .env 文件中正确配置了 MONGODB_URI');
  console.error('请检查 .env 文件是否在正确位置，并且包含正确的配置');
  process.exit(1);
}

async function migrateData() {
  let localDb, atlasDb;
  
  try {
    // 连接本地数据库
    console.log('正在连接本地数据库...');
    localDb = await mongoose.createConnection(LOCAL_URI);
    console.log('本地数据库连接成功！');

    // 连接 Atlas 数据库
    console.log('正在连接 Atlas 数据库...');
    atlasDb = await mongoose.createConnection(ATLAS_URI);
    console.log('Atlas 数据库连接成功！');

    // 获取所有集合
    const collections = await localDb.db.listCollections().toArray();
    console.log(`找到 ${collections.length} 个集合需要迁移`);

    // 遍历每个集合并迁移数据
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`\n开始迁移 ${collectionName} 集合...`);

      try {
        // 获取集合中的所有数据
        const data = await localDb.db.collection(collectionName).find({}).toArray();
        
        if (data.length > 0) {
          // 如果 Atlas 中已存在该集合，先删除
          await atlasDb.db.collection(collectionName).deleteMany({});
          // 插入数据到 Atlas
          await atlasDb.db.collection(collectionName).insertMany(data);
          console.log(`✅ ${collectionName} 集合迁移成功！共迁移 ${data.length} 条数据`);
        } else {
          console.log(`ℹ️ ${collectionName} 集合为空，跳过`);
        }
      } catch (error) {
        console.error(`❌ ${collectionName} 集合迁移失败:`, error.message);
      }
    }

    console.log('\n🎉 所有数据迁移完成！');
  } catch (error) {
    console.error('\n❌ 迁移过程中出错:', error.message);
  } finally {
    // 关闭数据库连接
    if (localDb) await localDb.close();
    if (atlasDb) await atlasDb.close();
    process.exit(0);
  }
}

migrateData(); 
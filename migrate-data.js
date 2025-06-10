const { MongoClient } = require('mongodb');

// 连接 URL
const localUrl = 'mongodb://localhost:27017';
const atlasUrl = 'mongodb+srv://2542134550:4EB21mxzySAd7DAY@cluster0.tdxavnf.mongodb.net/?retryWrites=true&w=majority';

// 数据库名称
const dbName = 'toyshop';

async function migrateData() {
  try {
    // 连接本地数据库
    console.log('Connecting to local database...');
    const localClient = await MongoClient.connect(localUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    const localDb = localClient.db(dbName);
    console.log('Connected to local database');
    
    // 连接 Atlas 数据库
    console.log('Connecting to Atlas database...');
    const atlasClient = await MongoClient.connect(atlasUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    const atlasDb = atlasClient.db(dbName);
    console.log('Connected to Atlas database');
    
    // 获取所有集合
    const collections = await localDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections to migrate`);
    
    // 遍历每个集合并迁移数据
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`Migrating collection: ${collectionName}`);
      
      try {
        // 获取集合中的所有文档
        const docs = await localDb.collection(collectionName).find({}).toArray();
        
        if (docs.length > 0) {
          // 如果集合已存在，先删除
          await atlasDb.collection(collectionName).deleteMany({});
          // 插入所有文档
          await atlasDb.collection(collectionName).insertMany(docs);
          console.log(`Migrated ${docs.length} documents in ${collectionName}`);
        } else {
          console.log(`No documents found in collection ${collectionName}`);
        }
      } catch (collectionError) {
        console.error(`Error migrating collection ${collectionName}:`, collectionError);
      }
    }
    
    console.log('Migration completed successfully!');
    
    // 关闭连接
    await localClient.close();
    await atlasClient.close();
    
  } catch (error) {
    console.error('Error during migration:', error);
    if (error.code === 'ENOTFOUND') {
      console.error('Could not resolve MongoDB Atlas hostname. Please check your internet connection and DNS settings.');
    }
  }
}

// 执行迁移
migrateData(); 
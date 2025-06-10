const { MongoClient } = require('mongodb');

// 连接字符串
const localUri = 'mongodb://localhost:27017';
const atlasUri = 'mongodb+srv://2542134550:4EB21mxzySAd7DAY@cluster0.tdxavnf.mongodb.net/?retryWrites=true&w=majority';

// 数据库名称
const dbName = 'toyShop';

// 需要迁移的集合
const collections = ['toys', 'orders', 'addresses'];

async function importData() {
    let localClient, atlasClient;
    
    try {
        // 连接本地数据库
        console.log('正在连接本地数据库...');
        localClient = await MongoClient.connect(localUri);
        const localDb = localClient.db(dbName);
        
        // 连接 Atlas
        console.log('正在连接 MongoDB Atlas...');
        atlasClient = await MongoClient.connect(atlasUri);
        const atlasDb = atlasClient.db(dbName);
        
        // 遍历并导入每个集合
        for (const collectionName of collections) {
            console.log(`\n开始导入集合: ${collectionName}`);
            
            try {
                // 读取本地数据
                const localCollection = localDb.collection(collectionName);
                const documents = await localCollection.find({}).toArray();
                
                if (documents.length > 0) {
                    console.log(`找到 ${documents.length} 条数据`);
                    
                    // 删除 Atlas 中的现有数据
                    const atlasCollection = atlasDb.collection(collectionName);
                    await atlasCollection.deleteMany({});
                    
                    // 插入数据到 Atlas
                    const result = await atlasCollection.insertMany(documents);
                    console.log(`成功导入 ${result.insertedCount} 条数据到 ${collectionName}`);
                } else {
                    console.log(`集合 ${collectionName} 中没有数据`);
                }
            } catch (error) {
                console.error(`导入集合 ${collectionName} 时出错:`, error);
            }
        }
        
        console.log('\n所有数据导入完成！');
        
    } catch (error) {
        console.error('发生错误:', error);
    } finally {
        // 关闭连接
        if (localClient) await localClient.close();
        if (atlasClient) await atlasClient.close();
        console.log('数据库连接已关闭');
    }
}

// 运行导入程序
importData(); 
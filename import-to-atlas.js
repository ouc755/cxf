const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

// Atlas 连接字符串 - 使用新的格式
const atlasUri = 'mongodb+srv://2542134550:4EB21mxzySAd7DAY@cluster0.tdxavnf.mongodb.net/toyShop?retryWrites=true&w=majority';
const dbName = 'toyShop';
const collections = ['toys', 'orders', 'addresses'];

// 导出数据目录
const exportDir = path.join(__dirname, 'export_data');

async function importToAtlas() {
    let client;
    
    try {
        // 连接到 Atlas
        console.log('正在连接 MongoDB Atlas...');
        client = await MongoClient.connect(atlasUri, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000,
            maxPoolSize: 1
        });
        
        const db = client.db(dbName);
        console.log('成功连接到 MongoDB Atlas');
        
        // 导入每个集合
        for (const collectionName of collections) {
            console.log(`\n正在处理集合: ${collectionName}`);
            
            try {
                // 读取 JSON 文件
                const filePath = path.join(exportDir, `${collectionName}.json`);
                const fileContent = await fs.readFile(filePath, 'utf8');
                const documents = JSON.parse(fileContent);
                
                if (documents.length > 0) {
                    // 获取或创建集合
                    const collection = db.collection(collectionName);
                    
                    // 清除现有数据
                    await collection.deleteMany({});
                    console.log(`清除了集合 ${collectionName} 中的现有数据`);
                    
                    // 分批插入数据，每批 100 条
                    const batchSize = 100;
                    for (let i = 0; i < documents.length; i += batchSize) {
                        const batch = documents.slice(i, i + batchSize);
                        const result = await collection.insertMany(batch);
                        console.log(`成功导入 ${result.insertedCount} 条数据到 ${collectionName} (${i + 1} 到 ${Math.min(i + batchSize, documents.length)})`);
                    }
                    console.log(`完成导入 ${documents.length} 条数据到 ${collectionName}`);
                } else {
                    console.log(`文件 ${collectionName}.json 中没有数据`);
                }
            } catch (error) {
                if (error.code === 'ENOENT') {
                    console.log(`未找到文件 ${collectionName}.json`);
                } else {
                    console.error(`处理集合 ${collectionName} 时出错:`, error);
                    console.error('错误详情:', error.stack);
                }
            }
        }
        
        console.log('\n所有数据导入完成！');
        
    } catch (error) {
        console.error('发生错误:', error);
        if (error.name === 'MongoServerSelectionError') {
            console.error('无法连接到 MongoDB Atlas。请检查网络连接和防火墙设置。');
            console.error('错误详情:', error.stack);
        }
    } finally {
        if (client) {
            await client.close();
            console.log('数据库连接已关闭');
        }
    }
}
 
// 运行导入程序
importToAtlas(); 
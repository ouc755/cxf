const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

// 连接字符串
const localUri = 'mongodb://localhost:27017';
const dbName = 'toyShop';
const collections = ['toys', 'orders', 'addresses'];

// 创建导出目录
const exportDir = path.join(__dirname, 'export_data');

async function exportData() {
    let client;
    
    try {
        // 创建导出目录
        await fs.mkdir(exportDir, { recursive: true });
        
        // 连接本地数据库
        console.log('正在连接本地数据库...');
        client = await MongoClient.connect(localUri);
        const db = client.db(dbName);
        
        // 导出每个集合
        for (const collectionName of collections) {
            console.log(`\n正在导出集合: ${collectionName}`);
            
            try {
                // 读取集合数据
                const collection = db.collection(collectionName);
                const documents = await collection.find({}).toArray();
                
                if (documents.length > 0) {
                    // 将数据写入文件
                    const filePath = path.join(exportDir, `${collectionName}.json`);
                    await fs.writeFile(
                        filePath,
                        JSON.stringify(documents, null, 2),
                        'utf8'
                    );
                    console.log(`成功导出 ${documents.length} 条数据到 ${filePath}`);
                } else {
                    console.log(`集合 ${collectionName} 中没有数据`);
                }
            } catch (error) {
                console.error(`导出集合 ${collectionName} 时出错:`, error);
            }
        }
        
        console.log('\n所有数据导出完成！');
        console.log(`数据文件保存在: ${exportDir}`);
        
    } catch (error) {
        console.error('发生错误:', error);
    } finally {
        if (client) await client.close();
        console.log('数据库连接已关闭');
    }
}

// 运行导出程序
exportData(); 
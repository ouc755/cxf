const { MongoClient } = require('mongodb');

async function testConnectionSpeed(uri, name) {
    const startTime = Date.now();
    let client;
    
    try {
        console.log(`\n测试连接 ${name}...`);
        client = await MongoClient.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000
        });
        
        const endTime = Date.now();
        console.log(`✅ ${name} 连接成功！`);
        console.log(`连接时间: ${endTime - startTime}ms`);
        
        // 测试查询速度
        const db = client.db('toyShop');
        const startQueryTime = Date.now();
        await db.collection('toys').find({}).limit(1).toArray();
        const endQueryTime = Date.now();
        console.log(`查询时间: ${endQueryTime - startQueryTime}ms`);
        
    } catch (error) {
        console.error(`❌ ${name} 连接失败:`, error.message);
    } finally {
        if (client) await client.close();
    }
}

// 测试当前集群
const currentUri = 'mongodb+srv://2542134550:4EB21mxzySAd7DAY@cluster0.tdxavnf.mongodb.net/toyShop?retryWrites=true&w=majority';
testConnectionSpeed(currentUri, '当前集群'); 
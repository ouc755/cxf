const { MongoClient } = require('mongodb');

// 使用 Atlas 连接字符串
const uri = 'mongodb+srv://2542134550:4EB21mxzySAd7DAY@cluster0.tdxavnf.mongodb.net/toyShop?retryWrites=true&w=majority';
const dbName = 'toyShop';

async function testDatabaseOperations() {
    let client;
    
    try {
        // 连接数据库
        console.log('正在连接到 MongoDB Atlas...');
        client = await MongoClient.connect(uri);
        const db = client.db(dbName);
        console.log('连接成功！');

        // 1. 测试玩具集合的操作
        const toysCollection = db.collection('toys');
        
        // 测试查询操作
        console.log('\n1. 测试查询操作:');
        const allToys = await toysCollection.find({}).toArray();
        console.log(`当前玩具总数: ${allToys.length}`);
        console.log('第一个玩具信息:', allToys[0]);

        // 测试插入操作
        console.log('\n2. 测试插入操作:');
        const newToy = {
            name: '测试玩具',
            price: 99.9,
            desc: '这是一个测试玩具',
            image: '/images/test.png',
            category: '测试分类',
            size: 'M',
            originalId: Date.now()
        };
        const insertResult = await toysCollection.insertOne(newToy);
        console.log('插入结果:', insertResult);
        
        // 测试更新操作
        console.log('\n3. 测试更新操作:');
        const updateResult = await toysCollection.updateOne(
            { _id: insertResult.insertedId },
            { $set: { price: 88.8, desc: '已更新的测试玩具' } }
        );
        console.log('更新结果:', updateResult);
        
        // 验证更新
        const updatedToy = await toysCollection.findOne({ _id: insertResult.insertedId });
        console.log('更新后的玩具信息:', updatedToy);
        
        // 测试删除操作
        console.log('\n4. 测试删除操作:');
        const deleteResult = await toysCollection.deleteOne({ _id: insertResult.insertedId });
        console.log('删除结果:', deleteResult);
        
        // 验证删除
        const deletedToy = await toysCollection.findOne({ _id: insertResult.insertedId });
        console.log('删除后查询结果:', deletedToy); // 应该是 null

        // 2. 测试订单集合的操作
        console.log('\n5. 测试订单集合:');
        const ordersCollection = db.collection('orders');
        const orderCount = await ordersCollection.countDocuments();
        console.log(`当前订单总数: ${orderCount}`);
        
        // 3. 测试地址集合的操作
        console.log('\n6. 测试地址集合:');
        const addressesCollection = db.collection('addresses');
        const addressCount = await addressesCollection.countDocuments();
        console.log(`当前地址总数: ${addressCount}`);

        console.log('\n所有测试完成！');
        
    } catch (error) {
        console.error('测试过程中发生错误:', error);
    } finally {
        if (client) {
            await client.close();
            console.log('\n数据库连接已关闭');
        }
    }
}

// 运行测试
console.log('开始数据库操作测试...');
testDatabaseOperations(); 
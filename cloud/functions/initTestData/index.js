const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 示例玩具数据
const sampleToys = [
  {
    name: '乐高城市系列',
    price: 299.00,
    category: '积木拼装',
    description: '乐高城市系列警察局套装，适合6-12岁儿童',
    sales: 156,
    imageId: 'lego_city.jpg',
    createTime: new Date(),
    updateTime: new Date()
  },
  {
    name: '变形金刚',
    price: 199.00,
    category: '机器人',
    description: '经典擎天柱变形金刚玩具',
    sales: 234,
    imageId: 'transformer.jpg',
    createTime: new Date(),
    updateTime: new Date()
  },
  {
    name: '芭比娃娃',
    price: 159.00,
    category: '娃娃玩偶',
    description: '芭比之梦想豪宅系列',
    sales: 189,
    imageId: 'barbie.jpg',
    createTime: new Date(),
    updateTime: new Date()
  },
  {
    name: '遥控赛车',
    price: 259.00,
    category: '遥控玩具',
    description: '高速遥控赛车，最高速度可达25km/h',
    sales: 145,
    imageId: 'rc_car.jpg',
    createTime: new Date(),
    updateTime: new Date()
  },
  {
    name: '益智拼图',
    price: 89.00,
    category: '益智玩具',
    description: '1000片风景拼图，提高专注力',
    sales: 167,
    imageId: 'puzzle.jpg',
    createTime: new Date(),
    updateTime: new Date()
  },
  {
    name: '毛绒玩具',
    price: 129.00,
    category: '毛绒玩具',
    description: '可爱熊猫毛绒玩具，柔软舒适',
    sales: 198,
    imageId: 'plush_toy.jpg',
    createTime: new Date(),
    updateTime: new Date()
  }
];

exports.main = async (event, context) => {
  const db = cloud.database();
  
  try {
    // 清空现有数据
    const collections = ['toys', 'orders', 'cart', 'favorites'];
    for (const collection of collections) {
      try {
        const { data } = await db.collection(collection).limit(1000).get();
        for (const item of data) {
          await db.collection(collection).doc(item._id).remove();
        }
      } catch (error) {
        console.error(`清空${collection}集合失败：`, error);
      }
    }

    // 添加示例玩具数据
    for (const toy of sampleToys) {
      await db.collection('toys').add({
        data: toy
      });
    }

    return {
      success: true,
      message: '测试数据初始化成功'
    };
  } catch (error) {
    console.error('初始化测试数据失败：', error);
    return {
      success: false,
      error: error
    };
  }
}; 
 
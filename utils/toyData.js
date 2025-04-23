// 产品数据模块
module.exports = {
  toyList: [
    {
      id: 1,
      name: '毛绒熊玩偶',
      price: 39.9,
      image: '/images/bear.png',
      desc: '柔软舒适的毛绒熊玩偶',
      size: '大'
    },
    {
      id: 2,
      name: '积木玩具',
      price: 99,
      image: '/images/blocks.png',
      desc: '益智拼装积木',
      size: '中'
    },
    {
      id: 3,
      name: '遥控赛车',
      price: 129.9,
      image: '/images/car.png',
      desc: '可遥控四驱赛车',
      size: '大'
    },
    {
      id: 4,
      name: '拼图玩具',
      price: 59.9,
      image: '/images/puzzle.png',
      desc: '100片卡通拼图',
      size: '小'
    },
    {
      id: 5,
      name: '音乐盒',
      price: 79.9,
      image: '/images/musicbox.png',
      desc: '旋转木马八音盒',
      size: '小型'
    }
  ],
  orderList: [
    {
      id: 1001,
      orderNumber: '202308210001',
      date: '2023-08-21',
      status: 'completed',
      statusText: '已完成',
      items: [
        {name: '磁悬浮地球仪', price: 299, quantity: 1}
      ],
      shippingCompany: '顺丰速运',
      trackingNumber: 'SF123456789',
      shippingAddress: '北京市朝阳区xx街道',
      total: 299
    },
    {
      id: 1002,
      orderNumber: '202308220002',
      date: '2023-08-22',
      status: 'pending',
      statusText: '待发货',
      items: [
        {name: '磁悬浮音乐盒', price: 199, quantity: 2}
      ],
      shippingCompany: '',
      trackingNumber: '',
      shippingAddress: '上海市浦东新区xx路',
      total: 398
    }
  ]
};
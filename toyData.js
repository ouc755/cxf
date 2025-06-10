// toyData.js
const toys = [
  {
    id: 1,
    name: '智能机器人',
    image: '/images/toy1.jpg',
    price: 299,
    priceVariations: [299, 399, 499],
    specifications: ['基础版', '豪华版', '旗舰版'],
    sizes: ['小号25cm', '中号35cm', '大号45cm'],
    specs: [
      { label: '材质', value: '环保塑料' },
      { label: '适用年龄', value: '3岁以上' }
    ],
    desc: '智能编程机器人，培养孩子逻辑思维能力'
  }
];

module.exports = toys;
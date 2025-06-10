// 商品数据结构示例
const toyExample = {
  name: "玩具名称",
  price: 99.99,
  originalPrice: 129.99,
  category: "玩具分类",
  description: "商品描述",
  images: [
    "cloud://cloud1-2g5ar9yr97b49f2f.636c-cloud1-2g5ar9yr97b49f2f-1361317451/images/bear.png",
    "cloud://cloud1-2g5ar9yr97b49f2f.636c-cloud1-2g5ar9yr97b49f2f-1361317451/images/beij.png"
  ],
  // 使用较小的图片作为缩略图
  thumbnail: "cloud://cloud1-2g5ar9yr97b49f2f.636c-cloud1-2g5ar9yr97b49f2f-1361317451/images/blocks.png",
  createTime: new Date(),  // 创建时间
  updateTime: new Date(),  // 更新时间
  viewCount: 0,  // 查看次数
  status: "on",  // 商品状态：on-上架，off-下架
  tags: ["热门", "新品"],  // 商品标签
  specs: {  // 商品规格
    size: "中号",
    color: "红色",
    age: "3-6岁"
  },
  stock: 100,  // 库存数量
  isRecommend: false  // 是否推荐
} 
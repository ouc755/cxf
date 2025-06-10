module.exports = {
  db: {
    uri: 'mongodb://localhost:27017/toyShop?authSource=admin', // 保持标准MongoDB连接格式
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'toyShop'
    }
  }
};
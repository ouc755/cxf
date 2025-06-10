from pymongo import MongoClient

# 连接MongoDB数据库
# 配置说明：
# - localhost:27017 默认MongoDB连接地址
# - 生产环境应使用认证连接（mongodb://user:password@host:port）
client = MongoClient('mongodb://localhost:27017/')

# 选择目标数据库（示例数据库名称）
# 注意：数据库不存在时会自动创建
db = client['your_database_name']

# 获取操作集合（示例集合名称）
# 注意：集合不存在时会自动创建
collection = db['your_collection_name']

# 插入示例商品数据
# 数据结构说明：
# - name: 商品名称 (字符串类型)
# - price: 商品价格 (浮点数类型)
# - description: 商品描述 (字符串类型)
data = {
    "name": "Sample Product",
    "price": 9.99,
    "description": "This is a sample product description"
}

# 执行单条插入操作
# 返回结果包含插入文档的ObjectID
collection.insert_one(data)
from pymongo import MongoClient

# 连接 MongoDB
def connect_mongo():
    client = MongoClient('mongodb://localhost:27017/')
    return client

# 插入商品数据示例函数，假设数据库名为 cxfkj，集合名为 cxf
def insert_product(product_data):
    """插入单个商品到MongoDB集合

    Args:
        product_data (dict): 包含商品信息的字典，格式为{
            "name": "商品名称",
            "price": 商品价格,
            "description": "商品描述"
        }

    Returns:
        ObjectId: 插入文档的MongoDB ObjectID
    """
    # 建立数据库连接
    client = connect_mongo()
    # 选择目标数据库
    db = client['cxfkj']
    # 获取操作集合
    collection = db['cxf']
    
    # 执行插入操作
    result = collection.insert_one(product_data)
    
    # 关闭数据库连接
    client.close()
    
    return result.inserted_id

# 获取商品列表的函数
def get_products():
    """从MongoDB集合获取所有商品数据
    
    Returns:
        list[dict]: 包含所有商品数据的列表，格式为[{
            "name": 商品名称,
            "price": 商品价格,
            "description": 商品描述
        }]
    """
    # 建立数据库连接
    client = connect_mongo()
    # 选择目标数据库
    db = client['cxfkj']
    # 获取操作集合
    collection = db['cxf']
    
    # 执行查询操作（排除_id字段）
    products = list(collection.find({}, {"_id": 0}))
    
    # 关闭数据库连接
    client.close()
    
    return products

# 更新商品的函数
def update_product(product_id, product_data):
    """更新MongoDB集合中的单个商品

    Args:
        product_id (str): 要更新商品的MongoDB ObjectID字符串
        product_data (dict): 包含更新信息的字典

    Returns:
        bool: 更新是否成功
    """
    from bson.objectid import ObjectId
    client = connect_mongo()
    db = client['cxfkj']
    collection = db['cxf']
    try:
        # 将字符串ID转换为ObjectId
        obj_id = ObjectId(product_id)
        # 执行更新操作
        result = collection.update_one({'_id': obj_id}, {'$set': product_data})
        client.close()
        # 检查是否匹配到文档并成功修改
        return result.matched_count > 0 and result.modified_count > 0
    except Exception as e:
        print(f"更新商品时发生错误: {e}")
        client.close()
        return False

# 删除商品的函数
def delete_product(product_id):
    """从MongoDB集合中删除单个商品

    Args:
        product_id (str): 要删除商品的MongoDB ObjectID字符串

    Returns:
        bool: 删除是否成功
    """
    from bson.objectid import ObjectId
    client = connect_mongo()
    db = client['cxfkj']
    collection = db['cxf']
    try:
        # 将字符串ID转换为ObjectId
        obj_id = ObjectId(product_id)
        # 执行删除操作
        result = collection.delete_one({'_id': obj_id})
        client.close()
        # 检查是否成功删除文档
        return result.deleted_count > 0
    except Exception as e:
        print(f"删除商品时发生错误: {e}")
        client.close()
        return False
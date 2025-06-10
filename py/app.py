from flask import Flask, jsonify, request
from mongo_operations import insert_product, get_products

app = Flask(__name__)

# 获取商品列表的接口
@app.route('/products', methods=['GET'])
def get_all_products():
    products = get_products()
    return jsonify(products)

# 创建商品的接口
@app.route('/products', methods=['POST'])
def create_new_product():
    product_data = request.get_json()
    product_id = insert_product(product_data)
    return jsonify({"message": "Product created successfully", "product_id": str(product_id)}), 201

# 更新商品的接口
@app.route('/products/<string:product_id>', methods=['PUT'])
def update_existing_product(product_id):
    product_data = request.get_json()
    success = update_product(product_id, product_data)
    if success:
        return jsonify({"message": "Product updated successfully"})
    else:
        return jsonify({"message": "Product not found or update failed"}), 404

# 删除商品的接口
@app.route('/products/<string:product_id>', methods=['DELETE'])
def delete_existing_product(product_id):
    success = delete_product(product_id)
    if success:
        return jsonify({"message": "Product deleted successfully"})
    else:
        return jsonify({"message": "Product not found or delete failed"}), 404

if __name__ == '__main__':
    app.run(debug=True)
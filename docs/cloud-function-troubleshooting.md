# 云函数故障排查指南

## 1. 入口函数验证

确保云函数的入口函数格式正确：

```javascript
// ✅ 正确的入口函数格式
exports.main = async (event, context) => {
  try {
    // 业务逻辑
    return {
      code: 200,
      data: {},
      msg: 'success'
    }
  } catch (error) {
    return {
      code: 500,
      msg: error.message
    }
  }
};

// ❌ 常见错误格式
exports.main = (event, context) => {  // 缺少 async
  // ...
}
```

## 2. 超时配置

云函数默认超时时间为3秒，对于复杂操作建议调整：

1. 打开云开发控制台
2. 选择对应云函数
3. 点击"配置"选项
4. 将超时时间调整为10秒或更长

## 3. 返回格式规范

推荐使用统一的返回格式：

```javascript
// 成功返回
return {
  code: 200,          // 状态码
  data: {             // 业务数据
    items: [],
    total: 0
  },
  msg: 'success'      // 状态描述
};

// 失败返回
return {
  code: 500,          // 错误码
  msg: 'error message', // 错误描述
  error: error        // 错误详情（可选）
};
```

## 4. 日志查看

### 查看路径
1. 进入云开发控制台
2. 选择"云函数"
3. 点击"日志查询"
4. 使用以下筛选条件：
   - 按请求ID
   - 按函数名
   - 按执行状态
   - 按时间范围

### 日志最佳实践

```javascript
exports.main = async (event, context) => {
  // 记录入参
  console.log('函数入参:', event);
  
  try {
    // 关键步骤日志
    console.log('开始处理业务逻辑');
    
    // 记录重要变量
    console.log('处理结果:', result);
    
    return { code: 200, data: result };
  } catch (error) {
    // 错误日志
    console.error('函数执行失败:', error);
    return { code: 500, msg: error.message };
  }
};
```

## 5. 常见问题排查

### 5.1 函数无法调用
- 检查函数名是否正确
- 验证云函数是否已部署
- 确认云开发权限配置

### 5.2 执行超时
- 检查数据库操作是否有性能问题
- 评估是否需要增加超时时间
- 考虑是否需要优化代码逻辑

### 5.3 内存溢出
- 检查是否有大量数据处理
- 评估是否需要分批处理
- 考虑使用流式处理

## 6. 开发建议

1. 使用 try-catch 捕获异常
2. 添加详细的日志记录
3. 统一返回格式
4. 合理设置超时时间
5. 进行性能优化

## 7. 调试技巧

### 本地调试
```bash
# 安装云函数本地调试依赖
npm install -g @cloudbase/cli

# 本地调试命令
cloudbase functions:invoke functionName
```

### 线上调试
1. 使用云开发控制台的"云函数调试"功能
2. 设置测试参数
3. 查看运行日志

## 8. 性能优化

1. 使用数据库索引
2. 避免大量同步操作
3. 合理使用缓存
4. 优化数据库查询
5. 控制返回数据大小 
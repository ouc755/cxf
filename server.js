const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// 添加跨源隔离所需的 HTTP 头
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

// 路由配置
// ... existing code ... 
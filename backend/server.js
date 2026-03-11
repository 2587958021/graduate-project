const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');

// 导入路由
const authRoutes = require('./routes/auth');
const exerciseRoutes = require('./routes/exercises');
const mistakesRoutes = require('./routes/mistakes');
const learningAnalysisRoutes = require('./routes/learningAnalysis');
const coursesRoutes = require('./routes/courses');
const aiRoutes = require('./routes/ai');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');

// 初始化Express应用
const app = express();

// 配置中间件
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: config.cors.methods,
  allowedHeaders: config.cors.allowedHeaders
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 配置静态文件目录
app.use(express.static(path.join(__dirname, 'public')));

// 配置API路由
app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/mistakes', mistakesRoutes);
app.use('/api/learning-analysis', learningAnalysisRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// 定义端口
const PORT = config.server.port || 3000;

// 本地开发环境启动服务器
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
    console.log(`API地址: http://localhost:${PORT}/api`);
  });
}

// 导出 app 供 Vercel 使用
module.exports = app;

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 处理404请求
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
}); 
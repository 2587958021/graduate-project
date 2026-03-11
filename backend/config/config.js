// 后端配置文件

module.exports = {
    // 服务器配置
    server: {
        port: 3000,
        host: 'localhost'
    },

    // JWT配置
    jwt: {
        secret: 'your-secret-key',
        expiresIn: '24h'
    },

    // 跨域配置
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? ['https://your-frontend-domain.vercel.app']  // 替换为你的 Vercel 前端域名
            : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    },

    // 会话配置
    session: {
        secret: 'your-session-secret',
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24小时
        }
    }
}; 
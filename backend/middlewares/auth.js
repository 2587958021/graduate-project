const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

// 用户数据文件路径
const USER_DATA_FILE = path.join(__dirname, '../data/users/users.json');

// 加载用户数据
const loadUsers = () => {
    try {
        if (!fs.existsSync(USER_DATA_FILE)) {
            return [];
        }
        const data = fs.readFileSync(USER_DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('加载用户数据失败:', error);
        return [];
    }
};

// 根据ID查找用户
const findUserById = (userId) => {
    const users = loadUsers();
    return users.find(user => user._id === userId);
};

// 验证Token中间件
exports.verifyToken = (req, res, next) => {
  try {
    // 从请求头或查询参数获取token
    const token = req.headers.authorization?.split(' ')[1] || req.query.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供访问令牌，请先登录'
      });
    }
    
    // 验证token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // 将用户信息添加到请求对象
    req.user = {
      id: decoded.id || decoded._id || decoded.userId,
      username: decoded.username,
      role: decoded.role
    };
    
    // 确保用户ID存在且有效
    if (!req.user.id || req.user.id === 'undefined') {
      return res.status(401).json({
        success: false,
        message: '无效的用户ID，请重新登录'
      });
    }
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '登录已过期，请重新登录'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: '无效的访问令牌，请重新登录'
    });
  }
};

// 为了向后兼容，保留protect别名
exports.protect = exports.verifyToken;

// 授权中间件 - 验证用户角色
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '需要登录后访问'
            });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: '无权限执行此操作'
            });
        }
        
        next();
    };
};

// 管理员权限检查中间件
exports.isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: '需要登录后访问'
        });
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: '需要管理员权限'
        });
    }
    
    next();
};

// 为了向后兼容，添加verifyAdmin别名
exports.verifyAdmin = exports.isAdmin;
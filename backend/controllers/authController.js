const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

// 用户数据文件路径
const USER_DATA_FILE = path.join(__dirname, '../data/users/users.json');

// 加载用户数据
const loadUsers = () => {
  try {
    // 确保目录存在
    const userDir = path.dirname(USER_DATA_FILE);
    if (!fs.existsSync(userDir)) {
      console.log(`创建用户数据目录: ${userDir}`);
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(USER_DATA_FILE)) {
      console.log('用户数据文件不存在，创建默认用户');
      
      // 创建默认用户 - 使用明文密码，登录时会处理
      const defaultUsers = [
        {
          _id: 'user_1748618904860',
          username: 'wyl',
          password: 'wyl20041025', // 明文密码，登录时会处理
          email: '2587958021@qq.com',
          role: 'admin',
          createdAt: new Date().toISOString()
        }
      ];
      
      // 保存默认用户
      fs.writeFileSync(USER_DATA_FILE, JSON.stringify(defaultUsers, null, 2), 'utf8');
      console.log('默认用户创建成功');
      
      return defaultUsers;
    }
    
    // 读取用户数据
    console.log(`读取用户数据文件: ${USER_DATA_FILE}`);
    const data = fs.readFileSync(USER_DATA_FILE, 'utf8');
    const users = JSON.parse(data);
    console.log(`成功加载 ${users.length} 个用户`);
    return users;
  } catch (error) {
    console.error('加载用户数据失败:', error);
    return [];
  }
};

// 保存用户数据
const saveUsers = (users) => {
  try {
    // 确保目录存在
    const userDir = path.dirname(USER_DATA_FILE);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    // 保存用户数据
    fs.writeFileSync(USER_DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('保存用户数据失败:', error);
    return false;
  }
};

// 根据条件查找用户
const findUser = (condition) => {
    const users = loadUsers();
    return users.find(user => 
        (condition.username && user.username === condition.username) ||
        (condition.email && user.email === condition.email) ||
        (condition._id && user._id === condition._id)
    );
};

// 用户注册控制器
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 检查用户名和邮箱是否已存在
        const existingUser = findUser({ username }) || findUser({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: '用户名或邮箱已被注册'
            });
        }

        // 生成盐值并哈希密码
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 创建新用户
        const newUser = {
            _id: 'user_' + Date.now(),
            username,
            email,
            password: hashedPassword,
            role: 'user', // 默认角色为用户
            status: 'active',  // 确保设置默认状态为启用
            avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        // 保存用户到JSON文件
        const users = loadUsers();
        users.push(newUser);
        saveUsers(users);

        // 生成 JWT token
        const token = jwt.sign(
            { userId: newUser._id, role: newUser.role },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        res.status(201).json({
            success: true,
            message: '注册成功',
            data: {
                token,
                user: {
                    id: newUser._id,
                    username: newUser.username,
                    email: newUser.email,
                    role: newUser.role
                }
            }
        });
    } catch (error) {
        console.error('注册失败:', error);
        res.status(500).json({
            success: false,
            message: '注册失败',
            error: error.message
        });
    }
};

// 用户登录控制器
exports.login = async (req, res) => {
    try {
        console.log('登录请求:', req.body);
        const { username, password } = req.body;
        
        // 查找用户
        const users = loadUsers();
        const user = users.find(u => u.username === username);
        
        if (!user) {
            console.log('用户不存在:', username);
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }
        
        console.log('找到用户:', user.username);
        
        // 验证密码 - 检查是否是哈希密码或明文密码
        let isMatch = false;
        
        if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
            // 如果是哈希密码，使用bcrypt比较
            isMatch = await bcrypt.compare(password, user.password);
        } else {
            // 如果是明文密码，直接比较
            isMatch = password === user.password;
        }
        
        if (!isMatch) {
            console.log('密码不匹配');
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }
        
        // 创建JWT令牌
        const token = jwt.sign(
            { 
                id: user._id, 
                username: user.username,
                role: user.role || 'user'
            }, 
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );
        
        // 更新最后登录时间
        user.lastLogin = new Date().toISOString();
        saveUsers(users);
        
        console.log('登录成功，生成token:', token.substring(0, 20) + '...');
        
        // 返回成功响应
        return res.status(200).json({
            success: true,
            message: '登录成功',
            data: {
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role || 'user'
                }
            }
        });
    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({
            success: false,
            message: '登录失败',
            error: error.message
        });
    }
};

// 获取当前用户信息
exports.getCurrentUser = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const user = findUser({ _id: userId });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                    bio: user.bio,
                    interests: user.interests,
                    createdAt: user.createdAt,
                    lastLogin: user.lastLogin
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取用户信息失败',
            error: error.message
        });
    }
};

// 更新用户信息
exports.updateUser = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const { username, email, bio, interests, avatar } = req.body;
        
        // 加载所有用户
        const users = loadUsers();
        const userIndex = users.findIndex(u => u._id === userId);
        
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        const user = users[userIndex];
        
        // 如果更新用户名或邮箱，检查是否已存在
        if (username && username !== user.username) {
            const existingUser = users.find(u => u.username === username && u._id !== userId);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: '用户名已被使用'
                });
            }
            user.username = username;
        }
        
        if (email && email !== user.email) {
            const existingUser = users.find(u => u.email === email && u._id !== userId);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: '邮箱已被使用'
                });
            }
            user.email = email;
        }
        
        // 更新其他字段
        if (bio !== undefined) user.bio = bio;
        if (interests !== undefined) user.interests = interests;
        if (avatar !== undefined) user.avatar = avatar;
        
        user.updatedAt = new Date().toISOString();
        
        // 保存更新后的用户数据
        saveUsers(users);

        res.json({
            success: true,
            message: '用户信息更新成功',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    bio: user.bio,
                    interests: user.interests,
                    avatar: user.avatar
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '更新用户信息失败',
            error: error.message
        });
    }
};

// 更改密码
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: '当前密码和新密码都是必需的'
            });
        }
        
        // 加载所有用户
        const users = loadUsers();
        const userIndex = users.findIndex(u => u._id === userId);
        
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        const user = users[userIndex];
        
        // 验证当前密码
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: '当前密码错误'
            });
        }
        
        // 生成新密码的哈希值
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 更新密码
        user.password = hashedPassword;
        user.updatedAt = new Date().toISOString();
        
        // 保存更新后的用户数据
        saveUsers(users);
        
        res.json({
            success: true,
            message: '密码修改成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '修改密码失败',
            error: error.message
        });
    }
};

// 管理员：获取所有用户
exports.getAllUsers = async (req, res) => {
    try {
        const users = loadUsers();
        
        // 移除密码字段
        const usersWithoutPassword = users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });

        res.json({
            success: true,
            count: usersWithoutPassword.length,
            data: usersWithoutPassword
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取用户列表失败',
            error: error.message
        });
    }
};

// 管理员：设置用户角色
exports.setUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        // 检查角色是否有效
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: '无效的角色值'
            });
        }

        // 加载所有用户
        const users = loadUsers();
        const userIndex = users.findIndex(u => u._id === id);
        
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        // 设置新角色
        users[userIndex].role = role;
        users[userIndex].updatedAt = new Date().toISOString();
        
        // 保存更新后的用户数据
        saveUsers(users);
        
        res.json({
            success: true,
            message: '用户角色已更新',
            data: {
                user: {
                    id: users[userIndex]._id,
                    username: users[userIndex].username,
                    role: users[userIndex].role
                }
            }
        });
    } catch (error) {
        console.error('设置用户角色失败:', error);
        res.status(500).json({
            success: false,
            message: '设置用户角色失败',
            error: error.message
        });
    }
};
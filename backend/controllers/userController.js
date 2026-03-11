const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// 用户数据文件路径
const USERS_DATA_DIR = path.join(__dirname, '../data/users');
const USERS_DATA_FILE = path.join(USERS_DATA_DIR, 'users.json');

// 确保用户数据目录存在
const ensureUsersDir = () => {
    if (!fs.existsSync(USERS_DATA_DIR)) {
        fs.mkdirSync(USERS_DATA_DIR, { recursive: true });
    }
};

// 加载所有用户数据
const loadUsers = () => {
    ensureUsersDir();
    
    if (!fs.existsSync(USERS_DATA_FILE)) {
        // 如果文件不存在，创建一个空的用户数组
        fs.writeFileSync(USERS_DATA_FILE, JSON.stringify([], null, 2), 'utf8');
        return [];
    }
    
    try {
        const data = fs.readFileSync(USERS_DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('加载用户数据失败:', error);
        return [];
    }
};

// 保存所有用户数据
const saveUsers = (users) => {
    ensureUsersDir();
    
    try {
        fs.writeFileSync(USERS_DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
    } catch (error) {
        console.error('保存用户数据失败:', error);
    }
};

// 根据ID查找用户
const findUserById = (id) => {
    const users = loadUsers();
    return users.find(user => user._id === id || user.id === id);
};

// 根据条件查找用户
const findUserBy = (condition) => {
    const users = loadUsers();
    return users.find(user => {
        for (const key in condition) {
            if (user[key] !== condition[key]) {
                return false;
            }
        }
        return true;
    });
};

// 获取用户信息
exports.getUserProfile = async (req, res) => {
    try {
        // 从req.user中获取用户ID，如果不存在则使用默认ID
        let userId = req.user?._id || req.user?.id;
        
        if (!userId) {
            // 尝试从请求体或查询参数获取用户ID
            userId = req.body.userId || req.query.userId;
            
            // 如果仍然没有用户ID，使用默认ID
            if (!userId) {
                userId = '1748618904860'; // 默认用户ID
                console.log(`未找到用户ID，使用默认ID: ${userId}`);
            }
        }
        
        // 获取用户信息
        let user = req.user;
        
        // 如果req.user不存在，尝试从数据库获取
        if (!user) {
            user = findUserById(userId);
            
            // 如果仍然没有找到用户，创建一个基本的默认用户
            if (!user) {
                user = {
                    _id: userId,
                    username: '默认用户',
                    role: 'user',
                    createdAt: new Date().toISOString()
                };
            }
        }
        
        res.json({
            success: true,
            data: {
                user: user
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
exports.updateUserProfile = async (req, res) => {
    try {
        const { username, email, bio, interests } = req.body;
        
        // 从req.user中获取用户ID，如果不存在则使用默认ID
        let userId = req.user?._id || req.user?.id;
        
        if (!userId) {
            // 尝试从请求体或查询参数获取用户ID
            userId = req.body.userId || req.query.userId;
            
            // 如果仍然没有用户ID，使用默认ID
            if (!userId) {
                userId = '1748618904860'; // 默认用户ID
                console.log(`未找到用户ID，使用默认ID: ${userId}`);
            }
        }

        const users = loadUsers();
        const userIndex = users.findIndex(u => u._id === userId || u.id === userId);
        
        // 如果用户不存在，创建一个新用户
        if (userIndex === -1) {
            const newUser = {
                _id: userId,
                username: username || '默认用户',
                email: email || `user_${userId}@example.com`,
                bio: bio || '',
                interests: interests || [],
                role: 'user',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            users.push(newUser);
            saveUsers(users);
            
            return res.json({
                success: true,
                message: '新用户创建成功',
                data: {
                    user: newUser
                }
            });
        }

        // 检查用户名和邮箱是否已被其他用户使用
        if (username && username !== users[userIndex].username) {
            const existingUser = users.find(u => u.username === username && (u._id !== userId && u.id !== userId));
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: '用户名已被占用'
                });
            }
        }

        if (email && email !== users[userIndex].email) {
            const existingUser = users.find(u => u.email === email && (u._id !== userId && u.id !== userId));
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: '邮箱已被占用'
                });
            }
        }

        // 更新用户信息
        users[userIndex] = {
            ...users[userIndex],
            username: username || users[userIndex].username,
            email: email || users[userIndex].email,
            bio: bio !== undefined ? bio : users[userIndex].bio,
            interests: interests || users[userIndex].interests,
            updatedAt: new Date().toISOString()
        };

        // 保存更新后的用户数据
        saveUsers(users);

        // 返回更新后的用户信息（不包含密码）
        const updatedUser = { ...users[userIndex] };
        delete updatedUser.password;

        res.json({
            success: true,
            message: '用户信息更新成功',
            data: {
                user: updatedUser
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

// 上传头像
exports.uploadAvatar = async (req, res) => {
    console.log('进入uploadAvatar处理方法');
    try {
        // 确保uploads目录存在
        const uploadsDir = path.join(__dirname, '../public/uploads/avatars');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
            console.log('创建上传目录:', uploadsDir);
        }

        // 检查是否有文件上传
        if (!req.file) {
            console.error('未收到上传文件');
            return res.status(400).json({
                success: false,
                message: '未上传文件或文件上传失败'
            });
        }

        console.log('接收到文件:', req.file);
        
        // 文件相对路径
        const avatarPath = `/uploads/avatars/${req.file.filename}`;
        console.log('头像路径:', avatarPath);

        // 从req.user中获取用户ID，如果不存在则使用默认ID
        let userId = req.user?._id || req.user?.id;
        
        if (!userId) {
            // 尝试从请求体或查询参数获取用户ID
            userId = req.body.userId || req.query.userId;
            
            // 如果仍然没有用户ID，使用默认ID
            if (!userId) {
                userId = '1748618904860'; // 默认用户ID
                console.log(`未找到用户ID，使用默认ID: ${userId}`);
            }
        }
        
        console.log('更新用户头像, 用户ID:', userId);
        
        const users = loadUsers();
        const userIndex = users.findIndex(u => u._id === userId || u.id === userId);
        
        // 如果用户不存在，创建一个新用户
        if (userIndex === -1) {
            const newUser = {
                _id: userId,
                username: `用户_${userId}`,
                avatar: avatarPath,
                role: 'user',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            users.push(newUser);
            saveUsers(users);
            
            return res.json({
                success: true,
                message: '头像上传成功，创建了新用户',
                data: {
                    user: newUser,
                    avatarUrl: avatarPath
                }
            });
        }
        
        users[userIndex].avatar = avatarPath;
        users[userIndex].updatedAt = new Date().toISOString();
        
        // 保存更新后的用户数据
        saveUsers(users);

        const updatedUser = { ...users[userIndex] };
        delete updatedUser.password;

        console.log('用户头像更新成功:', updatedUser.avatar);

        // 返回完整的URL给前端
        const fullUrl = `http://localhost:3000${avatarPath}`;
        
        res.json({
            success: true,
            message: '头像上传成功',
            data: {
                user: updatedUser,
                url: avatarPath,
                fullUrl: fullUrl
            }
        });
    } catch (error) {
        console.error('头像上传过程中发生错误:', error);
        res.status(500).json({
            success: false,
            message: '头像上传失败',
            error: error.message
        });
    }
}; 

// 管理员功能：获取所有用户
exports.getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, roles, statuses, search } = req.query;
        
        console.log('筛选条件:', { roles, statuses, search });
        
        let users = loadUsers();
        
        // 应用筛选条件
        if (roles) {
            const roleArray = roles.split(',');
            if (roleArray.length > 0) {
                users = users.filter(user => roleArray.includes(user.role));
            }
        }
        
        if (statuses) {
            const statusArray = statuses.split(',');
            if (statusArray.length > 0) {
                users = users.filter(user => statusArray.includes(user.status));
            }
        }
        
        if (search) {
            const searchLower = search.toLowerCase();
            users = users.filter(user => 
                (user.username && user.username.toLowerCase().includes(searchLower)) || 
                (user.email && user.email.toLowerCase().includes(searchLower))
            );
        }
        
        // 计算分页
        const total = users.length;
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);
        
        // 排序并分页
        users = users
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(startIndex, endIndex);
            
        // 移除密码字段
        users = users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
        
        res.json({
            success: true,
            data: users,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('获取用户列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户列表失败',
            error: error.message
        });
    }
};

// 管理员功能：更新用户角色和状态
exports.updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role, status } = req.body;
        
        console.log(`更新用户 ${userId} 的角色或状态:`, { role, status });
        
        // 验证角色值
        if (role && !['user', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: '无效的角色值'
            });
        }
        
        // 验证状态值
        if (status && !['active', 'disabled'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: '无效的状态值'
            });
        }
        
        const users = loadUsers();
        const userIndex = users.findIndex(u => u._id === userId || u.id === userId);
        
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        const user = users[userIndex];
        console.log('当前用户信息:', user);
        
        // 禁止禁用管理员用户
        if (user.role === 'admin' && status === 'disabled') {
            return res.status(403).json({
                success: false,
                message: '不允许禁用管理员账户'
            });
        }
        
        // 更新用户角色和状态
        if (role) {
            users[userIndex].role = role;
        }
        
        if (status) {
            users[userIndex].status = status;
        }
        
        users[userIndex].updatedAt = new Date().toISOString();
        
        // 保存更新后的用户数据
        saveUsers(users);
        
        // 返回更新后的用户信息（不包含密码）
        const updatedUser = { ...users[userIndex] };
        delete updatedUser.password;
        
        res.json({
            success: true,
            message: '用户角色或状态更新成功',
            data: {
                user: updatedUser
            }
        });
    } catch (error) {
        console.error('更新用户角色或状态失败:', error);
        res.status(500).json({
            success: false,
            message: '更新用户角色或状态失败',
            error: error.message
        });
    }
};

// 管理员功能：删除用户
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const users = loadUsers();
        const userIndex = users.findIndex(u => u._id === userId || u.id === userId);
        
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        // 检查是否为管理员
        if (users[userIndex].role === 'admin') {
            return res.status(403).json({
                success: false,
                message: '不允许删除管理员账户'
            });
        }
        
        // 删除用户
        users.splice(userIndex, 1);
        
        // 保存更新后的用户数据
        saveUsers(users);
        
        res.json({
            success: true,
            message: '用户删除成功'
        });
    } catch (error) {
        console.error('删除用户失败:', error);
        res.status(500).json({
            success: false,
            message: '删除用户失败',
            error: error.message
        });
    }
};

// 管理员功能：获取用户详情（包括学习统计）
exports.getUserDetails = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // 查询用户基本信息
        const user = findUserById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        // 这里可以从其他集合获取用户的学习统计数据
        // 暂时返回基本用户信息
        res.json({
            success: true,
            data: {
                user,
                stats: {
                    coursesCompleted: 0, // 暂时使用默认值，后续可以从进度集合中统计
                    exercisesCompleted: 0,
                    correctRate: '0',
                    totalLearnTime: '0h'
                }
            }
        });
    } catch (error) {
        console.error('获取用户详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户详情失败',
            error: error.message
        });
    }
};

// 管理员功能：获取系统统计数据
exports.getAdminStatistics = async (req, res) => {
    try {
        // 获取总用户数
        const userCount = loadUsers().length;
        
        // 获取用户增长率（与上个月相比）
        const now = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        const thisMonthUsers = loadUsers().filter(user => new Date(user.createdAt) >= lastMonth && new Date(user.createdAt) <= now).length;
        
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        
        const lastMonthUsers = loadUsers().filter(user => new Date(user.createdAt) >= twoMonthsAgo && new Date(user.createdAt) <= lastMonth).length;
        
        // 计算增长率
        const userGrowth = lastMonthUsers > 0
            ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100
            : 0;
        
        // 获取课程总数
        const courseCount = loadUsers().filter(user => user.role === 'student').length;
        
        // 计算课程增长率
        const lastMonthCourses = loadUsers().filter(user => new Date(user.createdAt) >= lastMonth && new Date(user.createdAt) <= now && user.role === 'student').length;
        
        const prevMonthCourses = loadUsers().filter(user => new Date(user.createdAt) >= twoMonthsAgo && new Date(user.createdAt) <= lastMonth && user.role === 'student').length;
        
        const courseGrowth = prevMonthCourses > 0
            ? ((lastMonthCourses - prevMonthCourses) / prevMonthCourses) * 100
            : 0;
        
        // 获取练习总数
        const exerciseCount = loadUsers().filter(user => user.role === 'student').length;
        
        // 计算练习增长率
        const lastMonthExercises = loadUsers().filter(user => new Date(user.createdAt) >= lastMonth && new Date(user.createdAt) <= now && user.role === 'student').length;
        
        const prevMonthExercises = loadUsers().filter(user => new Date(user.createdAt) >= twoMonthsAgo && new Date(user.createdAt) <= lastMonth && user.role === 'student').length;
        
        const exerciseGrowth = prevMonthExercises > 0
            ? ((lastMonthExercises - prevMonthExercises) / prevMonthExercises) * 100
            : 0;
        
        // 获取活跃用户数（最近一周有进度记录的用户）
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const activeUsers = loadUsers().filter(user => user.role === 'student' && new Date(user.createdAt) >= oneWeekAgo).length;
        
        // 活跃用户增长率
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        
        const prevWeekActiveUsers = loadUsers().filter(user => user.role === 'student' && new Date(user.createdAt) >= twoWeeksAgo && new Date(user.createdAt) < oneWeekAgo).length;
        
        const activeGrowth = prevWeekActiveUsers > 0
            ? ((activeUsers - prevWeekActiveUsers) / prevWeekActiveUsers) * 100
            : 0;
        
        // 获取用户增长趋势数据（最近12个月）
        const userGrowthData = [];
        const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        
        for (let i = 0; i < 12; i++) {
            const monthStart = new Date();
            monthStart.setMonth(monthStart.getMonth() - i);
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);
            
            const monthEnd = new Date(monthStart);
            monthEnd.setMonth(monthEnd.getMonth() + 1);
            monthEnd.setDate(0);
            monthEnd.setHours(23, 59, 59, 999);
            
            const monthUsers = loadUsers().filter(user => new Date(user.createdAt) >= monthStart && new Date(user.createdAt) <= monthEnd && user.role === 'student').length;
            
            const activeMonthUsers = loadUsers().filter(user => new Date(user.createdAt) >= monthStart && new Date(user.createdAt) <= monthEnd && user.role === 'student').length;
            
            userGrowthData.unshift({
                month: monthNames[monthStart.getMonth()],
                newUsers: monthUsers,
                activeUsers: activeMonthUsers
            });
        }
        
        // 获取课程学习数据（按分类统计）
        const courseCategories = loadUsers().filter(user => user.role === 'student').map(user => user.interests).flat();
        const courseLearningData = [];
        
        for (const category of courseCategories) {
            const courses = loadUsers().filter(user => user.role === 'student' && user.interests && user.interests.includes(category));
            
            // 假设有个CourseProgress模型，统计课程的学习情况
            // 这里用模拟数据代替
            courseLearningData.push({
                category,
                views: Math.floor(Math.random() * 500) + 1000,
                completions: Math.floor(Math.random() * 300) + 500
            });
        }
        
        // 获取热门课程排行
        const popularCourses = loadUsers()
            .filter(user => user.role === 'student' && user.interests && user.interests.length > 0)
            .sort((a, b) => (b.interests ? b.interests.length : 0) - (a.interests ? a.interests.length : 0))
            .slice(0, 10);
        
        // 获取用户分布数据
        // 这里使用模拟数据，实际项目中应从用户属性中统计
        const userDistributionByRegion = [
            { name: '北京', value: Math.floor(Math.random() * 100) + 100 },
            { name: '上海', value: Math.floor(Math.random() * 100) + 80 },
            { name: '广州', value: Math.floor(Math.random() * 100) + 60 },
            { name: '深圳', value: Math.floor(Math.random() * 100) + 60 },
            { name: '杭州', value: Math.floor(Math.random() * 100) + 40 },
            { name: '成都', value: Math.floor(Math.random() * 100) + 30 },
            { name: '武汉', value: Math.floor(Math.random() * 100) + 30 },
            { name: '南京', value: Math.floor(Math.random() * 100) + 20 },
            { name: '其他', value: Math.floor(Math.random() * 100) + 100 }
        ];
        
        const userDistributionByDevice = [
            { name: '桌面电脑', value: Math.floor(Math.random() * 200) + 300 },
            { name: '手机', value: Math.floor(Math.random() * 150) + 150 },
            { name: '平板', value: Math.floor(Math.random() * 100) + 50 }
        ];
        
        const userDistributionByActivity = [
            { name: '每日活跃', value: Math.floor(Math.random() * 100) + 100 },
            { name: '每周活跃', value: Math.floor(Math.random() * 150) + 150 },
            { name: '每月活跃', value: Math.floor(Math.random() * 100) + 80 },
            { name: '不活跃', value: Math.floor(Math.random() * 100) + 80 }
        ];
        
        // 返回统计数据
        res.json({
            success: true,
            data: {
                userCount,
                userGrowth: parseFloat(userGrowth.toFixed(1)),
                courseCount,
                courseGrowth: parseFloat(courseGrowth.toFixed(1)),
                exerciseCount,
                exerciseGrowth: parseFloat(exerciseGrowth.toFixed(1)),
                activeUsers,
                activeGrowth: parseFloat(activeGrowth.toFixed(1)),
                userGrowthData,
                courseLearningData,
                popularCourses: popularCourses.map(course => ({
                    title: course.interests ? course.interests.join(', ') : '无兴趣标签',
                    viewCount: course.interests ? course.interests.length : 0
                })),
                userDistribution: {
                    byRegion: userDistributionByRegion,
                    byDevice: userDistributionByDevice,
                    byActivity: userDistributionByActivity
                }
            }
        });
    } catch (error) {
        console.error('获取管理统计数据失败:', error);
        res.status(500).json({
            success: false,
            message: '获取管理统计数据失败',
            error: error.message
        });
    }
};

// 获取用户学习进度
exports.getLearningProgress = async (req, res) => {
  try {
    // 从req.user中获取用户ID，如果不存在则使用默认ID
    let userId = req.user?._id || req.user?.id;
    
    if (!userId) {
        // 尝试从请求体或查询参数获取用户ID
        userId = req.body.userId || req.query.userId;
        
        // 如果仍然没有用户ID，使用默认ID
        if (!userId) {
            userId = '1748618904860'; // 默认用户ID
            console.log(`未找到用户ID，使用默认ID: ${userId}`);
        }
    }
    
    const timeFrame = req.query.timeFrame || 'all';
    
    // 获取学习进度数据
    // 这里可以从数据库或文件系统获取数据
    // 目前使用模拟数据进行示例
    
    // 根据时间范围筛选数据
    let startDate = new Date(0); // 默认为从1970年开始
    
    if (timeFrame === 'week') {
      // 过去一周
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeFrame === 'month') {
      // 过去一个月
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    }
    
    // 生成示例数据
    const progress = {
      courses: {
        total: 5,
        completed: 2,
        inProgress: 2,
        completionRate: 40
      },
      exercises: {
        total: 120,
        completed: 78,
        correctRate: 65
      },
      recentActivity: [
        {
          type: 'course',
          action: 'completed',
          itemId: 'course1',
          itemName: 'HTML基础',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          type: 'exercise',
          action: 'completed',
          itemId: 'ex123',
          itemName: 'CSS选择器练习',
          result: 'correct',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }
      ]
    };
    
    // 返回进度数据
    res.json({
      success: true,
      data: progress,
      message: '获取学习进度成功'
    });
  } catch (error) {
    console.error('获取学习进度失败:', error);
    res.status(500).json({
      success: false,
      message: '获取学习进度失败',
      error: error.message
    });
  }
}; 
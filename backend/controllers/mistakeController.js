const fs = require('fs');
const path = require('path');

// 错题集数据文件路径
const MISTAKES_DATA_DIR = path.join(__dirname, '../data/mistakes');

// 确保错题集目录存在
const ensureMistakesDir = () => {
    try {
        if (!fs.existsSync(MISTAKES_DATA_DIR)) {
            console.log(`创建错题集目录: ${MISTAKES_DATA_DIR}`);
            fs.mkdirSync(MISTAKES_DATA_DIR, { recursive: true });
        }
    } catch (error) {
        console.error('创建错题集目录失败:', error);
    }
};

// 初始化时确保目录存在
ensureMistakesDir();

// 获取用户错题集文件路径
const getUserMistakesFilePath = (userId) => {
    if (!userId) {
        throw new Error('用户ID不能为空');
    }
    
    // 确保userId是字符串类型
    userId = String(userId);
    
    // 去掉可能的'user_'前缀
    if (userId.startsWith('user_')) {
        userId = userId.substring(5);
    }
    
    // 使用标准格式的文件路径
    const filePath = path.join(MISTAKES_DATA_DIR, `user_${userId}_mistakes.json`);
    console.log(`错题本文件路径: ${filePath}`);
    return filePath;
};

// 加载用户错题集
const loadUserMistakes = (userId) => {
    if (!userId) {
        console.error('加载错题集失败: 用户ID不能为空');
        return [];
    }
    
    try {
        ensureMistakesDir();
        const filePath = getUserMistakesFilePath(userId);
        
        if (!fs.existsSync(filePath)) {
            console.log(`用户 ${userId} 的错题本文件不存在，返回空数组`);
            return [];
        }
        
        const data = fs.readFileSync(filePath, 'utf8');
        const mistakes = JSON.parse(data);
        console.log(`成功加载用户 ${userId} 的错题集，共 ${mistakes.length} 条记录`);
        return mistakes;
    } catch (error) {
        console.error(`加载用户[${userId}]错题集失败:`, error);
        return [];
    }
};

// 保存用户错题集
const saveUserMistakes = (userId, mistakes) => {
    if (!userId) {
        console.error('保存错题集失败: 用户ID不能为空');
        return false;
    }
    
    try {
        ensureMistakesDir();
        
        // 确保userId是字符串类型
        userId = String(userId);
        
        // 去掉可能的'user_'前缀
        if (userId.startsWith('user_')) {
            userId = userId.substring(5);
        }
        
        const filePath = getUserMistakesFilePath(userId);
        fs.writeFileSync(filePath, JSON.stringify(mistakes, null, 2), 'utf8');
        console.log(`成功保存用户 ${userId} 的错题集，共 ${mistakes.length} 条记录`);
        return true;
    } catch (error) {
        console.error(`保存用户[${userId}]错题集失败:`, error);
        return false;
    }
};

// 添加错题
exports.addToMistakes = async (req, res) => {
    try {
        console.log('添加错题API被调用，请求体:', req.body);

        // 从req.user中获取用户ID，如果不存在则使用默认ID
        let userId = req.user?._id;
        
        if (!userId) {
            // 尝试从请求体或查询参数获取用户ID
            userId = req.body.userId || req.query.userId;
            
            // 如果仍然没有用户ID，使用默认ID
            if (!userId) {
                userId = '1748618904860'; // 默认用户ID
                console.log(`未找到用户ID，使用默认ID: ${userId}`);
            }
        }

        // 确保userId是字符串类型
        userId = String(userId);
        
        // 去掉可能的'user_'前缀
        if (userId.startsWith('user_')) {
            userId = userId.substring(5);
        }

        console.log(`处理后的用户ID: ${userId}`);

        const { exerciseId, userAnswer, note } = req.body;
        
        if (!exerciseId) {
            return res.status(400).json({
                success: false,
                message: '缺少题目ID'
            });
        }

        console.log(`用户 ${userId} 尝试添加错题 ${exerciseId}`);
        
        // 加载用户错题集
        const mistakes = loadUserMistakes(userId);
        
        // 检查是否已存在该错题
        const existingIndex = mistakes.findIndex(m => m.exerciseId === exerciseId);
        
        const timestamp = new Date().toISOString();
        
        // 获取练习题信息
        const exercisesData = require('./exerciseController');
        const exercises = exercisesData.getExercisesData();
        const exercise = exercises.find(ex => ex._id === exerciseId);
        
        if (!exercise) {
            console.warn(`未找到练习题 ${exerciseId}`);
        }
        
        let mistakeData;
        
        if (existingIndex !== -1) {
            // 更新现有错题
            mistakeData = {
                ...mistakes[existingIndex],
                userAnswer,
                correctAnswer: exercise?.answer,
                note: note || mistakes[existingIndex].note,
                updatedAt: timestamp,
                count: (mistakes[existingIndex].count || 1) + 1
            };
            
            mistakes[existingIndex] = mistakeData;
            console.log(`更新现有错题 ${exerciseId}`);
        } else {
            // 添加新错题
            mistakeData = {
                _id: `mistake_${Date.now()}`,
                exerciseId,
                userAnswer,
                correctAnswer: exercise?.answer,
                exerciseType: exercise?.type || 'unknown',
                knowledgePoint: exercise?.knowledgePoint || 'unknown',
                content: exercise?.content || '',
                title: exercise?.title || '未知题目',
                options: exercise?.options || [],
                note: note || '',
                createdAt: timestamp,
                updatedAt: timestamp,
                count: 1
            };
            
            mistakes.push(mistakeData);
            console.log(`添加新错题 ${exerciseId}`);
        }
        
        // 保存错题集
        const saved = saveUserMistakes(userId, mistakes);
        
        if (!saved) {
            return res.status(500).json({
                success: false,
                message: '保存错题失败'
            });
        }
        
        res.status(201).json({
            success: true,
            message: '错题已添加到收藏',
            data: mistakeData
        });
    } catch (error) {
        console.error('添加错题失败:', error);
        res.status(500).json({
            success: false,
            message: '添加错题失败',
            error: error.message
        });
    }
};

// 获取用户错题集
exports.getUserMistakes = async (req, res) => {
    try {
        // 从req.user中获取用户ID
        let userId = req.user?._id || req.user?.id || req.query.userId || req.body.userId;
        
        // 如果有userId，确保格式正确
        if (userId) {
            // 确保userId是字符串类型
            userId = String(userId);
            
            // 去掉可能的'user_'前缀
            if (userId.startsWith('user_')) {
                userId = userId.substring(5);
            }
            
            console.log(`处理后的用户ID: ${userId}`);
            
            // 加载用户错题集
            let mistakes = loadUserMistakes(userId);
            
            // 应用分页和筛选
            const { page = 1, limit = 20, knowledgePoint, type, status } = req.query;
            
            // 筛选
            if (knowledgePoint || type || status) {
                mistakes = mistakes.filter(mistake => {
                    let match = true;
                    
                    if (knowledgePoint && mistake.knowledgePoint !== knowledgePoint) {
                        match = false;
                    }
                    
                    if (type && mistake.exerciseType !== type) {
                        match = false;
                    }
                    
                    if (status) {
                        const isMastered = mistake.mastered === true;
                        if ((status === 'mastered' && !isMastered) || (status === 'unmastered' && isMastered)) {
                            match = false;
                        }
                    }
                    
                    return match;
                });
            }
            
            // 排序 - 默认按更新时间降序
            mistakes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            
            // 计算分页
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            const total = mistakes.length;
            const paginatedMistakes = mistakes.slice(startIndex, endIndex);
            
            return res.status(200).json({
                success: true,
                count: paginatedMistakes.length,
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit),
                data: paginatedMistakes
            });
        }
        
        console.log('未提供有效的用户ID，尝试查找可用的错题本文件');
        
        // 尝试读取目录中的所有错题本文件
        try {
            ensureMistakesDir();
            const files = fs.readdirSync(MISTAKES_DATA_DIR);
            console.log(`错题本目录中的文件:`, files);
            
            // 如果有任何错题本文件，使用第一个
            if (files.length > 0) {
                // 查找格式为user_*_mistakes.json的文件
                const mistakeFiles = files.filter(file => file.includes('_mistakes.json'));
                
                if (mistakeFiles.length > 0) {
                    const firstFile = mistakeFiles[0];
                    console.log(`使用第一个可用的错题本文件: ${firstFile}`);
                    
                    // 提取用户ID
                    const match = firstFile.match(/user_(.+)_mistakes\.json/);
                    if (match && match[1]) {
                        const extractedUserId = match[1];
                        console.log(`从文件名中提取的用户ID: ${extractedUserId}`);
                        
                        // 使用提取的用户ID加载错题本
                        const mistakes = loadUserMistakes(extractedUserId);
                        
                        return res.status(200).json({
                            success: true,
                            message: '获取错题集成功（使用可用的错题本文件）',
                            data: mistakes
                        });
                    }
                }
            }
            
            // 如果没有找到可用的错题本文件，使用默认用户ID
            const defaultUserId = '1748618904860';
            console.log(`没有找到可用的错题本文件，使用默认用户ID: ${defaultUserId}`);
            
            // 加载默认用户错题集
            const mistakes = loadUserMistakes(defaultUserId);
            
            return res.status(200).json({
                success: true,
                message: '获取错题集成功（使用默认用户）',
                data: mistakes
            });
        } catch (error) {
            console.error('查找可用的错题本文件失败:', error);
            
            return res.status(200).json({
                success: true,
                message: '未找到任何错题本数据',
                data: []
            });
        }
    } catch (error) {
        console.error('获取错题集失败:', error);
        res.status(500).json({
            success: false,
            message: '获取错题集失败',
            error: error.message
        });
    }
};

// 从错题集中删除题目
exports.removeFromMistakes = async (req, res) => {
    try {
        // 从req.user中获取用户ID
        let userId = req.user?._id;
        
        if (!userId) {
            // 尝试从查询参数获取用户ID
            userId = req.query.userId;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: '未授权，请先登录或提供用户ID'
                });
            }
            
            // 确保userId是字符串类型
            userId = String(userId);
            
            // 去掉可能的'user_'前缀
            if (userId.startsWith('user_')) {
                userId = userId.substring(5);
            }
            
            console.log(`从查询参数获取的用户ID: ${userId}`);
        }
        
        const { mistakeId } = req.params;
        console.log(`用户 ${userId} 尝试删除错题 ${mistakeId}`);

        // 加载用户错题集
        let mistakes = loadUserMistakes(userId);

        // 查找要删除的错题
        const index = mistakes.findIndex(m => m._id === mistakeId || m.exerciseId === mistakeId);

        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: '未找到该错题'
            });
        }

        // 删除错题
        mistakes.splice(index, 1);
        
        // 保存更新后的错题集
        const saved = saveUserMistakes(userId, mistakes);
        
        if (!saved) {
            return res.status(500).json({
                success: false,
                message: '删除错题失败'
            });
        }
        
        res.json({
            success: true,
            message: '错题已从收藏中移除'
        });
    } catch (error) {
        console.error('移除错题失败:', error);
        res.status(500).json({
            success: false,
            message: '移除错题失败',
            error: error.message
        });
    }
};

// 清空错题集
exports.clearMistakes = async (req, res) => {
    try {
        // 从req.user中获取用户ID
        let userId = req.user?._id;
        
        if (!userId) {
            // 尝试从查询参数或请求体获取用户ID
            userId = req.query.userId || req.body.userId;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: '未授权，请先登录或提供用户ID'
                });
            }
            
            // 确保userId是字符串类型
            userId = String(userId);
            
            // 去掉可能的'user_'前缀
            if (userId.startsWith('user_')) {
                userId = userId.substring(5);
            }
            
            console.log(`从查询参数获取的用户ID: ${userId}`);
        }
        
        console.log(`用户 ${userId} 尝试清空错题集`);
        
        // 保存空数组作为错题集
        const saved = saveUserMistakes(userId, []);
        
        if (!saved) {
            return res.status(500).json({
                success: false,
                message: '清空错题集失败'
            });
        }
        
        res.json({
            success: true,
            message: '错题集已清空'
        });
    } catch (error) {
        console.error('清空错题集失败:', error);
        res.status(500).json({
            success: false,
            message: '清空错题集失败',
            error: error.message
        });
    }
};

// 更新错题状态
exports.updateMistakeStatus = async (req, res) => {
    try {
        // 从req.user中获取用户ID
        let userId = req.user?._id;
        
        if (!userId) {
            // 尝试从查询参数或请求体获取用户ID
            userId = req.query.userId || req.body.userId;
            
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: '未授权，请先登录或提供用户ID'
                });
            }
            
            // 确保userId是字符串类型
            userId = String(userId);
            
            // 去掉可能的'user_'前缀
            if (userId.startsWith('user_')) {
                userId = userId.substring(5);
            }
            
            console.log(`从查询参数获取的用户ID: ${userId}`);
        }
        
        const { mistakeId } = req.params;
        const { status, note } = req.body;
        
        console.log(`用户 ${userId} 尝试更新错题 ${mistakeId} 的状态`);

        // 加载用户错题集
        let mistakes = loadUserMistakes(userId);

        // 查找要更新的错题
        const index = mistakes.findIndex(m => m._id === mistakeId || m.exerciseId === mistakeId);

        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: '未找到该错题'
            });
        }

        // 更新错题状态
        mistakes[index] = {
            ...mistakes[index],
            status: status || mistakes[index].status,
            note: note !== undefined ? note : mistakes[index].note,
            updatedAt: new Date().toISOString()
        };
        
        // 保存更新后的错题集
        const saved = saveUserMistakes(userId, mistakes);
        
        if (!saved) {
            return res.status(500).json({
                success: false,
                message: '更新错题状态失败'
            });
        }

        res.json({
            success: true,
            message: '错题状态已更新',
            data: mistakes[index]
        });
    } catch (error) {
        console.error('更新错题状态失败:', error);
        res.status(500).json({
            success: false,
            message: '更新错题状态失败',
            error: error.message
        });
    }
};

// 获取错题统计信息
exports.getMistakeStats = async (req, res) => {
    try {
        // 从req.user中获取用户ID
        let userId = req.user?._id || req.user?.id || req.query.userId || req.body.userId;
        
        if (userId) {
            // 确保userId是字符串类型
            userId = String(userId);
            
            // 去掉可能的'user_'前缀
            if (userId.startsWith('user_')) {
                userId = userId.substring(5);
            }
            
            console.log(`处理后的用户ID: ${userId}`);
            
            // 加载用户错题集
            const mistakes = loadUserMistakes(userId);
            
            // 计算统计信息
            const stats = calculateMistakeStats(mistakes);
            
            return res.status(200).json({
                success: true,
                message: '获取错题统计成功',
                data: stats
            });
        }
        
        console.log('未提供有效的用户ID，尝试查找可用的错题本文件');
        
        // 尝试读取目录中的所有错题本文件
        try {
            ensureMistakesDir();
            const files = fs.readdirSync(MISTAKES_DATA_DIR);
            console.log(`错题本目录中的文件:`, files);
            
            // 如果有任何错题本文件，使用第一个
            if (files.length > 0) {
                // 查找格式为user_*_mistakes.json的文件
                const mistakeFiles = files.filter(file => file.includes('_mistakes.json'));
                
                if (mistakeFiles.length > 0) {
                    const firstFile = mistakeFiles[0];
                    console.log(`使用第一个可用的错题本文件: ${firstFile}`);
                    
                    // 提取用户ID
                    const match = firstFile.match(/user_(.+)_mistakes\.json/);
                    if (match && match[1]) {
                        const extractedUserId = match[1];
                        console.log(`从文件名中提取的用户ID: ${extractedUserId}`);
                        
                        // 使用提取的用户ID加载错题本
                        const mistakes = loadUserMistakes(extractedUserId);
                        
                        // 计算统计信息
                        const stats = calculateMistakeStats(mistakes);
                        
                        return res.status(200).json({
                            success: true,
                            message: '获取错题统计成功（使用可用的错题本文件）',
                            data: stats
                        });
                    }
                }
            }
            
            // 如果没有找到可用的错题本文件，使用默认用户ID
            const defaultUserId = '1748618904860';
            console.log(`没有找到可用的错题本文件，使用默认用户ID: ${defaultUserId}`);
            
            // 加载默认用户错题集
            const mistakes = loadUserMistakes(defaultUserId);
            
            // 计算统计信息
            const stats = calculateMistakeStats(mistakes);
            
            return res.status(200).json({
                success: true,
                message: '获取错题统计成功（使用默认用户）',
                data: stats
            });
        } catch (error) {
            console.error('查找可用的错题本文件失败:', error);
            
            return res.status(200).json({
                success: true,
                message: '未找到任何错题本数据',
                data: {
                    total: 0,
                    mastered: 0,
                    unmastered: 0,
                    masteredRate: 0,
                    byKnowledgePoint: [],
                    byExerciseType: []
                }
            });
        }
    } catch (error) {
        console.error('获取错题统计失败:', error);
        res.status(500).json({
            success: false,
            message: '获取错题统计失败',
            error: error.message
        });
    }
};

// 计算错题统计信息
const calculateMistakeStats = (mistakes) => {
    // 总数
    const total = mistakes.length;
    
    // 已掌握和未掌握数量
    const mastered = mistakes.filter(m => m.mastered === true).length;
    const unmastered = total - mastered;
    
    // 掌握率
    const masteredRate = total > 0 ? Math.round((mastered / total) * 100) : 0;
    
    // 按知识点分组
    const byKnowledgePoint = {};
    mistakes.forEach(mistake => {
        const knowledgePoint = mistake.knowledgePoint || 'unknown';
        if (!byKnowledgePoint[knowledgePoint]) {
            byKnowledgePoint[knowledgePoint] = {
                knowledgePoint,
                total: 0,
                mastered: 0,
                unmastered: 0
            };
        }
        
        byKnowledgePoint[knowledgePoint].total++;
        if (mistake.mastered) {
            byKnowledgePoint[knowledgePoint].mastered++;
        } else {
            byKnowledgePoint[knowledgePoint].unmastered++;
        }
    });
    
    // 按题型分组
    const byExerciseType = {};
    mistakes.forEach(mistake => {
        const exerciseType = mistake.exerciseType || 'unknown';
        if (!byExerciseType[exerciseType]) {
            byExerciseType[exerciseType] = {
                exerciseType,
                total: 0,
                mastered: 0,
                unmastered: 0
            };
        }
        
        byExerciseType[exerciseType].total++;
        if (mistake.mastered) {
            byExerciseType[exerciseType].mastered++;
        } else {
            byExerciseType[exerciseType].unmastered++;
        }
    });
    
    return {
        total,
        mastered,
        unmastered,
        masteredRate,
        byKnowledgePoint: Object.values(byKnowledgePoint),
        byExerciseType: Object.values(byExerciseType)
    };
}; 
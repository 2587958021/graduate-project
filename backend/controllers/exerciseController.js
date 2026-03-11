const fs = require('fs');
const path = require('path');

// 数据文件目录
const dataDir = path.join(__dirname, '../data/exercises');

// 从JSON文件加载所有练习题数据
const loadExercisesData = () => {
  try {
    let allExercises = [];
    
    // 获取目录中的所有JSON文件
    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));
    
    if (files.length === 0) {
      console.error('未找到任何练习题JSON文件');
      return [];
    }
    
    // 读取每个文件并合并数据
    for (const file of files) {
      const filePath = path.join(dataDir, file);
      const data = fs.readFileSync(filePath, 'utf8');
      
      try {
        const exercises = JSON.parse(data);
        console.log(`从文件 ${file} 中读取了 ${exercises.length} 道练习题`);
        
        // 添加分类标签
        const category = file.replace('_exercises.json', '');
        const exercisesWithCategory = exercises.map((exercise, index) => {
          // 确保每个练习题都有一个唯一的ID
          if (!exercise._id) {
            exercise._id = `${category}_${index + 1}`;
          }
          
          // 添加分类
          if (!exercise.category) {
            exercise.category = category;
          }
          
          return exercise;
        });
        
        allExercises = [...allExercises, ...exercisesWithCategory];
      } catch (error) {
        console.error(`解析文件 ${file} 失败:`, error);
      }
    }
    
    console.log(`总共加载了 ${allExercises.length} 道练习题`);
    
    return allExercises;
  } catch (error) {
    console.error('加载练习题数据失败:', error);
    return [];
  }
};

// 保存练习题数据到文件
const saveExercisesData = (exercises) => {
  try {
    // 按类别分组
    const exercisesByCategory = {};
    
    exercises.forEach(exercise => {
      const category = exercise.category || 'general';
      if (!exercisesByCategory[category]) {
        exercisesByCategory[category] = [];
      }
      exercisesByCategory[category].push(exercise);
    });
    
    // 确保目录存在
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // 保存每个分类的练习题
    for (const [category, categoryExercises] of Object.entries(exercisesByCategory)) {
      const filePath = path.join(dataDir, `${category}_exercises.json`);
      fs.writeFileSync(filePath, JSON.stringify(categoryExercises, null, 2), 'utf8');
      console.log(`已保存 ${categoryExercises.length} 道 ${category} 类练习题到 ${filePath}`);
    }
    
    // 更新缓存
    exercisesCache = exercises;
    
    return true;
  } catch (error) {
    console.error('保存练习题数据失败:', error);
    return false;
  }
};

// 先声明缓存变量
let exercisesCache = [];

// 初始化时加载练习题数据
exercisesCache = loadExercisesData();

// 导出获取练习题数据的方法，供其他控制器使用
exports.getExercisesData = () => {
  // 如果缓存为空，重新加载数据
  if (!exercisesCache || exercisesCache.length === 0) {
    exercisesCache = loadExercisesData();
  }
  return exercisesCache;
};

// 获取所有练习题
exports.getAllExercises = async (req, res) => {
  try {
    console.log('获取所有练习题API被调用，查询参数:', req.query);
    
    const { type, difficulty, knowledgePoint, category, search, limit = 20, page = 1 } = req.query;
    
    // 获取所有练习题
    let exercises = exports.getExercisesData();
    console.log(`从文件系统加载了 ${exercises.length} 道练习题`);
    
    // 应用筛选条件
    if (type) {
      exercises = exercises.filter(exercise => exercise.type === type);
    }
    
    if (difficulty) {
      exercises = exercises.filter(exercise => exercise.difficulty === difficulty);
    }
    
    if (knowledgePoint) {
      exercises = exercises.filter(exercise => exercise.knowledgePoint === knowledgePoint);
    }
    
    if (category) {
      exercises = exercises.filter(exercise => exercise.category === category);
    }
    
    // 应用搜索功能
    if (search) {
      const searchLower = search.toLowerCase();
      exercises = exercises.filter(exercise => 
        (exercise.title && exercise.title.toLowerCase().includes(searchLower)) || 
        (exercise.content && exercise.content.toLowerCase().includes(searchLower)) ||
        (exercise.knowledgePoint && exercise.knowledgePoint.toLowerCase().includes(searchLower))
      );
    }
    
    // 计算总数和分页
    const total = exercises.length;
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    
    // 随机排序并应用分页
    const shuffledExercises = [...exercises].sort(() => 0.5 - Math.random());
    const paginatedExercises = shuffledExercises.slice(startIndex, endIndex);
    
    console.log(`筛选后返回 ${paginatedExercises.length} 道练习题，总计 ${total} 道`);
    
    res.status(200).json({
      success: true,
      count: paginatedExercises.length,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: paginatedExercises
    });
  } catch (error) {
    console.error('获取练习题失败:', error);
    res.status(500).json({
      success: false,
      message: '获取练习题失败',
      error: error.message
    });
  }
};

// 获取单个练习题
exports.getExercise = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 从文件系统获取所有练习题
    const exercises = exports.getExercisesData();
    
    // 查找指定ID的练习题
    const exercise = exercises.find(ex => ex._id === id);
    
    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: '练习题不存在'
      });
    }
    
    res.status(200).json({
      success: true,
      data: exercise
    });
  } catch (error) {
    console.error('获取练习题失败:', error);
    res.status(500).json({
      success: false,
      message: '获取练习题失败',
      error: error.message
    });
  }
};

// 按分类获取练习题
exports.getExercisesByCategory = async (req, res) => {
  try {
    const { category, limit = 20, page = 1 } = req.query;
    
    // 获取所有练习题
    let exercises = exports.getExercisesData();
    
    // 不再按分类筛选，而是随机选择
    const shuffledExercises = [...exercises].sort(() => 0.5 - Math.random());
    
    // 计算总数
    const total = exercises.length;
    
    // 应用分页
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedExercises = shuffledExercises.slice(startIndex, endIndex);
    
    console.log(`随机选择了 ${paginatedExercises.length} 条记录，总计 ${total} 条`);
    
    res.status(200).json({
      success: true,
      count: paginatedExercises.length,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: paginatedExercises
    });
  } catch (error) {
    console.error('获取练习题失败:', error);
    res.status(500).json({
      success: false,
      message: '获取练习题失败',
      error: error.message
    });
  }
};

// 按知识点获取练习题
exports.getExercisesByKnowledgePoint = async (req, res) => {
  try {
    const { knowledgePoint } = req.params;
    const { limit = 20, page = 1 } = req.query;
    
    // 获取所有练习题
    let exercises = exports.getExercisesData();
    
    // 不再按知识点筛选，而是随机选择
    const shuffledExercises = [...exercises].sort(() => 0.5 - Math.random());
    
    // 计算总数
    const total = exercises.length;
    
    // 应用分页
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedExercises = shuffledExercises.slice(startIndex, endIndex);
    
    res.status(200).json({
      success: true,
      count: paginatedExercises.length,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: paginatedExercises
    });
  } catch (error) {
    console.error('获取练习题失败:', error);
    res.status(500).json({
      success: false,
      message: '获取练习题失败',
      error: error.message
    });
  }
};

// 按类型获取练习题
exports.getExercisesByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 20, page = 1 } = req.query;
    
    // 获取所有练习题
    let exercises = exports.getExercisesData();
    
    // 不再按类型筛选，而是随机选择
    const shuffledExercises = [...exercises].sort(() => 0.5 - Math.random());
    
    // 计算总数
    const total = exercises.length;
    
    // 应用分页
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedExercises = shuffledExercises.slice(startIndex, endIndex);
    
    res.status(200).json({
      success: true,
      count: paginatedExercises.length,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: paginatedExercises
    });
  } catch (error) {
    console.error('获取练习题失败:', error);
    res.status(500).json({
      success: false,
      message: '获取练习题失败',
      error: error.message
    });
  }
};

// 获取随机练习题
exports.getRandomExercises = async (req, res) => {
  try {
    const { count = 5, type, category, knowledgePoint } = req.query;
    
    // 获取所有练习题
    let exercises = exports.getExercisesData();
    
    // 应用筛选条件
    if (type) {
      exercises = exercises.filter(exercise => exercise.type === type);
    }
    
    if (category) {
      exercises = exercises.filter(exercise => exercise.category === category);
    }
    
    if (knowledgePoint) {
      exercises = exercises.filter(exercise => exercise.knowledgePoint === knowledgePoint);
    }
    
    // 随机选择指定数量的练习题
    const shuffled = [...exercises].sort(() => 0.5 - Math.random());
    const randomExercises = shuffled.slice(0, parseInt(count));
    
    res.status(200).json({
      success: true,
      count: randomExercises.length,
      data: randomExercises
    });
  } catch (error) {
    console.error('获取随机练习题失败:', error);
    res.status(500).json({
      success: false,
      message: '获取随机练习题失败',
      error: error.message
    });
  }
};

// 提交练习答案
exports.submitExercise = async (req, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;
    const userId = req.user ? req.user.id : 'default_user'; // 未登录用户使用默认ID
    
    // 获取所有练习题
    const exercises = exports.getExercisesData();
    
    // 查找指定ID的练习题
    const exercise = exercises.find(ex => ex._id === id);
    
    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: '练习题不存在'
      });
    }
    
    // 判断是否正确
    let isCorrect = false;
    
    if (exercise.type === 'multiple-choice') {
      // 多选题比较数组
      const sortedUserAnswer = Array.isArray(answer) ? [...answer].sort() : [];
      const sortedCorrectAnswer = Array.isArray(exercise.answer) ? [...exercise.answer].sort() : [];
      isCorrect = JSON.stringify(sortedUserAnswer) === JSON.stringify(sortedCorrectAnswer);
    } else if (exercise.type === 'short-answer' || exercise.type === 'code-completion') {
      // 简答题和代码补全题简单匹配
      isCorrect = String(answer).trim() === String(exercise.answer).trim();
    } else {
      // 单选题和判断题直接比较
      isCorrect = answer === exercise.answer;
    }
    
    console.log(`用户 ${userId} 的练习题 ${id} 答案已处理，结果: ${isCorrect ? '正确' : '错误'}`);
    
    // 保存练习历史记录
    if (req.user) {
      try {
        // 创建历史记录项
        const historyItem = {
          _id: `history_${Date.now()}`,
          exercise: {
            _id: exercise._id,
            title: exercise.title || `练习题 ${exercise._id}`,
            content: exercise.content,
            type: exercise.type,
            category: exercise.category,
            knowledgePoint: exercise.knowledgePoint
          },
          userAnswer: answer,
          isCorrect: isCorrect,
          exerciseType: exercise.type,
          createdAt: new Date().toISOString()
        };
        
        // 保存历史记录
        saveUserExerciseHistory(userId, historyItem);
        console.log(`用户 ${userId} 的练习历史记录已保存`);
      } catch (error) {
        console.error(`保存用户 ${userId} 的练习历史记录失败:`, error);
      }
    }
    
    res.status(200).json({
      success: true,
      isCorrect,
      correctAnswer: exercise.answer,
      explanation: exercise.explanation
    });
  } catch (error) {
    console.error('提交练习答案失败:', error);
    res.status(500).json({
      success: false,
      message: '提交练习答案失败',
      error: error.message
    });
  }
};

/**
 * 保存用户练习历史记录
 * @param {string} userId - 用户ID
 * @param {Object} historyItem - 历史记录项
 */
const saveUserExerciseHistory = (userId, historyItem) => {
  try {
    console.log(`正在保存用户 ${userId} 的练习历史记录...`);
    
    // 确定历史记录文件路径
    const historyDir = path.join(__dirname, '../data/history');
    const historyFilePath = path.join(historyDir, `user_${userId}_history.json`);
    
    // 确保历史记录目录存在
    if (!fs.existsSync(historyDir)) {
      fs.mkdirSync(historyDir, { recursive: true });
      console.log(`创建历史记录目录: ${historyDir}`);
    }
    
    // 加载现有历史记录
    let history = [];
    if (fs.existsSync(historyFilePath)) {
      try {
        const data = fs.readFileSync(historyFilePath, 'utf8');
        history = JSON.parse(data);
        console.log(`成功加载历史记录，共 ${history.length} 条`);
      } catch (error) {
        console.error(`加载历史记录失败:`, error);
        // 如果文件损坏，创建新的历史记录
        history = [];
      }
    } else {
      console.log(`历史记录文件不存在，将创建新文件: ${historyFilePath}`);
    }
    
    // 添加新的历史记录
    history.push(historyItem);
    console.log(`添加新历史记录，现有 ${history.length} 条`);
    
    // 保存历史记录
    fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2), 'utf8');
    console.log(`历史记录已保存到 ${historyFilePath}`);
    
    return true;
  } catch (error) {
    console.error('保存练习历史记录失败:', error);
    return false;
  }
};

// 创建测试历史记录数据，确保历史记录文件存在
exports.createTestHistoryData = () => {
  try {
    // 默认用户ID
    const userId = 'default_user';
    
    // 创建一些测试历史记录
    const testHistoryItems = [
      {
        _id: `history_${Date.now()}_1`,
        exercise: {
          _id: 'test_exercise_1',
          title: 'JavaScript变量声明',
          content: '以下哪种方式不能声明JavaScript变量？',
          type: 'single-choice',
          category: 'javascript',
          knowledgePoint: 'JavaScript基础'
        },
        userAnswer: 'D',
        isCorrect: true,
        exerciseType: 'single-choice',
        createdAt: new Date().toISOString()
      },
      {
        _id: `history_${Date.now()}_2`,
        exercise: {
          _id: 'test_exercise_2',
          title: 'CSS选择器',
          content: '以下哪个CSS选择器优先级最高？',
          type: 'single-choice',
          category: 'html_css',
          knowledgePoint: 'CSS优先级'
        },
        userAnswer: 'B',
        isCorrect: false,
        exerciseType: 'single-choice',
        createdAt: new Date(Date.now() - 86400000).toISOString() // 昨天
      },
      {
        _id: `history_${Date.now()}_3`,
        exercise: {
          _id: 'test_exercise_3',
          title: 'Vue生命周期',
          content: 'Vue组件的created钩子在DOM挂载前执行',
          type: 'true-false',
          category: 'framework',
          knowledgePoint: 'Vue生命周期'
        },
        userAnswer: true,
        isCorrect: true,
        exerciseType: 'true-false',
        createdAt: new Date(Date.now() - 172800000).toISOString() // 前天
      }
    ];
    
    // 保存测试历史记录
    testHistoryItems.forEach(item => {
      saveUserExerciseHistory(userId, item);
    });
    
    console.log(`已创建 ${testHistoryItems.length} 条测试历史记录`);
    
    return true;
  } catch (error) {
    console.error('创建测试历史记录失败:', error);
    return false;
  }
};

// 获取练习历史记录
exports.getUserExerciseHistory = async (req, res) => {
  try {
    console.log('获取用户练习历史记录API被调用');
    
    // 从req.user中获取用户ID，如果不存在则使用默认ID
    let userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      // 尝试从请求体或查询参数获取用户ID
      userId = req.body?.userId || (req.query ? req.query.userId : '') || '';
      
      // 如果仍然没有用户ID或userId为空字符串，使用默认ID
      if (!userId || userId === '') {
        userId = '1748618904860'; // 默认用户ID
        console.log(`未找到用户ID，使用默认ID: ${userId}`);
      }
    }
    
    // 确保userId是字符串类型
    userId = String(userId);
    
    console.log(`正在获取用户 ${userId} 的练习历史记录`);
    
    const historyDir = path.join(__dirname, '../data/history');
    const historyFilePath = path.join(historyDir, `user_${userId}_history.json`);
    
    console.log(`历史记录文件路径: ${historyFilePath}`);
    
    // 确保历史记录目录存在
    if (!fs.existsSync(historyDir)) {
      console.log(`历史记录目录不存在，创建目录: ${historyDir}`);
      fs.mkdirSync(historyDir, { recursive: true });
    }
    
    // 加载历史记录
    let history = [];
    if (fs.existsSync(historyFilePath)) {
      try {
        console.log(`历史记录文件存在，正在读取...`);
        const data = fs.readFileSync(historyFilePath, 'utf8');
        history = JSON.parse(data);
        console.log(`成功读取历史记录，共 ${history.length} 条记录`);
      } catch (error) {
        console.error(`加载用户[${userId}]历史记录失败:`, error);
        // 即使读取失败，也继续处理，使用空数组
        history = [];
      }
    } else {
      console.log(`用户 ${userId} 的历史记录文件不存在，将创建空历史记录`);
      // 创建空的历史记录文件
      try {
        fs.writeFileSync(historyFilePath, JSON.stringify([]), 'utf8');
        console.log(`成功创建空历史记录文件: ${historyFilePath}`);
      } catch (error) {
        console.error(`创建空历史记录文件失败:`, error);
        // 继续处理，使用空数组
      }
    }
    
    // 应用筛选条件
    const { limit = 20, page = 1, timeFrame, exerciseType } = req.query;
    console.log(`分页参数: 第 ${page} 页，每页 ${limit} 条`);
    console.log(`筛选条件: 时间范围=${timeFrame || '全部'}, 题目类型=${exerciseType || '全部'}`);
    
    // 应用时间筛选
    if (timeFrame) {
      const now = new Date();
      let startDate;
      
      if (timeFrame === 'today') {
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
      } else if (timeFrame === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeFrame === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      if (startDate) {
        const originalLength = history.length;
        history = history.filter(item => {
          try {
            return new Date(item.createdAt) >= startDate;
          } catch (e) {
            return false;
          }
        });
        console.log(`时间筛选: 从 ${originalLength} 条记录中筛选出 ${history.length} 条`);
      }
    }
    
    // 应用题型筛选
    if (exerciseType) {
      const originalLength = history.length;
      history = history.filter(item => {
        try {
          const type = item.exerciseType || (item.exercise && item.exercise.type) || '';
          return type === exerciseType;
        } catch (e) {
          return false;
        }
      });
      console.log(`题型筛选: 从 ${originalLength} 条记录中筛选出 ${history.length} 条`);
    }
    
    // 计算分页
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = history.length;
    
    console.log(`计算分页: 跳过 ${skip} 条，总共 ${total} 条`);
    
    // 排序和分页
    const paginatedHistory = history
      .sort((a, b) => {
        try {
          return new Date(b.createdAt) - new Date(a.createdAt);
        } catch (e) {
          return 0;
        }
      })
      .slice(skip, skip + parseInt(limit));
    
    console.log(`分页后获取 ${paginatedHistory.length} 条记录`);
    
    // 计算统计数据
    const correctCount = history.filter(item => item.isCorrect).length;
    
    const stats = {
      total,
      correct: correctCount,
      accuracy: total > 0 ? (correctCount / total * 100).toFixed(2) : 0
    };
    
    console.log(`统计数据: 总题数=${stats.total}, 正确数=${stats.correct}, 正确率=${stats.accuracy}%`);
    
    // 确保返回标准格式的响应
    return res.status(200).json({
      success: true,
      count: paginatedHistory.length,
      total,
      stats,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: paginatedHistory
    });
  } catch (error) {
    console.error('获取练习历史记录失败:', error);
    // 即使发生错误也返回一个标准格式的响应
    return res.status(200).json({
      success: true,
      message: '获取练习历史记录失败，返回空数据',
      count: 0,
      total: 0,
      stats: {
        total: 0,
        correct: 0,
        accuracy: 0
      },
      currentPage: 1,
      totalPages: 1,
      data: []
    });
  }
};

// 创建新练习题
exports.createExercise = async (req, res) => {
  try {
    // 创建新练习题数据
    const exerciseData = {
      _id: `exercise_${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // 获取现有练习题
    const exercises = exports.getExercisesData();
    
    // 添加新练习题
    exercises.push(exerciseData);
    
    // 保存更新后的练习题数据
    const saved = saveExercisesData(exercises);
    
    if (!saved) {
      return res.status(500).json({
        success: false,
        message: '保存练习题失败'
      });
    }
    
    res.status(201).json({
      success: true,
      message: '练习题创建成功',
      data: exerciseData
    });
  } catch (error) {
    console.error('创建练习题失败:', error);
    res.status(500).json({
      success: false,
      message: '创建练习题失败',
      error: error.message
    });
  }
};

// 更新练习题
exports.updateExercise = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 获取所有练习题
    const exercises = exports.getExercisesData();
    
    // 查找要更新的练习题
    const index = exercises.findIndex(ex => ex._id === id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '练习题不存在'
      });
    }
    
    // 更新练习题
    const updatedExercise = {
      ...exercises[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    exercises[index] = updatedExercise;
    
    // 保存更新后的练习题数据
    const saved = saveExercisesData(exercises);
    
    if (!saved) {
      return res.status(500).json({
        success: false,
        message: '保存练习题失败'
      });
    }
    
    res.status(200).json({
      success: true,
      message: '练习题更新成功',
      data: updatedExercise
    });
  } catch (error) {
    console.error('更新练习题失败:', error);
    res.status(500).json({
      success: false,
      message: '更新练习题失败',
      error: error.message
    });
  }
};

// 删除练习题
exports.deleteExercise = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 获取所有练习题
    const exercises = exports.getExercisesData();
    
    // 查找要删除的练习题
    const index = exercises.findIndex(ex => ex._id === id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '练习题不存在'
      });
    }
    
    // 删除练习题
    exercises.splice(index, 1);
    
    // 保存更新后的练习题数据
    const saved = saveExercisesData(exercises);
    
    if (!saved) {
      return res.status(500).json({
        success: false,
        message: '删除练习题失败'
      });
    }
    
    res.status(200).json({
      success: true,
      message: '练习题删除成功'
    });
  } catch (error) {
    console.error('删除练习题失败:', error);
    res.status(500).json({
      success: false,
      message: '删除练习题失败',
      error: error.message
    });
  }
};

// 批量导入练习题
exports.bulkImportExercises = async (req, res) => {
  try {
    console.log('批量导入练习题API被调用');
    
    // 获取请求体中的练习题数组
    const newExercises = req.body;
    
    // 验证是否为数组
    if (!Array.isArray(newExercises)) {
      return res.status(400).json({
        success: false,
        message: '请求体必须是练习题对象的数组'
      });
    }
    
    // 验证数组是否为空
    if (newExercises.length === 0) {
      return res.status(400).json({
        success: false,
        message: '练习题数组不能为空'
      });
    }
    
    console.log(`准备导入 ${newExercises.length} 道练习题`);
    
    // 验证每个练习题对象是否有必要的字段
    const invalidExercises = [];
    
    for (let i = 0; i < newExercises.length; i++) {
      const exercise = newExercises[i];
      if (!exercise.type || !exercise.content || !exercise.category) {
        invalidExercises.push(i + 1);
      }
    }
    
    if (invalidExercises.length > 0) {
      return res.status(400).json({
        success: false,
        message: `第 ${invalidExercises.join(', ')} 题缺少必要的字段(类型、内容或分类)`
      });
    }
    
    // 获取现有练习题
    const exercises = getExercisesData();
    
    // 为每个新练习题添加ID和创建时间
    const timestamp = new Date().toISOString();
    const processedExercises = newExercises.map(exercise => ({
      _id: `ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...exercise,
      createdAt: timestamp,
      updatedAt: timestamp
    }));
    
    // 添加到现有练习题列表
    exercises.push(...processedExercises);
    
    // 保存更新后的练习题数据
    saveExercisesData(exercises);
    
    console.log(`成功导入 ${processedExercises.length} 道练习题`);
    
    res.status(201).json({
      success: true,
      count: processedExercises.length,
      message: `成功导入 ${processedExercises.length} 道练习题`,
      data: processedExercises
    });
  } catch (error) {
    console.error('批量导入练习题失败:', error);
    res.status(500).json({
      success: false,
      message: '批量导入练习题失败',
      error: error.message
    });
  }
};

// 获取用户练习统计数据
exports.getUserExerciseStats = async (req, res) => {
  try {
    console.log('获取用户练习统计数据API被调用');
    
    // 从req.user中获取用户ID，如果不存在则使用默认ID
    let userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      // 尝试从请求体或查询参数获取用户ID
      userId = req.body?.userId || (req.query ? req.query.userId : '') || '';
      
      // 如果仍然没有用户ID或userId为空字符串，使用默认ID
      if (!userId || userId === '') {
        userId = '1748618904860'; // 默认用户ID
        console.log(`未找到用户ID，使用默认ID: ${userId}`);
      }
    }
    
    // 确保userId是字符串类型
    userId = String(userId);
    
    // 如果userId以'user_'开头，去掉前缀
    if (userId && userId.startsWith('user_')) {
      userId = userId.substring(5);
      console.log(`去掉前缀后的用户ID: ${userId}`);
    }
    
    // 获取时间范围参数
    const timeFrame = req.query?.timeFrame || 'all';
    
    // 检查是否强制刷新
    const forceRefresh = req.query?.forceRefresh === 'true';
    if (forceRefresh) {
      console.log('检测到强制刷新参数，将重新计算统计数据');
    }
    
    // 构建历史记录文件路径
    const historyDir = path.join(__dirname, '../data/history');
    const historyFilePath = path.join(historyDir, `user_${userId}_history.json`);
    
    console.log(`历史记录文件路径: ${historyFilePath}`);
    
    // 确保历史记录目录存在
    if (!fs.existsSync(historyDir)) {
      console.log(`历史记录目录不存在，创建目录: ${historyDir}`);
      fs.mkdirSync(historyDir, { recursive: true });
    }
    
    // 默认统计数据
    const defaultStats = {
      total: 0,
      correct: 0,
      correctRate: 0,
      typeDistribution: [
        { type: 'single-choice', count: 0, correctRate: 0 },
        { type: 'multiple-choice', count: 0, correctRate: 0 },
        { type: 'true-false', count: 0, correctRate: 0 }
      ]
    };
    
    // 检查文件是否存在
    let historyData = [];
    if (fs.existsSync(historyFilePath)) {
      try {
        console.log(`用户 ${userId} 的历史记录文件存在，正在读取...`);
        // 强制使用UTF-8编码，避免编码问题
        const fileContent = fs.readFileSync(historyFilePath, {encoding: 'utf8'});
        
        // 检查文件内容是否为空
        if (!fileContent || fileContent.trim() === '') {
          console.warn('历史记录文件内容为空，创建新的空数组');
          historyData = [];
        } else {
          try {
            historyData = JSON.parse(fileContent);
            console.log(`成功读取历史记录，共 ${historyData.length} 条记录`);
          } catch (parseError) {
            console.error('解析历史记录文件失败:', parseError);
            historyData = [];
          }
        }
      } catch (error) {
        console.error(`读取用户 ${userId} 的历史记录文件失败:`, error);
        historyData = [];
      }
    } else {
      console.warn(`用户 ${userId} 的练习历史文件不存在，尝试查找其他历史记录文件`);
      
      // 尝试读取目录中的所有历史记录文件
      try {
        const files = fs.readdirSync(historyDir);
        console.log(`历史记录目录中的文件:`, files);
        
        // 如果有任何历史记录文件，使用第一个
        if (files.length > 0) {
          const firstHistoryFile = path.join(historyDir, files[0]);
          console.log(`使用第一个可用的历史记录文件: ${firstHistoryFile}`);
          const data = fs.readFileSync(firstHistoryFile, 'utf8');
          historyData = JSON.parse(data);
          console.log(`成功读取历史记录，共 ${historyData.length} 条记录`);
        }
      } catch (error) {
        console.error(`查找其他历史记录文件失败:`, error);
      }
    }
    
    // 如果没有数据，返回默认统计数据
    if (historyData.length === 0) {
      return res.status(200).json({
        success: true,
        message: '没有找到练习历史数据',
        data: defaultStats
      });
    }
    
    // 计算统计数据
    const stats = calculateStats(historyData);
    
    // 打印详细的统计数据
    console.log('计算得到的统计数据:', {
      total: stats.total,
      correct: stats.correct,
      correctRate: stats.correctRate,
      typeDistribution: stats.typeDistribution.map(t => `${t.type}: ${t.count}题, 正确率${t.correctRate}%`).join('; ')
    });
    
    return res.status(200).json({
      success: true,
      message: '获取练习统计成功',
      data: stats
    });
  } catch (error) {
    console.error('获取练习统计失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取练习统计失败',
      error: error.message
    });
  }
};

/**
 * 从题库中获取所有知识点
 * @returns {Promise<Array>} - 知识点列表
 */
async function getKnowledgePointsFromExercises() {
  try {
    // 定义题库文件路径
    const exerciseFiles = [
      path.join(__dirname, '../data/exercises/javascript_exercises.json'),
      path.join(__dirname, '../data/exercises/html_css_exercises.json'),
      path.join(__dirname, '../data/exercises/framework_exercises.json')
    ];
    
    // 存储所有知识点
    const knowledgePointsSet = new Set();
    
    // 读取所有题库文件
    for (const filePath of exerciseFiles) {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        const exercises = JSON.parse(data);
        
        // 提取知识点
        if (Array.isArray(exercises)) {
          exercises.forEach(exercise => {
            if (exercise.knowledgePoint) {
              knowledgePointsSet.add(exercise.knowledgePoint);
            }
          });
        }
      }
    }
    
    // 转换为数组并返回
    return Array.from(knowledgePointsSet);
  } catch (error) {
    console.error('从题库获取知识点失败:', error);
    // 返回一些基本知识点作为备用
    return [
      'JavaScript基础', 'HTML基础', 'CSS基础', 
      'Vue基础', 'React基础', 'JavaScript异步编程'
    ];
  }
}

// 获取练习历史
exports.getExerciseHistory = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : 'default_user';
    console.log(`尝试获取用户 ${userId} 的练习历史记录`);
    
    // 获取练习历史数据
    let historyFilePath = path.join(__dirname, '../data/history', `${userId}_history.json`);
    
    // 检查文件是否存在
    if (!fs.existsSync(historyFilePath)) {
      console.warn(`用户 ${userId} 的练习历史文件不存在，尝试使用测试数据`);
      // 尝试使用测试数据
      historyFilePath = path.join(__dirname, '../data/history', `user123_history.json`);
      
      if (!fs.existsSync(historyFilePath)) {
        console.warn(`测试数据文件也不存在`);
        return res.status(200).json({
          success: true,
          message: '没有找到练习历史数据',
          data: []
        });
      }
    }
    
    // 读取历史记录文件
    console.log(`读取历史记录文件: ${historyFilePath}`);
    const historyData = JSON.parse(fs.readFileSync(historyFilePath, 'utf8'));
    console.log(`成功读取历史记录，共 ${historyData.length} 条`);
    
    return res.status(200).json({
      success: true,
      message: '获取练习历史成功',
      data: historyData
    });
  } catch (error) {
    console.error('获取练习历史失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取练习历史失败',
      error: error.message
    });
  }
};

// 获取练习统计
exports.getExerciseStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 获取练习历史数据
    const historyDir = path.join(__dirname, '../data/history');
    const historyFilePath = path.join(historyDir, `user_${userId}_history.json`);
    
    // 默认统计数据
    const defaultStats = {
      overallStats: {
        total: 0,
        correct: 0,
        correctRate: 0,
        errorRate: 0
      },
      typeDistribution: []
    };
    
    // 检查文件是否存在
    let historyData = [];
    if (fs.existsSync(historyFilePath)) {
      try {
        console.log(`用户 ${userId} 的历史记录文件存在，正在读取...`);
        historyData = JSON.parse(fs.readFileSync(historyFilePath, 'utf8'));
        console.log(`成功读取历史记录，共 ${historyData.length} 条记录`);
      } catch (error) {
        console.error(`读取用户 ${userId} 的历史记录文件失败:`, error);
      }
    } else {
      console.warn(`用户 ${userId} 的练习历史文件不存在，尝试查找其他历史记录文件`);
      
      // 尝试读取目录中的所有历史记录文件
      try {
        const files = fs.readdirSync(historyDir);
        console.log(`历史记录目录中的文件:`, files);
        
        // 如果有任何历史记录文件，使用第一个
        if (files.length > 0) {
          const firstHistoryFile = path.join(historyDir, files[0]);
          console.log(`使用第一个可用的历史记录文件: ${firstHistoryFile}`);
          const data = fs.readFileSync(firstHistoryFile, 'utf8');
          historyData = JSON.parse(data);
          console.log(`成功读取历史记录，共 ${historyData.length} 条记录`);
        }
      } catch (error) {
        console.error(`查找其他历史记录文件失败:`, error);
      }
    }
    
    // 如果没有数据，返回默认统计数据
    if (historyData.length === 0) {
      return res.status(200).json({
        success: true,
        message: '没有找到练习历史数据',
        data: defaultStats
      });
    }
    
    // 计算统计数据
    const stats = calculateStats(historyData);
    
    return res.status(200).json({
      success: true,
      message: '获取练习统计成功',
      data: stats
    });
  } catch (error) {
    console.error('获取练习统计失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取练习统计失败',
      error: error.message
    });
  }
};

// 计算统计数据的辅助函数
function calculateStats(historyData) {
  // 总体统计
  const total = historyData.length;
  const correct = historyData.filter(record => record.isCorrect).length;
  const correctRate = total > 0 ? Math.round((correct / total) * 100) : 0;
  
  // 题型分布统计
  const typeMap = {};
  
  historyData.forEach(record => {
    const type = record.type || (record.exercise && record.exercise.type) || 'unknown';
    
    if (!typeMap[type]) {
      typeMap[type] = {
        count: 0,
        correct: 0
      };
    }
    
    typeMap[type].count++;
    if (record.isCorrect) {
      typeMap[type].correct++;
    }
  });
  
  const typeDistribution = Object.entries(typeMap).map(([type, data]) => ({
    type,
    count: data.count,
    correctRate: data.count > 0 ? Math.round((data.correct / data.count) * 100) : 0
  }));
  
  // 返回前端期望的格式
  return {
    total,
    correct,
    correctRate,
    typeDistribution
  };
}

// 添加练习历史记录
exports.addExerciseHistory = async (req, res) => {
  try {
    // 获取用户ID和历史记录数据
    const userId = req.user?.id || req.user?._id;
    const historyItem = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未授权，需要登录'
      });
    }

    if (!historyItem || !historyItem.exerciseId) {
      return res.status(400).json({
        success: false,
        message: '提供的历史记录数据不完整，需要exerciseId字段'
      });
    }

    // 格式化历史记录
    const formattedHistoryItem = {
      _id: `history_${Date.now()}`,
      exercise: {
        _id: historyItem.exerciseId,
        title: historyItem.title || `练习题 ${historyItem.exerciseId}`,
        knowledgePoint: historyItem.knowledgePoint || 'unknown',
        type: historyItem.type || 'unknown',
        category: historyItem.category || 'unknown'
      },
      userAnswer: historyItem.userAnswer || '',
      isCorrect: historyItem.isCorrect,
      exerciseType: historyItem.type || 'unknown',
      createdAt: historyItem.timestamp || new Date().toISOString()
    };

    // 保存历史记录
    const result = saveUserExerciseHistory(userId, formattedHistoryItem);

    if (result) {
      res.status(200).json({
        success: true,
        message: '练习历史记录已保存',
        data: {
          historyId: formattedHistoryItem._id
        }
      });
    } else {
      throw new Error('保存历史记录失败');
    }
  } catch (error) {
    console.error('添加练习历史记录失败:', error);
    res.status(500).json({
      success: false,
      message: '添加练习历史记录失败',
      error: error.message
    });
  }
};

// 提交练习记录
exports.submitExerciseRecord = async (req, res) => {
  try {
    // 从req.user中获取用户ID
    const userId = req.user?.id || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未授权，请先登录'
      });
    }
    
    const exerciseRecord = req.body;
    
    // 确保记录包含必要字段
    if (!exerciseRecord || !exerciseRecord.exerciseId) {
      return res.status(400).json({
        success: false,
        message: '练习记录不完整'
      });
    }
    
    // 添加用户ID和时间戳
    exerciseRecord.userId = userId;
    exerciseRecord.timestamp = exerciseRecord.timestamp || new Date().toISOString();
    exerciseRecord._id = `history_${Date.now()}`;
    
    // 保存到用户历史记录文件
    const historyDir = path.join(__dirname, '../data/history');
    const historyFilePath = path.join(historyDir, `user_${userId}_history.json`);
    
    // 确保目录存在
    if (!fs.existsSync(historyDir)) {
      fs.mkdirSync(historyDir, { recursive: true });
    }
    
    // 读取现有历史记录或创建新的
    let historyData = [];
    if (fs.existsSync(historyFilePath)) {
      historyData = JSON.parse(fs.readFileSync(historyFilePath, 'utf8'));
    }
    
    // 添加新记录
    historyData.push(exerciseRecord);
    
    // 保存历史记录
    fs.writeFileSync(historyFilePath, JSON.stringify(historyData, null, 2), 'utf8');
    
    res.status(200).json({
      success: true,
      message: '练习记录已保存'
    });
  } catch (error) {
    console.error('保存练习记录失败:', error);
    res.status(500).json({
      success: false,
      message: '保存练习记录失败',
      error: error.message
    });
  }
};

// 获取薄弱点分析
exports.getWeaknessAnalysis = async (req, res) => {
  try {
    console.log('收到薄弱点分析请求，参数:', req.query);
    
    // 从req.user中获取用户ID，如果不存在则使用默认ID
    let userId = req.user?._id || req.user?.id;
    
    if (!userId) {
      // 尝试从请求体或查询参数获取用户ID
      userId = req.body?.userId || (req.query ? req.query.userId : '') || '';
      
      // 如果仍然没有用户ID或userId为空字符串，使用默认ID
      if (!userId || userId === '') {
        userId = '1748618904860'; // 默认用户ID
        console.log(`未找到用户ID，使用默认ID: ${userId}`);
      }
    }
    
    // 确保userId是字符串类型
    userId = String(userId);
    
    console.log('用户ID:', userId);
    
    // 如果userId以'user_'开头，去掉前缀
    if (userId && userId.startsWith('user_')) {
      userId = userId.substring(5);
      console.log(`去掉前缀后的用户ID: ${userId}`);
    }
    
    // 获取时间范围参数
    const timeframe = req.query?.timeframe || 'all';
    
    // 构建历史记录文件路径
    const historyDir = path.join(__dirname, '../data/history');
    const historyFilePath = path.join(historyDir, `user_${userId}_history.json`);
    
    // 确保历史记录目录存在
    if (!fs.existsSync(historyDir)) {
      console.log(`历史记录目录不存在，创建目录: ${historyDir}`);
      fs.mkdirSync(historyDir, { recursive: true });
    }
    
    // 默认分析数据
    const defaultAnalysis = {
      weakKnowledgePoints: [],
      weakExerciseTypes: [],
      summary: {
        totalExercises: 0,
        totalMistakes: 0
      }
    };
    
    // 检查文件是否存在
    let historyData = [];
    if (fs.existsSync(historyFilePath)) {
      try {
        console.log(`用户 ${userId} 的历史记录文件存在，正在读取...`);
        historyData = JSON.parse(fs.readFileSync(historyFilePath, 'utf8'));
        console.log(`成功读取历史记录，共 ${historyData.length} 条记录`);
      } catch (error) {
        console.error(`读取用户 ${userId} 的历史记录文件失败:`, error);
      }
    } else {
      console.warn(`用户 ${userId} 的练习历史文件不存在，尝试查找其他历史记录文件`);
      
      // 尝试读取目录中的所有历史记录文件
      try {
        const files = fs.readdirSync(historyDir);
        console.log(`历史记录目录中的文件:`, files);
        
        // 如果有任何历史记录文件，使用第一个
        if (files.length > 0) {
          const firstHistoryFile = path.join(historyDir, files[0]);
          console.log(`使用第一个可用的历史记录文件: ${firstHistoryFile}`);
          const data = fs.readFileSync(firstHistoryFile, 'utf8');
          historyData = JSON.parse(data);
          console.log(`成功读取历史记录，共 ${historyData.length} 条记录`);
        }
      } catch (error) {
        console.error(`查找其他历史记录文件失败:`, error);
      }
      
      // 如果仍然没有找到历史记录，返回默认分析数据
      if (historyData.length === 0) {
        return res.status(200).json({
          success: true,
          data: defaultAnalysis
        });
      }
    }
    
    // 根据时间范围筛选数据
    if (timeframe && timeframe !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (timeframe) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      historyData = historyData.filter(record => {
        const recordDate = new Date(record.createdAt || record.timestamp);
        return recordDate >= cutoffDate;
      });
    }
    
    // 如果没有历史数据，返回默认分析
    if (historyData.length === 0) {
      return res.status(200).json({
        success: true,
        data: defaultAnalysis
      });
    }
    
    // 分析知识点
    const knowledgePointMap = {};
    historyData.forEach(record => {
      const knowledgePoint = record.exercise?.knowledgePoint || 'unknown';
      if (!knowledgePointMap[knowledgePoint]) {
        knowledgePointMap[knowledgePoint] = {
          total: 0,
          correct: 0
        };
      }
      knowledgePointMap[knowledgePoint].total++;
      if (record.isCorrect) {
        knowledgePointMap[knowledgePoint].correct++;
      }
    });
    
    // 分析题型
    const typeMap = {};
    historyData.forEach(record => {
      const type = record.exercise?.type || record.exerciseType || 'unknown';
      if (!typeMap[type]) {
        typeMap[type] = {
          total: 0,
          correct: 0
        };
      }
      typeMap[type].total++;
      if (record.isCorrect) {
        typeMap[type].correct++;
      }
    });
    
    // 计算薄弱知识点（正确率低于60%的知识点）
    const weakKnowledgePoints = Object.entries(knowledgePointMap)
      .map(([knowledgePoint, data]) => ({
        knowledgePoint,
        correctRate: Math.round((data.correct / data.total) * 100),
        recommendedPractices: Math.ceil((data.total - data.correct) * 1.5) // 建议练习次数为错误数的1.5倍
      }))
      .filter(item => item.correctRate < 60)
      .sort((a, b) => a.correctRate - b.correctRate);
    
    // 计算薄弱题型（正确率低于60%的题型）
    const weakExerciseTypes = Object.entries(typeMap)
      .map(([exerciseType, data]) => ({
        exerciseType,
        correctRate: Math.round((data.correct / data.total) * 100),
        recommendedPractices: Math.ceil((data.total - data.correct) * 1.5)
      }))
      .filter(item => item.correctRate < 60)
      .sort((a, b) => a.correctRate - b.correctRate);
    
    // 汇总数据
    const analysis = {
      weakKnowledgePoints,
      weakExerciseTypes,
      summary: {
        totalExercises: historyData.length,
        totalMistakes: historyData.filter(record => !record.isCorrect).length
      }
    };
    
    return res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('获取薄弱点分析失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取薄弱点分析失败',
      error: error.message
    });
  }
};

// 获取知识点列表
exports.getKnowledgePoints = async (req, res) => {
  try {
    // 聚合查询获取所有不同的知识点
    const knowledgePoints = await Exercise.aggregate([
      { $group: { _id: "$knowledgePoint" } },
      { $sort: { _id: 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      count: knowledgePoints.length,
      data: knowledgePoints.map(item => item._id)
    });
  } catch (error) {
    console.error('获取知识点列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取知识点列表失败',
      error: error.message
    });
  }
}; 
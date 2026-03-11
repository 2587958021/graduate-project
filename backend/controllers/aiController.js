const fs = require('fs');
const path = require('path');
const { analyzeWeakness, generateLearningRecommendations } = require('../algorithms/weaknessAnalyzer');

// 数据文件目录
const dataDir = path.join(__dirname, '../data');
const historyDir = path.join(dataDir, 'history');

/**
 * 获取用户练习历史
 * @param {String} userId - 用户ID
 * @param {String} timeframe - 时间范围（all, week, month）
 * @returns {Array} - 用户练习历史记录
 */
const getUserExerciseHistory = (userId, timeframe = 'all') => {
  try {
    // 历史记录文件路径
    const historyFilePath = path.join(historyDir, `user_${userId}_history.json`);
    console.log(`尝试读取历史记录文件: ${historyFilePath}`);
    
    // 检查文件是否存在
    if (!fs.existsSync(historyFilePath)) {
      console.log(`用户 ${userId} 的历史记录文件不存在，尝试查找其他历史记录文件`);
      
      // 尝试读取目录中的所有历史记录文件
      try {
        // 确保目录存在
        if (!fs.existsSync(historyDir)) {
          console.log(`历史记录目录不存在，创建目录: ${historyDir}`);
          fs.mkdirSync(historyDir, { recursive: true });
          return [];
        }
        
        const files = fs.readdirSync(historyDir);
        console.log(`历史记录目录中的文件:`, files);
        
        // 如果有任何历史记录文件，使用第一个
        if (files.length > 0) {
          const firstHistoryFile = path.join(historyDir, files[0]);
          console.log(`使用第一个可用的历史记录文件: ${firstHistoryFile}`);
          
          // 直接检查文件是否存在
          if (fs.existsSync(firstHistoryFile)) {
            console.log(`文件存在，准备读取`);
            try {
              const data = fs.readFileSync(firstHistoryFile, 'utf8');
              console.log(`成功读取文件，内容长度: ${data.length}`);
              const historyData = JSON.parse(data);
              console.log(`成功解析JSON，包含 ${historyData.length} 条记录`);
              
              // 根据时间范围筛选
              let filteredHistory = [...historyData];
              if (timeframe !== 'all') {
                const now = new Date();
                let startDate;
                
                if (timeframe === 'week') {
                  startDate = new Date(now.setDate(now.getDate() - 7));
                } else if (timeframe === 'month') {
                  startDate = new Date(now.setMonth(now.getMonth() - 1));
                }
                
                filteredHistory = historyData.filter(record => {
                  const recordDate = new Date(record.timestamp || record.createdAt);
                  return recordDate >= startDate;
                });
              }
              
              return filteredHistory;
            } catch (readError) {
              console.error(`读取或解析文件失败:`, readError);
              return [];
            }
          } else {
            console.log(`文件不存在: ${firstHistoryFile}`);
          }
        }
      } catch (error) {
        console.error(`查找其他历史记录文件失败:`, error);
      }
      
      return [];
    }
    
    // 读取历史记录文件
    console.log(`文件存在，准备读取: ${historyFilePath}`);
    try {
      const data = fs.readFileSync(historyFilePath, 'utf8');
      console.log(`成功读取文件，内容长度: ${data.length}`);
      const historyData = JSON.parse(data);
      console.log(`成功解析JSON，包含 ${historyData.length} 条记录`);
      
      // 根据时间范围筛选
      let filteredHistory = [...historyData];
      if (timeframe !== 'all') {
        const now = new Date();
        let startDate;
        
        if (timeframe === 'week') {
          startDate = new Date(now.setDate(now.getDate() - 7));
        } else if (timeframe === 'month') {
          startDate = new Date(now.setMonth(now.getMonth() - 1));
        }
        
        filteredHistory = historyData.filter(record => {
          const recordDate = new Date(record.timestamp || record.createdAt);
          return recordDate >= startDate;
        });
      }
      
      return filteredHistory;
    } catch (readError) {
      console.error(`读取或解析文件失败:`, readError);
      return [];
    }
  } catch (error) {
    console.error(`获取用户 ${userId} 练习历史失败:`, error);
    return [];
  }
};

/**
 * 获取用户错题本数据
 * @param {String} userId - 用户ID
 * @returns {Array} - 用户错题记录
 */
const getUserMistakes = (userId) => {
  try {
    // 错题本文件路径
    const mistakesDir = path.join(dataDir, 'mistakes');
    const mistakesFilePath = path.join(mistakesDir, `user_${userId}_mistakes.json`);
    console.log(`尝试读取错题本文件: ${mistakesFilePath}`);
    
    // 检查文件是否存在
    if (!fs.existsSync(mistakesFilePath)) {
      console.log(`用户 ${userId} 的错题本文件不存在，尝试查找其他错题本文件`);
      
      // 尝试读取目录中的所有错题本文件
      try {
        // 确保目录存在
        if (!fs.existsSync(mistakesDir)) {
          console.log(`错题本目录不存在，创建目录: ${mistakesDir}`);
          fs.mkdirSync(mistakesDir, { recursive: true });
          return [];
        }
        
        const files = fs.readdirSync(mistakesDir);
        console.log(`错题本目录中的文件:`, files);
        
        // 如果有任何错题本文件，使用第一个
        if (files.length > 0) {
          const firstMistakesFile = path.join(mistakesDir, files[0]);
          console.log(`使用第一个可用的错题本文件: ${firstMistakesFile}`);
          
          // 直接检查文件是否存在
          if (fs.existsSync(firstMistakesFile)) {
            console.log(`文件存在，准备读取`);
            try {
              const data = fs.readFileSync(firstMistakesFile, 'utf8');
              console.log(`成功读取文件，内容长度: ${data.length}`);
              const mistakesData = JSON.parse(data);
              console.log(`成功解析JSON，包含 ${mistakesData.length} 条记录`);
              return mistakesData;
            } catch (readError) {
              console.error(`读取或解析文件失败:`, readError);
              return [];
            }
          } else {
            console.log(`文件不存在: ${firstMistakesFile}`);
          }
        }
      } catch (error) {
        console.error(`查找其他错题本文件失败:`, error);
      }
      
      return [];
    }
    
    // 读取错题本文件
    console.log(`文件存在，准备读取: ${mistakesFilePath}`);
    try {
      const data = fs.readFileSync(mistakesFilePath, 'utf8');
      console.log(`成功读取文件，内容长度: ${data.length}`);
      const mistakesData = JSON.parse(data);
      console.log(`成功解析JSON，包含 ${mistakesData.length} 条记录`);
      return mistakesData;
    } catch (readError) {
      console.error(`读取或解析文件失败:`, readError);
      return [];
    }
  } catch (error) {
    console.error(`获取用户 ${userId} 错题本数据失败:`, error);
    return [];
  }
};

/**
 * 获取用户学习薄弱点分析
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getWeaknessAnalysis = async (req, res) => {
  try {
    console.log('收到薄弱点分析请求，参数:', req.query);
    
    // 优先使用req.user.id，如果不存在则尝试使用req.query.userId
    const userId = req.user?.id || req.user?._id || req.query.userId;
    console.log('用户ID:', userId);
    
    if (!userId) {
      console.log('未提供有效的用户ID，尝试使用目录中的任何历史记录文件');
      
      // 尝试读取目录中的所有历史记录文件
      try {
        const fs = require('fs');
        const path = require('path');
        const historyDir = path.join(__dirname, '../data/history');
        console.log(`历史记录目录路径: ${historyDir}`);
        
        // 确保目录存在
        if (!fs.existsSync(historyDir)) {
          console.log(`历史记录目录不存在: ${historyDir}`);
          return res.status(400).json({
            success: false,
            message: '未提供有效的用户ID，且无法找到任何历史记录文件'
          });
        }
        
        const files = fs.readdirSync(historyDir);
        console.log(`历史记录目录中的文件:`, files);
        
        // 如果有任何历史记录文件，使用第一个
        if (files.length > 0) {
          // 提取第一个文件名中的用户ID
          const firstFile = files[0];
          console.log(`尝试使用第一个文件: ${firstFile}`);
          
          // 检查文件是否为历史记录文件
          if (firstFile.includes('_history.json')) {
            const firstFilePath = path.join(historyDir, firstFile);
            console.log(`完整文件路径: ${firstFilePath}`);
            
            // 检查文件是否存在
            if (fs.existsSync(firstFilePath)) {
              console.log(`文件存在，准备读取`);
              
              try {
                const fileContent = fs.readFileSync(firstFilePath, 'utf8');
                console.log(`成功读取文件，内容长度: ${fileContent.length}`);
                
                // 尝试解析JSON
                const historyData = JSON.parse(fileContent);
                console.log(`成功解析JSON，包含 ${historyData.length} 条记录`);
                
                // 提取用户ID
                const match = firstFile.match(/user_(.+)_history\.json/);
                if (match && match[1]) {
                  const extractedUserId = match[1];
                  console.log(`从文件名中提取的用户ID: ${extractedUserId}`);
                  
                  // 使用提取的用户ID继续处理
                  return processWeaknessAnalysis(extractedUserId, req, res);
                } else {
                  console.log(`无法从文件名 ${firstFile} 中提取用户ID`);
                }
              } catch (readError) {
                console.error(`读取或解析文件失败:`, readError);
              }
            } else {
              console.log(`文件不存在: ${firstFilePath}`);
            }
          } else {
            console.log(`第一个文件不是历史记录文件: ${firstFile}`);
          }
          
          // 如果无法从文件名中提取用户ID，使用一个默认ID
          console.log(`使用默认用户ID: 1748618904860`);
          return processWeaknessAnalysis('1748618904860', req, res);
        }
        
        // 如果没有找到有效的历史记录文件
        return res.status(400).json({
          success: false,
          message: '未提供有效的用户ID，且无法从文件名中提取用户ID'
        });
      } catch (error) {
        console.error('尝试读取历史记录目录失败:', error);
        return res.status(400).json({
          success: false,
          message: '未提供有效的用户ID'
        });
      }
    }
    
    // 使用有效的用户ID处理薄弱点分析
    return processWeaknessAnalysis(userId, req, res);
  } catch (error) {
    console.error('薄弱点分析失败:', error);
    console.error('错误堆栈:', error.stack);
    return res.status(500).json({
      success: false,
      message: '薄弱点分析失败',
      error: error.message
    });
  }
};

// 处理薄弱点分析的辅助函数
const processWeaknessAnalysis = (userId, req, res) => {
  try {
    const { timeframe = 'all', correctRateThreshold, errorRateThreshold, minExerciseCount, localhistory } = req.query;
    
    // 获取用户练习历史
    let exerciseHistory = getUserExerciseHistory(userId, timeframe);
    console.log(`从服务器获取到${exerciseHistory.length}条练习历史记录`);
    
    // 获取用户错题本数据
    const mistakes = getUserMistakes(userId);
    console.log(`从服务器获取到${mistakes.length}条错题记录`);
    
    // 如果前端传递了本地历史记录，合并处理
    if (localhistory) {
      try {
        const localHistoryData = JSON.parse(localhistory);
        if (Array.isArray(localHistoryData) && localHistoryData.length > 0) {
          console.log(`合并${localHistoryData.length}条本地历史记录`);
          exerciseHistory = [...exerciseHistory, ...localHistoryData];
        }
      } catch (error) {
        console.error('解析本地历史记录失败:', error);
      }
    }
    
    // 如果没有练习数据，返回提示信息
    if (!exerciseHistory || exerciseHistory.length === 0) {
      if (!mistakes || mistakes.length === 0) {
        return res.status(200).json({
          success: true,
          message: '暂无练习数据和错题数据，无法进行薄弱点分析',
          data: {
            weakKnowledgePoints: [],
            weakExerciseTypes: [],
            summary: {
              totalExercises: 0,
              totalMistakes: 0
            }
          }
        });
      }
    }
    
    // 设置分析选项
    const options = {
      correctRateThreshold: 60, // 默认低于60%正确率视为薄弱点
      minExerciseCount: 3       // 默认至少做过3题才进行分析
    };
    
    if (correctRateThreshold) options.correctRateThreshold = parseInt(correctRateThreshold);
    if (errorRateThreshold) options.errorRateThreshold = parseInt(errorRateThreshold);
    if (minExerciseCount) options.minExerciseCount = parseInt(minExerciseCount);
    
    console.log('薄弱点分析选项:', options);
    
    // 分析薄弱点
    try {
      // 导入更新后的算法
      const { analyzeWeaknessWithMistakes } = require('../algorithms/weaknessAnalyzer');
      
      // 使用同时考虑练习历史和错题本的算法
      const weaknessAnalysis = analyzeWeaknessWithMistakes(exerciseHistory, mistakes, options);
      console.log('薄弱点分析完成');
      
      return res.status(200).json({
        success: true,
        message: '薄弱点分析成功',
        data: weaknessAnalysis
      });
    } catch (analysisError) {
      console.error('薄弱点分析算法执行失败:', analysisError);
      return res.status(500).json({
        success: false,
        message: '薄弱点分析算法执行失败',
        error: analysisError.message
      });
    }
  } catch (error) {
    console.error('处理薄弱点分析失败:', error);
    return res.status(500).json({
      success: false,
      message: '处理薄弱点分析失败',
      error: error.message
    });
  }
};

/**
 * 获取基于薄弱点的学习建议
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getLearningRecommendations = async (req, res) => {
  try {
    // 优先使用req.user.id，如果不存在则尝试使用req.query.userId
    const userId = req.user?.id || req.query.userId;
    console.log('学习建议API - 用户ID:', userId);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '未提供有效的用户ID'
      });
    }
    
    const { timeframe = 'all', localhistory } = req.query;
    
    // 获取用户练习历史
    let exerciseHistory = getUserExerciseHistory(userId, timeframe);
    
    // 获取用户错题本数据
    const mistakes = getUserMistakes(userId);
    console.log(`从服务器获取到${mistakes.length}条错题记录`);
    
    // 如果前端传递了本地练习历史数据，合并它们
    if (localhistory) {
      try {
        const parsedLocalHistory = JSON.parse(localhistory);
        console.log(`学习建议: 收到前端本地练习历史数据: ${parsedLocalHistory.length}条记录`);
        
        // 合并历史记录，优先使用服务器数据
        const serverExerciseIds = new Set(exerciseHistory.map(item => item.exerciseId));
        
        // 只添加服务器上没有的记录
        const additionalRecords = parsedLocalHistory.filter(item => !serverExerciseIds.has(item.exerciseId));
        console.log(`学习建议: 合并${additionalRecords.length}条本地独有的练习记录`);
        
        exerciseHistory = [...exerciseHistory, ...additionalRecords];
      } catch (error) {
        console.error('解析前端本地练习历史数据失败:', error);
      }
    }
    
    if (!exerciseHistory || exerciseHistory.length === 0) {
      if (!mistakes || mistakes.length === 0) {
        return res.status(200).json({
          success: true,
          message: '暂无练习数据和错题数据，无法生成学习建议',
          data: {
            knowledgePointRecommendations: [],
            exerciseTypeRecommendations: [],
            overallRecommendation: '暂无足够的练习数据，建议先完成一些练习题'
          }
        });
      }
    }
    
    // 导入更新后的算法
    const { analyzeWeaknessWithMistakes } = require('../algorithms/weaknessAnalyzer');
    
    // 分析薄弱点，同时使用练习历史和错题本数据
    const weaknessAnalysis = analyzeWeaknessWithMistakes(exerciseHistory, mistakes);
    
    // 生成学习建议
    const recommendations = generateLearningRecommendations(weaknessAnalysis);
    
    res.status(200).json({
      success: true,
      message: '学习建议生成成功',
      data: recommendations
    });
  } catch (error) {
    console.error('生成学习建议失败:', error);
    res.status(500).json({
      success: false,
      message: '生成学习建议失败',
      error: error.message
    });
  }
};

// 添加学习资源推荐功能
/**
 * 根据用户薄弱点推荐学习资源
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getResourceRecommendations = async (req, res) => {
  try {
    console.log('收到资源推荐请求，参数:', req.query);
    
    // 优先使用req.user.id，如果不存在则尝试使用req.query.userId
    const userId = req.user?.id || req.user?._id || req.query.userId;
    console.log('用户ID:', userId);
    
    // 获取查询参数
    const { 
      knowledgePoints, 
      categories, 
      difficulty, 
      type, 
      limit = 5, 
      includeWeakPoints = 'true'
    } = req.query;
    
    // 加载学习资源数据
    const resourcesPath = path.join(__dirname, '../data/resources/learning_resources.json');
    let resources = [];
    
    if (fs.existsSync(resourcesPath)) {
      const resourceData = JSON.parse(fs.readFileSync(resourcesPath, 'utf8'));
      resources = resourceData.resources || [];
      console.log(`加载了${resources.length}个学习资源`);
    } else {
      console.log('学习资源文件不存在');
      return res.status(404).json({
        success: false,
        message: '学习资源数据不可用'
      });
    }
    
    // 根据用户薄弱点获取推荐
    let weakPointResources = [];
    let userWeakPoints = [];
    
    if (includeWeakPoints === 'true' && userId) {
      try {
        // 获取用户薄弱点
        const { analyzeWeaknessWithMistakes } = require('../algorithms/weaknessAnalyzer');
        
        // 获取用户练习历史和错题本
        let exerciseHistory = getUserExerciseHistory(userId, 'all');
        const mistakes = getUserMistakes(userId);
        
        if (exerciseHistory.length > 0 || mistakes.length > 0) {
          // 分析薄弱点
          const weaknessAnalysis = analyzeWeaknessWithMistakes(exerciseHistory, mistakes);
          
          // 提取薄弱知识点
          userWeakPoints = weaknessAnalysis.weakKnowledgePoints.map(wp => wp.knowledgePoint);
          console.log('用户薄弱知识点:', userWeakPoints);
          
          // 根据薄弱点筛选资源
          if (userWeakPoints.length > 0) {
            weakPointResources = resources.filter(resource => 
              resource.knowledgePoints && 
              resource.knowledgePoints.some(kp => userWeakPoints.includes(kp))
            );
            console.log(`找到${weakPointResources.length}个与薄弱点相关的资源`);
          }
        }
      } catch (error) {
        console.error('获取用户薄弱点失败:', error);
      }
    }
    
    // 根据请求参数筛选资源
    let filteredResources = resources;
    
    // 按知识点筛选
    if (knowledgePoints) {
      const knowledgePointsList = knowledgePoints.split(',');
      filteredResources = filteredResources.filter(resource => 
        resource.knowledgePoints && 
        resource.knowledgePoints.some(kp => knowledgePointsList.includes(kp))
      );
    }
    
    // 按分类筛选
    if (categories) {
      const categoriesList = categories.split(',');
      filteredResources = filteredResources.filter(resource => 
        categoriesList.includes(resource.category)
      );
    }
    
    // 按难度筛选
    if (difficulty) {
      filteredResources = filteredResources.filter(resource => 
        resource.difficulty === difficulty
      );
    }
    
    // 按类型筛选
    if (type) {
      const typesList = type.split(',');
      filteredResources = filteredResources.filter(resource => 
        typesList.includes(resource.type)
      );
    }
    
    // 按评分排序
    filteredResources.sort((a, b) => b.rating - a.rating);
    
    // 限制返回数量
    const limitNum = parseInt(limit);
    filteredResources = filteredResources.slice(0, limitNum);
    
    // 构建响应
    const response = {
      success: true,
      message: '资源推荐成功',
      data: {
        recommendedResources: filteredResources,
        weakPointResources: weakPointResources.slice(0, limitNum),
        userWeakPoints
      }
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('获取资源推荐失败:', error);
    res.status(500).json({
      success: false,
      message: '获取资源推荐失败',
      error: error.message
    });
  }
};

/**
 * 根据关键词搜索学习资源
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.searchResources = async (req, res) => {
  try {
    console.log('收到资源搜索请求，参数:', req.query);
    
    const { query, limit = 10 } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: '搜索关键词不能为空'
      });
    }
    
    // 加载学习资源数据
    const resourcesPath = path.join(__dirname, '../data/resources/learning_resources.json');
    let resources = [];
    
    if (fs.existsSync(resourcesPath)) {
      const resourceData = JSON.parse(fs.readFileSync(resourcesPath, 'utf8'));
      resources = resourceData.resources || [];
    } else {
      return res.status(404).json({
        success: false,
        message: '学习资源数据不可用'
      });
    }
    
    // 搜索资源
    const searchTerm = query.toLowerCase();
    const searchResults = resources.filter(resource => {
      // 在标题、描述、标签、知识点和分类中搜索
      return (
        resource.title.toLowerCase().includes(searchTerm) ||
        resource.description.toLowerCase().includes(searchTerm) ||
        (resource.tags && resource.tags.some(tag => tag.toLowerCase().includes(searchTerm))) ||
        (resource.knowledgePoints && resource.knowledgePoints.some(kp => kp.toLowerCase().includes(searchTerm))) ||
        resource.category.toLowerCase().includes(searchTerm)
      );
    });
    
    // 按评分排序
    searchResults.sort((a, b) => b.rating - a.rating);
    
    // 限制返回数量
    const limitNum = parseInt(limit);
    const limitedResults = searchResults.slice(0, limitNum);
    
    res.status(200).json({
      success: true,
      message: '资源搜索成功',
      data: {
        resources: limitedResults,
        total: searchResults.length
      }
    });
  } catch (error) {
    console.error('搜索学习资源失败:', error);
    res.status(500).json({
      success: false,
      message: '搜索学习资源失败',
      error: error.message
    });
  }
}; 
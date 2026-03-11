const fs = require('fs');
const path = require('path');
const { getExercisesData } = require('./exerciseController');

// 数据文件目录
const dataDir = path.join(__dirname, '../data');
const historyDir = path.join(dataDir, 'history');
const mistakesDir = path.join(dataDir, 'mistakes');

// 获取用户练习历史
const getUserExerciseHistory = (userId, timeFrame = 'all') => {
  try {
    // 检查userId是否有效
    if (!userId || userId === 'undefined') {
      console.log('获取练习历史: 无效的用户ID，返回空数组');
      return [];
    }
    
    // 历史记录文件路径 - 统一格式为 user_[userId]_history.json
    const historyFilePath = path.join(historyDir, `user_${userId}_history.json`);
    console.log(`尝试读取历史记录文件: ${historyFilePath}`);
    
    // 检查目录是否存在，不存在则创建
    if (!fs.existsSync(historyDir)) {
      console.log(`创建历史记录目录: ${historyDir}`);
      fs.mkdirSync(historyDir, { recursive: true });
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(historyFilePath)) {
      console.log(`用户 ${userId} 的历史记录文件不存在，尝试查找其他历史记录文件`);
      
      // 尝试读取目录中的所有历史记录文件
      try {
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
              if (timeFrame !== 'all') {
                const now = new Date();
                let startDate;
                
                if (timeFrame === 'week') {
                  startDate = new Date(now.setDate(now.getDate() - 7));
                } else if (timeFrame === 'month') {
                  startDate = new Date(now.setMonth(now.getMonth() - 1));
                } else if (timeFrame === 'quarter') {
                  startDate = new Date(now.setMonth(now.getMonth() - 3));
                }
                
                filteredHistory = historyData.filter(record => {
                  const recordDate = new Date(record.timestamp || record.createdAt);
                  return recordDate >= startDate;
                });
              }
              
              return filteredHistory;
            } catch (readError) {
              console.error(`读取或解析文件失败:`, readError);
            }
          } else {
            console.log(`文件不存在: ${firstHistoryFile}`);
          }
        }
      } catch (error) {
        console.error(`查找其他历史记录文件失败:`, error);
      }
      
      // 如果没有找到任何历史记录文件，创建空文件
      console.log(`没有找到任何历史记录文件，创建空文件: ${historyFilePath}`);
      fs.writeFileSync(historyFilePath, JSON.stringify([]), 'utf8');
      return [];
    }
    
    // 读取历史记录文件
    console.log(`文件存在，准备读取: ${historyFilePath}`);
    try {
      const historyData = JSON.parse(fs.readFileSync(historyFilePath, 'utf8'));
      console.log(`成功读取用户 ${userId} 的历史记录，共 ${historyData.length} 条记录`);
      
      // 根据时间范围筛选
      let filteredHistory = [...historyData];
      if (timeFrame !== 'all') {
        const now = new Date();
        let startDate;
        
        if (timeFrame === 'week') {
          startDate = new Date(now.setDate(now.getDate() - 7));
        } else if (timeFrame === 'month') {
          startDate = new Date(now.setMonth(now.getMonth() - 1));
        } else if (timeFrame === 'quarter') {
          startDate = new Date(now.setMonth(now.getMonth() - 3));
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

// 获取用户错题记录
const getUserMistakes = (userId) => {
  try {
    // 检查userId是否有效
    if (!userId || userId === 'undefined') {
      console.log('获取错题记录: 无效的用户ID，返回空数组');
      return [];
    }
    
    // 错题本文件路径 - 统一格式为 user_[userId]_mistakes.json
    const mistakesFilePath = path.join(mistakesDir, `user_${userId}_mistakes.json`);
    console.log(`尝试读取错题本文件: ${mistakesFilePath}`);
    
    // 检查目录是否存在，不存在则创建
    if (!fs.existsSync(mistakesDir)) {
      console.log(`创建错题本目录: ${mistakesDir}`);
      fs.mkdirSync(mistakesDir, { recursive: true });
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(mistakesFilePath)) {
      console.log(`用户 ${userId} 的错题本文件不存在，尝试查找其他错题本文件`);
      
      // 尝试读取目录中的所有错题本文件
      try {
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
            }
          } else {
            console.log(`文件不存在: ${firstMistakesFile}`);
          }
        }
      } catch (error) {
        console.error(`查找其他错题本文件失败:`, error);
      }
      
      // 如果没有找到任何错题本文件，创建空文件
      console.log(`没有找到任何错题本文件，创建空文件: ${mistakesFilePath}`);
      fs.writeFileSync(mistakesFilePath, JSON.stringify([]), 'utf8');
      return [];
    }
    
    // 读取错题本文件
    console.log(`文件存在，准备读取: ${mistakesFilePath}`);
    try {
      const mistakesData = JSON.parse(fs.readFileSync(mistakesFilePath, 'utf8'));
      console.log(`成功读取用户 ${userId} 的错题记录，共 ${mistakesData.length} 条记录`);
      return mistakesData;
    } catch (readError) {
      console.error(`读取或解析文件失败:`, readError);
      return [];
    }
  } catch (error) {
    console.error(`获取用户 ${userId} 错题记录失败:`, error);
    return [];
  }
};

// 工具函数：从标题中提取知识点
function extractKnowledgePointFromTitle(title) {
  if (!title) return 'unknown';
  
  // 简单规则：查找方括号中的内容作为知识点
  const match = title.match(/\[(.*?)\]/);
  if (match && match[1]) {
    return match[1].trim();
  }
  
  return 'unknown';
}

// 分析薄弱知识点
exports.analyzeWeakPoints = async (req, res) => {
  try {
    // 从req.user中获取用户ID，如果不存在则使用默认ID
    let userId = req.user?.id || req.user?._id;
    
    if (!userId) {
      // 尝试从请求体或查询参数获取用户ID
      userId = req.body.userId || req.query.userId;
      
      // 如果仍然没有用户ID，使用默认ID
      if (!userId) {
        userId = '1748618904860'; // 默认用户ID
        console.log(`未找到用户ID，使用默认ID: ${userId}`);
      }
    }
    
    console.log('分析薄弱知识点 - 用户ID:', userId);
    
    const { timeFrame = 'all', includeMistakes = true } = req.query;
    
    // 获取练习历史和错题记录
    const exerciseHistory = getUserExerciseHistory(userId, timeFrame);
    const mistakes = includeMistakes === 'true' || includeMistakes === true ? getUserMistakes(userId) : [];
    
    console.log(`获取到用户 ${userId} 的练习历史记录:`, exerciseHistory.length, '条');
    console.log(`获取到用户 ${userId} 的错题记录:`, mistakes.length, '条');
    
    // 计算总体正确率
    const totalExercises = exerciseHistory.length;
    const totalCorrect = exerciseHistory.filter(record => record.isCorrect).length;
    const overallCorrectRate = totalExercises > 0 ? Math.round((totalCorrect / totalExercises) * 100) : 0;
    
    console.log(`总体正确率: ${overallCorrectRate}%`);
    
    // 如果没有练习数据，返回空结果
    if (totalExercises === 0) {
      return res.status(200).json({
        success: true,
        message: '练习数据不足，无法进行薄弱点分析',
        data: {
          weakKnowledgePoints: [],
          weakExerciseTypes: [],
          summary: {
            totalExercises: 0,
            totalMistakes: 0,
            overallCorrectRate: 0
          }
        }
      });
    }
    
    // 按知识点分组
    const knowledgePointStats = {};
    const exerciseTypeStats = {};
    
    // 处理练习历史数据
    exerciseHistory.forEach(record => {
      const knowledgePoint = record.exercise?.knowledgePoint || 
                            record.knowledgePoint || 
                            (record.exercise?.title ? extractKnowledgePointFromTitle(record.exercise.title) : '未分类');
      const exerciseType = record.exerciseType || record.exercise?.type || record.type || '未知类型';
      
      // 统计知识点
      if (!knowledgePointStats[knowledgePoint]) {
        knowledgePointStats[knowledgePoint] = {
          total: 0,
          correct: 0
        };
      }
      
      knowledgePointStats[knowledgePoint].total++;
      if (record.isCorrect) {
        knowledgePointStats[knowledgePoint].correct++;
      }
      
      // 统计题型
      if (!exerciseTypeStats[exerciseType]) {
        exerciseTypeStats[exerciseType] = {
          total: 0,
          correct: 0
        };
      }
      
      exerciseTypeStats[exerciseType].total++;
      if (record.isCorrect) {
        exerciseTypeStats[exerciseType].correct++;
      }
    });
    
    // 如果总体正确率为0%，则所有知识点和题型都是薄弱点
    if (overallCorrectRate === 0) {
      console.log('总体正确率为0%，所有知识点和题型都是薄弱点');
      
      const weakKnowledgePoints = Object.entries(knowledgePointStats)
        .map(([knowledgePoint, stats]) => ({
          knowledgePoint,
          total: stats.total,
          correct: 0,
          correctRate: 0,
          recommendedPractices: 10 // 最高推荐练习次数
        }))
        .sort((a, b) => b.total - a.total); // 按题目数量降序排序
      
      const weakExerciseTypes = Object.entries(exerciseTypeStats)
        .map(([exerciseType, stats]) => ({
          exerciseType,
          total: stats.total,
          correct: 0,
          correctRate: 0,
          recommendedPractices: 10 // 最高推荐练习次数
        }))
        .sort((a, b) => b.total - a.total); // 按题目数量降序排序
      
      return res.status(200).json({
        success: true,
        message: '薄弱点分析成功 - 全部错误',
        data: {
          weakKnowledgePoints,
          weakExerciseTypes,
          summary: {
            totalExercises,
            totalMistakes: mistakes.length,
            overallCorrectRate
          }
        }
      });
    }
    
    // 正常情况下计算正确率并找出薄弱点
    const weakKnowledgePoints = Object.entries(knowledgePointStats)
      .map(([knowledgePoint, stats]) => ({
        knowledgePoint,
        total: stats.total,
        correct: stats.correct,
        correctRate: Math.round((stats.correct / stats.total) * 100),
        recommendedPractices: Math.ceil((100 - (stats.correct / stats.total) * 100) / 10)
      }))
      .filter(item => item.correctRate < 70 || item.total >= 3) // 正确率低于70%或至少做过3题
      .sort((a, b) => a.correctRate - b.correctRate); // 按正确率升序排序
    
    const weakExerciseTypes = Object.entries(exerciseTypeStats)
      .map(([exerciseType, stats]) => ({
        exerciseType,
        total: stats.total,
        correct: stats.correct,
        correctRate: Math.round((stats.correct / stats.total) * 100),
        recommendedPractices: Math.ceil((100 - (stats.correct / stats.total) * 100) / 10)
      }))
      .filter(item => item.correctRate < 70 || item.total >= 3) // 正确率低于70%或至少做过3题
      .sort((a, b) => a.correctRate - b.correctRate); // 按正确率升序排序
    
    console.log('薄弱知识点分析结果:', {
      weakKnowledgePointsCount: weakKnowledgePoints.length,
      weakExerciseTypesCount: weakExerciseTypes.length
    });
    
    res.status(200).json({
      success: true,
      message: '薄弱点分析成功',
      data: {
        weakKnowledgePoints,
        weakExerciseTypes,
        summary: {
          totalExercises,
          totalMistakes: mistakes.length,
          overallCorrectRate
        }
      }
    });
  } catch (error) {
    console.error('分析薄弱知识点失败:', error);
    res.status(500).json({
      success: false,
      message: '分析薄弱知识点失败',
      error: error.message
    });
  }
}; 
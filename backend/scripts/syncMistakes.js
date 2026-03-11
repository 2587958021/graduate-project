/**
 * 从历史记录中同步错题到错题本的脚本
 */

const fs = require('fs');
const path = require('path');

// 数据目录
const dataDir = path.join(__dirname, '../data');
const historyDir = path.join(dataDir, 'history');
const mistakesDir = path.join(dataDir, 'mistakes');

// 确保目录存在
if (!fs.existsSync(mistakesDir)) {
  fs.mkdirSync(mistakesDir, { recursive: true });
}

// 获取所有历史记录文件
const historyFiles = fs.readdirSync(historyDir).filter(file => file.endsWith('_history.json'));

console.log(`找到 ${historyFiles.length} 个历史记录文件`);

// 处理每个历史记录文件
historyFiles.forEach(historyFile => {
  try {
    // 提取用户ID
    const userId = historyFile.replace('user_', '').replace('_history.json', '');
    console.log(`处理用户 ${userId} 的历史记录...`);
    
    // 读取历史记录
    const historyFilePath = path.join(historyDir, historyFile);
    const historyData = JSON.parse(fs.readFileSync(historyFilePath, 'utf8'));
    
    console.log(`用户 ${userId} 有 ${historyData.length} 条历史记录`);
    
    // 筛选出错误的题目
    const wrongExercises = historyData.filter(item => item.isCorrect === false);
    
    console.log(`用户 ${userId} 有 ${wrongExercises.length} 道错题`);
    
    if (wrongExercises.length > 0) {
      // 错题本文件路径
      const mistakesFilePath = path.join(mistakesDir, `user_${userId}_mistakes.json`);
      
      // 读取现有错题本或创建新的
      let mistakesData = [];
      if (fs.existsSync(mistakesFilePath)) {
        try {
          const data = fs.readFileSync(mistakesFilePath, 'utf8');
          mistakesData = JSON.parse(data);
        } catch (err) {
          console.error(`读取错题本文件失败，创建新文件: ${err.message}`);
          mistakesData = [];
        }
      }
      
      // 记录已存在的错题ID，避免重复添加
      const existingMistakeIds = new Set(mistakesData.map(m => m.exerciseId));
      
      // 转换错题格式并添加到错题本
      let newMistakesCount = 0;
      
      wrongExercises.forEach(exercise => {
        // 如果错题已存在，跳过
        if (existingMistakeIds.has(exercise.exercise._id)) {
          return;
        }
        
        // 创建错题记录
        const mistakeRecord = {
          _id: `mistake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          exerciseId: exercise.exercise._id,
          userAnswer: exercise.userAnswer,
          correctAnswer: exercise.exercise.answer,
          exerciseType: exercise.exerciseType || exercise.exercise.type,
          knowledgePoint: exercise.exercise.knowledgePoint || 'unknown',
          title: exercise.exercise.title || `练习题 ${exercise.exercise._id}`,
          content: exercise.exercise.content || '',
          options: exercise.exercise.options || [],
          note: "从历史记录同步的错题",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          count: 1
        };
        
        // 添加新错题
        mistakesData.push(mistakeRecord);
        existingMistakeIds.add(exercise.exercise._id);
        newMistakesCount++;
      });
      
      // 保存错题本
      fs.writeFileSync(mistakesFilePath, JSON.stringify(mistakesData, null, 2), 'utf8');
      console.log(`为用户 ${userId} 添加了 ${newMistakesCount} 道新错题，错题本现有 ${mistakesData.length} 道题`);
    }
  } catch (error) {
    console.error(`处理历史记录文件 ${historyFile} 时出错:`, error);
  }
});

console.log('同步完成！'); 
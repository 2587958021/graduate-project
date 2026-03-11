const fs = require('fs');
const path = require('path');

// 确保数据目录存在
const dataDir = path.join(__dirname, 'data');
const historyDir = path.join(dataDir, 'history');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(historyDir)) {
  fs.mkdirSync(historyDir, { recursive: true });
}

// 用户ID - 这里可以替换为实际的用户ID
const userId = 'user123';

// 练习题数据 - 包含明确的知识点标签
const exercises = [
  {
    _id: 'ex001',
    title: 'HTML基础标签使用',
    type: 'single-choice',
    knowledgePoint: 'HTML基础',
    difficulty: 'easy'
  },
  {
    _id: 'ex002',
    title: 'CSS选择器优先级',
    type: 'multiple-choice',
    knowledgePoint: 'CSS选择器',
    difficulty: 'medium'
  },
  {
    _id: 'ex003',
    title: 'JavaScript变量声明',
    type: 'true-false',
    knowledgePoint: 'JavaScript基础',
    difficulty: 'easy'
  },
  {
    _id: 'ex004',
    title: 'React组件生命周期',
    type: 'single-choice',
    knowledgePoint: 'React框架',
    difficulty: 'hard'
  },
  {
    _id: 'ex005',
    title: 'Vue组件通信方式',
    type: 'multiple-choice',
    knowledgePoint: 'Vue框架',
    difficulty: 'medium'
  },
  {
    _id: 'ex006',
    title: '前端工程化工具比较',
    type: 'multiple-choice',
    knowledgePoint: '前端工程化',
    difficulty: 'hard'
  },
  {
    _id: 'ex007',
    title: 'HTTP请求方法',
    type: 'true-false',
    knowledgePoint: '网络请求',
    difficulty: 'medium'
  },
  {
    _id: 'ex008',
    title: 'JavaScript闭包概念',
    type: 'single-choice',
    knowledgePoint: 'JavaScript闭包',
    difficulty: 'hard'
  },
  {
    _id: 'ex009',
    title: 'CSS盒模型解析',
    type: 'true-false',
    knowledgePoint: 'CSS盒模型',
    difficulty: 'medium'
  },
  {
    _id: 'ex010',
    title: 'JavaScript数组方法',
    type: 'multiple-choice',
    knowledgePoint: 'JavaScript数组',
    difficulty: 'medium'
  },
  {
    _id: 'ex011',
    title: 'DOM事件冒泡与捕获',
    type: 'single-choice',
    knowledgePoint: 'DOM操作',
    difficulty: 'medium'
  },
  {
    _id: 'ex012',
    title: 'JavaScript Promise使用',
    type: 'true-false',
    knowledgePoint: 'JavaScript异步编程',
    difficulty: 'hard'
  },
  {
    _id: 'ex013',
    title: 'CSS Flex布局',
    type: 'multiple-choice',
    knowledgePoint: 'CSS弹性布局',
    difficulty: 'medium'
  },
  {
    _id: 'ex014',
    title: 'JavaScript原型链',
    type: 'single-choice',
    knowledgePoint: 'JavaScript原型链',
    difficulty: 'hard'
  },
  {
    _id: 'ex015',
    title: 'TypeScript类型系统',
    type: 'multiple-choice',
    knowledgePoint: 'TypeScript基础',
    difficulty: 'hard'
  },
  {
    _id: 'ex016',
    title: '浏览器存储方式比较',
    type: 'true-false',
    knowledgePoint: '浏览器存储',
    difficulty: 'medium'
  },
  {
    _id: 'ex017',
    title: 'React Hooks使用',
    type: 'single-choice',
    knowledgePoint: 'React框架',
    difficulty: 'hard'
  },
  {
    _id: 'ex018',
    title: '数据结构：链表实现',
    type: 'code-completion',
    knowledgePoint: '数据结构',
    difficulty: 'hard'
  }
];

// 生成练习历史记录
const generateHistory = () => {
  // 从当前时间开始，向前推几天
  const now = new Date();
  const history = [];
  
  // 为每道题生成练习记录
  exercises.forEach((exercise, index) => {
    // 根据知识点设置不同的正确率模式
    let isCorrect = false;
    
    // 为不同知识点设置不同的正确率
    switch (exercise.knowledgePoint) {
      case 'HTML基础':
      case 'CSS基础':
      case 'JavaScript基础':
      case 'CSS选择器':
      case 'DOM操作':
        // 这些基础知识点正确率较高 (70-80%)
        isCorrect = Math.random() < 0.75;
        break;
      case 'Vue框架':
      case 'React框架':
      case 'JavaScript闭包':
      case 'JavaScript异步编程':
        // 这些中级知识点正确率中等 (50-60%)
        isCorrect = Math.random() < 0.55;
        break;
      case '数据结构':
      case '前端工程化':
      case 'JavaScript原型链':
      case 'TypeScript基础':
        // 这些高级知识点正确率较低 (30-40%)
        isCorrect = Math.random() < 0.35;
        break;
      default:
        // 其他知识点正确率适中 (60%)
        isCorrect = Math.random() < 0.6;
    }
    
    // 创建练习记录
    const timestamp = new Date(now);
    timestamp.setHours(now.getHours() - index * 2); // 每道题间隔2小时
    
    history.push({
      exerciseId: exercise._id,
      title: exercise.title,
      type: exercise.type,
      knowledgePoint: exercise.knowledgePoint,
      difficulty: exercise.difficulty,
      isCorrect: isCorrect,
      timestamp: timestamp.toISOString(),
      duration: Math.floor(Math.random() * 120) + 30, // 30-150秒
      exercise: {
        _id: exercise._id,
        title: exercise.title,
        type: exercise.type,
        knowledgePoint: exercise.knowledgePoint,
        difficulty: exercise.difficulty
      }
    });
  });
  
  return history;
};

// 生成历史记录
const history = generateHistory();

// 写入文件
const historyFilePath = path.join(historyDir, `${userId}_history.json`);
fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2));

console.log(`已生成${history.length}条练习历史记录，保存至 ${historyFilePath}`);

// 显示知识点统计
const knowledgePointStats = {};
history.forEach(record => {
  const kp = record.knowledgePoint;
  if (!knowledgePointStats[kp]) {
    knowledgePointStats[kp] = { total: 0, correct: 0 };
  }
  knowledgePointStats[kp].total++;
  if (record.isCorrect) {
    knowledgePointStats[kp].correct++;
  }
});

console.log('\n知识点统计:');
Object.entries(knowledgePointStats).forEach(([kp, stats]) => {
  const correctRate = Math.round((stats.correct / stats.total) * 100);
  console.log(`${kp}: ${stats.correct}/${stats.total} (${correctRate}%)`);
}); 
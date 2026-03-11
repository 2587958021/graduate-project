# 知识点掌握度分析与推荐算法

## 概述

本项目实现了一个知识点掌握度分析与推荐算法，用于分析用户的学习情况，评估用户对各知识点的掌握程度，识别薄弱知识点，并提供个性化的学习建议和内容推荐。

## 算法特点

- 综合考虑用户练习的正确率、近期表现趋势和题目难度
- 建立知识点依赖关系模型，分析前置知识点的掌握情况
- 为不同知识点分配不同权重，突出核心知识点的重要性
- 提供个性化的学习建议和方法
- 推荐针对薄弱知识点的相关课程和练习

## 文件结构

- `backend/algorithms/knowledgeMasteryAnalyzer.js` - 算法主要实现
- `backend/controllers/learningAnalysisController.js` - 学习分析控制器
- `backend/controllers/exerciseController.js` - 练习题控制器
- `backend/controllers/aiController.js` - AI助手控制器

## 算法原理

### 掌握度计算

掌握度计算采用加权公式，综合考虑以下因素：

```
掌握度 = (基础掌握度 × 0.7 + 近期趋势 × 0.2 + 难度系数 × 0.1) × 知识点权重
```

其中：
- **基础掌握度** = 正确题数 / 总题数
- **近期趋势** = 最近5次练习的正确率 - 基础掌握度
- **难度系数** = 平均题目难度 / 3（归一化到0-1范围）
- **知识点权重** = 根据知识点重要性预设的权重值（1.0-1.3）

### 薄弱知识点识别

系统使用以下条件识别薄弱知识点：
- 掌握度低于60%
- 至少完成过3道相关练习题

### 知识点依赖关系分析

系统维护一个知识点依赖关系图，描述知识点之间的前置关系。当识别到薄弱知识点时，系统会分析其前置知识点的掌握情况，如果前置知识点掌握度也不高（<70%），则会建议先巩固前置知识点。

### 学习建议生成

系统生成三类学习建议：
- **聚焦建议**：针对薄弱知识点的直接建议
- **前置知识建议**：针对薄弱前置知识点的建议
- **学习方法建议**：针对特定知识点的学习方法和技巧

## 使用方法

### 在控制器中使用

```javascript
// 导入算法
const { analyzeKnowledgeMastery, generateContentRecommendations } = require('../algorithms/knowledgeMasteryAnalyzer');

// 获取用户练习历史
const exerciseHistory = getUserExerciseHistory(userId);

// 使用算法分析掌握度
const masteryAnalysis = analyzeKnowledgeMastery(exerciseHistory);

// 获取薄弱知识点
const weakPoints = masteryAnalysis.weakPoints;

// 获取学习建议
const recommendations = weakPoints[0].recommendations;
```

### API接口

1. **获取学习诊断报告**
   - 路径: `/learning-analysis/diagnostics`
   - 方法: `GET`
   - 描述: 获取完整的学习诊断报告，包括掌握度、薄弱知识点和学习建议

2. **分析薄弱知识点**
   - 路径: `/learning-analysis/weak-points`
   - 方法: `GET`
   - 描述: 获取用户薄弱知识点列表和相关推荐

3. **获取知识点掌握情况**
   - 路径: `/learning-analysis/knowledge-mastery`
   - 方法: `GET`
   - 描述: 获取用户所有知识点的掌握情况

## 扩展和维护

### 添加新知识点

在 `knowledgeMasteryAnalyzer.js` 文件中的 `knowledgeDependencyGraph` 和 `knowledgePointWeights` 对象中添加新的知识点：

```javascript
// 知识点依赖关系图
const knowledgeDependencyGraph = {
  // 现有知识点
  'HTML基础': [],
  
  // 添加新知识点
  '新知识点': ['前置知识点1', '前置知识点2']
};

// 知识点权重配置
const knowledgePointWeights = {
  // 现有知识点
  'JavaScript基础': 1.3,
  
  // 添加新知识点权重
  '新知识点': 1.1
};
```

### 调整算法参数

可以调整掌握度计算公式中的权重系数，以及薄弱知识点的判断阈值：

```javascript
// 掌握度计算公式权重
const BASIC_MASTERY_WEIGHT = 0.7;
const RECENT_TREND_WEIGHT = 0.2;
const DIFFICULTY_WEIGHT = 0.1;

// 薄弱知识点判断阈值
const WEAK_POINT_THRESHOLD = 60; // 低于60%为薄弱知识点
const MIN_QUESTIONS_THRESHOLD = 3; // 至少完成3道题
``` 
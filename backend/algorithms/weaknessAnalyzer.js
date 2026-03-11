/**
 * 薄弱点分析算法
 * 基于用户练习数据和错题本分析学习薄弱点，识别需要加强的知识点和题型
 */

/**
 * 分析用户的学习薄弱点
 * @param {Array} exerciseHistory - 用户练习历史记录
 * @param {Array} mistakes - 用户错题本数据
 * @param {Object} options - 分析选项
 * @param {Number} options.correctRateThreshold - 正确率阈值，低于此值被视为薄弱点（默认60%）
 * @param {Number} options.errorRateThreshold - 错误率阈值，高于此值被视为薄弱点（默认40%）
 * @param {Number} options.minExerciseCount - 最小练习题数量，少于此值不进行分析（默认1道题）
 * @param {Number} options.mistakeWeight - 错题权重，用于增强错题在分析中的影响（默认1.5）
 * @returns {Object} - 薄弱点分析结果
 */
function analyzeWeaknessWithMistakes(exerciseHistory, mistakes = [], options = {}) {
  // 设置默认选项
  const correctRateThreshold = options.correctRateThreshold || 60;
  const errorRateThreshold = options.errorRateThreshold || 40;
  const minExerciseCount = options.minExerciseCount || 1;
  const mistakeWeight = options.mistakeWeight || 1.5;

  console.log(`开始薄弱点分析，历史记录数量: ${exerciseHistory?.length || 0}，错题数量: ${mistakes?.length || 0}`);
  console.log(`分析参数: 正确率阈值=${correctRateThreshold}%, 错误率阈值=${errorRateThreshold}%, 最小题数=${minExerciseCount}, 错题权重=${mistakeWeight}`);

  // 确保exerciseHistory是数组
  if ((!exerciseHistory || !Array.isArray(exerciseHistory)) && (!mistakes || !Array.isArray(mistakes) || mistakes.length === 0)) {
    console.warn('练习历史记录和错题本都不是有效数组，返回空结果');
    return {
      weakKnowledgePoints: [],
      weakExerciseTypes: [],
      summary: {
        totalExercises: 0,
        totalMistakes: 0,
        analyzedKnowledgePoints: 0,
        analyzedExerciseTypes: 0,
        weakKnowledgePointsCount: 0,
        weakExerciseTypesCount: 0
      }
    };
  }

  // 如果练习历史为空，初始化为空数组
  if (!exerciseHistory || !Array.isArray(exerciseHistory)) {
    exerciseHistory = [];
  }

  // 如果错题本为空，初始化为空数组
  if (!mistakes || !Array.isArray(mistakes)) {
    mistakes = [];
  }

  // 如果没有足够的历史记录和错题，返回空结果
  if (exerciseHistory.length + mistakes.length < minExerciseCount) {
    console.log('历史记录和错题数据不足，无法进行薄弱点分析');
    return {
      weakKnowledgePoints: [],
      weakExerciseTypes: [],
      summary: {
        totalExercises: exerciseHistory.length,
        totalMistakes: mistakes.length,
        analyzedKnowledgePoints: 0,
        analyzedExerciseTypes: 0,
        weakKnowledgePointsCount: 0,
        weakExerciseTypesCount: 0
      }
    };
  }

  try {
    // 1. 数据预处理
    // 按知识点分组统计
    const knowledgePointStats = {};
    // 按题型分组统计
    const exerciseTypeStats = {};

    // 遍历练习历史记录
    exerciseHistory.forEach(record => {
      // 确保record是有效对象
      if (!record || typeof record !== 'object') {
        console.warn('跳过无效的练习记录:', record);
        return;
      }
      
      // 提取知识点
      const knowledgePoint = record.knowledgePoint || 
                           (record.exercise && record.exercise.knowledgePoint) || 
                           'unknown';
      
      // 提取题型
      const exerciseType = record.type || 
                         (record.exercise && record.exercise.type) || 
                         'unknown';
      
      // 确保isCorrect是布尔值
      const isCorrect = record.isCorrect === true;
      
      // 统计知识点数据
      if (knowledgePoint !== 'unknown') {
        if (!knowledgePointStats[knowledgePoint]) {
          knowledgePointStats[knowledgePoint] = {
            total: 0,
            correct: 0,
            incorrect: 0,
            mistakeCount: 0
          };
        }
        
        knowledgePointStats[knowledgePoint].total++;
        if (isCorrect) {
          knowledgePointStats[knowledgePoint].correct++;
        } else {
          knowledgePointStats[knowledgePoint].incorrect++;
        }
      }
      
      // 统计题型数据
      if (exerciseType !== 'unknown') {
        if (!exerciseTypeStats[exerciseType]) {
          exerciseTypeStats[exerciseType] = {
            total: 0,
            correct: 0,
            incorrect: 0,
            mistakeCount: 0
          };
        }
        
        exerciseTypeStats[exerciseType].total++;
        if (isCorrect) {
          exerciseTypeStats[exerciseType].correct++;
        } else {
          exerciseTypeStats[exerciseType].incorrect++;
        }
      }
    });
    
    // 处理错题本数据，增加权重
    mistakes.forEach(mistake => {
      // 确保mistake是有效对象
      if (!mistake || typeof mistake !== 'object') {
        console.warn('跳过无效的错题记录:', mistake);
        return;
      }
      
      // 提取知识点
      const knowledgePoint = mistake.knowledgePoint || 'unknown';
      
      // 提取题型
      const exerciseType = mistake.exerciseType || mistake.type || 'unknown';
      
      // 统计知识点数据
      if (knowledgePoint !== 'unknown') {
        if (!knowledgePointStats[knowledgePoint]) {
          knowledgePointStats[knowledgePoint] = {
            total: 0,
            correct: 0,
            incorrect: 0,
            mistakeCount: 0
          };
        }
        
        // 增加错题权重
        knowledgePointStats[knowledgePoint].total += mistakeWeight;
        knowledgePointStats[knowledgePoint].incorrect += mistakeWeight;
        knowledgePointStats[knowledgePoint].mistakeCount++;
      }
      
      // 统计题型数据
      if (exerciseType !== 'unknown') {
        if (!exerciseTypeStats[exerciseType]) {
          exerciseTypeStats[exerciseType] = {
            total: 0,
            correct: 0,
            incorrect: 0,
            mistakeCount: 0
          };
        }
        
        // 增加错题权重
        exerciseTypeStats[exerciseType].total += mistakeWeight;
        exerciseTypeStats[exerciseType].incorrect += mistakeWeight;
        exerciseTypeStats[exerciseType].mistakeCount++;
      }
    });
    
    console.log(`统计了 ${Object.keys(knowledgePointStats).length} 个知识点和 ${Object.keys(exerciseTypeStats).length} 种题型`);

    // 2. 薄弱点识别
    // 识别薄弱知识点
    const weakKnowledgePoints = [];
    for (const [knowledgePoint, stats] of Object.entries(knowledgePointStats)) {
      // 只分析有足够题量的知识点
      if (stats.total >= minExerciseCount) {
        const correctRate = Math.round((stats.correct / stats.total) * 100);
        const errorRate = Math.round((stats.incorrect / stats.total) * 100);
        
        // 判断是否为薄弱点
        const isWeak = correctRate < correctRateThreshold && errorRate > errorRateThreshold;
        
        // 如果是薄弱点或者错题数量大于0，添加到薄弱点列表
        if (isWeak || stats.mistakeCount > 0) {
          weakKnowledgePoints.push({
            knowledgePoint,
            total: stats.total,
            correct: stats.correct,
            incorrect: stats.incorrect,
            mistakeCount: stats.mistakeCount,
            correctRate,
            errorRate,
            // 计算推荐练习次数：根据当前正确率与目标正确率的差距来确定，并考虑错题数量
            recommendedPractices: Math.ceil((correctRateThreshold - correctRate) / 10) + Math.ceil(stats.mistakeCount / 2)
          });
        }
      }
    }
    
    // 识别薄弱题型
    const weakExerciseTypes = [];
    for (const [exerciseType, stats] of Object.entries(exerciseTypeStats)) {
      // 只分析有足够题量的题型
      if (stats.total >= minExerciseCount) {
        const correctRate = Math.round((stats.correct / stats.total) * 100);
        const errorRate = Math.round((stats.incorrect / stats.total) * 100);
        
        // 判断是否为薄弱点
        const isWeak = correctRate < correctRateThreshold && errorRate > errorRateThreshold;
        
        // 如果是薄弱点或者错题数量大于0，添加到薄弱点列表
        if (isWeak || stats.mistakeCount > 0) {
          weakExerciseTypes.push({
            exerciseType,
            total: stats.total,
            correct: stats.correct,
            incorrect: stats.incorrect,
            mistakeCount: stats.mistakeCount,
            correctRate,
            errorRate,
            // 计算推荐练习次数，并考虑错题数量
            recommendedPractices: Math.ceil((correctRateThreshold - correctRate) / 10) + Math.ceil(stats.mistakeCount / 2)
          });
        }
      }
    }
    
    // 按正确率升序排序（从最弱到最强）
    weakKnowledgePoints.sort((a, b) => a.correctRate - b.correctRate);
    weakExerciseTypes.sort((a, b) => a.correctRate - b.correctRate);
    
    console.log(`识别出 ${weakKnowledgePoints.length} 个薄弱知识点和 ${weakExerciseTypes.length} 种薄弱题型`);

    // 3. 生成分析总结
    const analyzedKnowledgePoints = Object.values(knowledgePointStats).filter(
      stats => stats.total >= minExerciseCount
    ).length;
    
    const analyzedExerciseTypes = Object.values(exerciseTypeStats).filter(
      stats => stats.total >= minExerciseCount
    ).length;

    // 4. 返回结果
    return {
      weakKnowledgePoints,
      weakExerciseTypes,
      summary: {
        totalExercises: exerciseHistory.length,
        totalMistakes: mistakes.length,
        analyzedKnowledgePoints,
        analyzedExerciseTypes,
        weakKnowledgePointsCount: weakKnowledgePoints.length,
        weakExerciseTypesCount: weakExerciseTypes.length
      }
    };
  } catch (error) {
    console.error('薄弱点分析过程中发生错误:', error);
    throw new Error('薄弱点分析失败: ' + error.message);
  }
}

// 保留旧函数名以保持兼容性
function analyzeWeakness(exerciseHistory, options = {}) {
  return analyzeWeaknessWithMistakes(exerciseHistory, [], options);
}

/**
 * 生成针对薄弱点的学习建议
 * @param {Object} weaknessAnalysis - 薄弱点分析结果
 * @returns {Object} - 学习建议
 */
function generateLearningRecommendations(weaknessAnalysis) {
  const { weakKnowledgePoints, weakExerciseTypes } = weaknessAnalysis;
  
  // 知识点建议
  const knowledgePointRecommendations = weakKnowledgePoints.map(wp => {
    // 根据正确率生成不同级别的建议
    let recommendation = '';
    const practiceCount = wp.recommendedPractices;
    const mistakeInfo = wp.mistakeCount > 0 ? `（包含${wp.mistakeCount}道错题）` : '';
    
    if (wp.correctRate < 30) {
      recommendation = `建议重新学习${wp.knowledgePoint}的基础概念，并进行至少${practiceCount}次针对性练习${mistakeInfo}`;
    } else if (wp.correctRate < 50) {
      recommendation = `建议复习${wp.knowledgePoint}的重点内容，并完成${practiceCount}次相关练习巩固${mistakeInfo}`;
    } else {
      recommendation = `建议针对${wp.knowledgePoint}做${practiceCount}次专项练习，重点关注错题${mistakeInfo}`;
    }
    
    return {
      knowledgePoint: wp.knowledgePoint,
      correctRate: wp.correctRate,
      mistakeCount: wp.mistakeCount,
      recommendation,
      practiceCount
    };
  });
  
  // 题型建议
  const exerciseTypeRecommendations = weakExerciseTypes.map(wt => {
    // 根据题型特点生成建议
    let recommendation = '';
    const practiceCount = wt.recommendedPractices;
    const typeName = getExerciseTypeName(wt.exerciseType);
    const mistakeInfo = wt.mistakeCount > 0 ? `（包含${wt.mistakeCount}道错题）` : '';
    
    if (wt.correctRate < 30) {
      recommendation = `建议加强${typeName}的解题技巧训练，完成至少${practiceCount}道此类题目${mistakeInfo}`;
    } else if (wt.correctRate < 50) {
      recommendation = `建议复习${typeName}的解题方法，并完成${practiceCount}道相关练习${mistakeInfo}`;
    } else {
      recommendation = `建议针对${typeName}再做${practiceCount}道练习，巩固解题思路${mistakeInfo}`;
    }
    
    return {
      exerciseType: wt.exerciseType,
      typeName,
      correctRate: wt.correctRate,
      mistakeCount: wt.mistakeCount,
      recommendation,
      practiceCount
    };
  });
  
  // 整体学习建议
  let overallRecommendation = '';
  if (weakKnowledgePoints.length > 0 || weakExerciseTypes.length > 0) {
    // 有薄弱点时的建议
    if (weakKnowledgePoints.length > 0 && weakExerciseTypes.length > 0) {
      // 既有薄弱知识点又有薄弱题型
      overallRecommendation = `建议优先加强${weakKnowledgePoints[0].knowledgePoint}知识点的学习，并针对${getExerciseTypeName(weakExerciseTypes[0].exerciseType)}题型进行专项训练`;
    } else if (weakKnowledgePoints.length > 0) {
      // 只有薄弱知识点
      overallRecommendation = `建议重点加强${weakKnowledgePoints.slice(0, 2).map(wp => wp.knowledgePoint).join('、')}等知识点的学习`;
    } else {
      // 只有薄弱题型
      overallRecommendation = `建议针对${weakExerciseTypes.slice(0, 2).map(wt => getExerciseTypeName(wt.exerciseType)).join('、')}等题型进行专项训练`;
    }
    
    // 如果有错题，添加错题提示
    const totalMistakes = weaknessAnalysis.summary.totalMistakes || 0;
    if (totalMistakes > 0) {
      overallRecommendation += `，并重点复习错题本中的${totalMistakes}道题目`;
    }
  } else {
    // 没有薄弱点时的建议
    overallRecommendation = '目前学习状况良好，建议继续保持，可以尝试更高难度的练习题';
  }
  
  return {
    knowledgePointRecommendations,
    exerciseTypeRecommendations,
    overallRecommendation
  };
}

/**
 * 获取题型的中文名称
 * @param {String} exerciseType - 题型标识
 * @returns {String} - 题型中文名称
 */
function getExerciseTypeName(exerciseType) {
  const typeNames = {
    'single-choice': '单选题',
    'multiple-choice': '多选题',
    'true-false': '判断题',
    'short-answer': '简答题',
    'code-completion': '代码补全题',
    'interview': '面试题'
  };
  
  return typeNames[exerciseType] || exerciseType;
}

module.exports = {
  analyzeWeakness,
  analyzeWeaknessWithMistakes,
  generateLearningRecommendations
}; 
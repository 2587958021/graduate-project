<template>
  <div class="exercise-history">
    <h1 class="page-title">练习历史记录</h1>

    <div class="filters">
      <div class="filter-group">
        <label>时间范围：</label>
        <select v-model="filters.timeFrame" @change="applyFilters">
          <option value="">全部时间</option>
          <option value="today">今天</option>
          <option value="week">本周</option>
          <option value="month">本月</option>
        </select>
      </div>

      <div class="filter-group">
        <label>习题类型：</label>
        <select v-model="filters.exerciseType" @change="applyFilters">
          <option value="">全部类型</option>
          <option value="single-choice">单选题</option>
          <option value="multiple-choice">多选题</option>
          <option value="true-false">判断题</option>
          <option value="fill-in">填空题</option>
          <option value="matching">连线题</option>
          <option value="short-answer">简答题</option>
          <option value="code-completion">代码补全题</option>
          <option value="interview">面试题</option>
        </select>
      </div>

      <div class="action-buttons">
        <button @click="resetFilters" class="btn btn-danger">重置筛选器</button>
        <button @click="clearAllHistory" class="btn btn-danger">清空历史记录</button>
        <button @click="clearInvalidRecords" class="btn btn-warning">清除无效记录</button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-panel" v-if="stats">
      <h2>总体统计</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">总题数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.correct }}</div>
          <div class="stat-label">正确数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.accuracy }}%</div>
          <div class="stat-label">正确率</div>
        </div>
      </div>

      <h3>按题型分类</h3>
      <div class="type-stats" v-if="stats.byType">
        <div v-for="(typeStat, type) in stats.byType" :key="type" class="type-stat-card">
          <div class="type-name">{{ getTypeName(type) }}</div>
          <div class="accuracy-bar">
            <div class="accuracy-fill"
              :style="{ width: typeStat.accuracy + '%', backgroundColor: getColorByAccuracy(typeStat.accuracy) }"></div>
          </div>
          <div class="type-detail">
            正确率: {{ typeStat.accuracy }}% ({{ typeStat.correct }}/{{ typeStat.total }})
          </div>
        </div>
      </div>
    </div>

    <!-- 历史记录列表 -->
    <div class="history-list">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="history.length === 0" class="empty-state">
        <p>暂无练习历史记录</p>
        <div class="empty-actions">
          <router-link to="/exercises" class="btn">开始练习</router-link>
        </div>
      </div>

      <div v-else>
        <div class="history-items">
          <div v-for="(item, index) in history" :key="index" class="history-item">
            <div class="history-date">
              {{ formatDate(item.createdAt) }}
            </div>

            <div v-if="isInvalidExercise(item.exercise._id)" class="invalid-exercise-warning">
              <div class="warning-icon">⚠️</div>
              <div class="warning-text">此题目ID无效，可能是系统导入问题，建议删除</div>
            </div>

            <div class="history-content">
              <div class="history-exercise">
                <h3>{{ item.exercise ? item.exercise.title : '未知练习题' }}</h3>
                <div class="exercise-content" v-if="item.exercise">
                  <div v-html="item.exercise.content"></div>
                </div>
              </div>

              <div class="history-answer">
                <div class="answer-header">
                  <span>你的答案：</span>
                  <span class="answer-status" :class="item.isCorrect ? 'correct' : 'incorrect'">
                    {{ item.isCorrect ? '正确' : '错误' }}
                  </span>
                </div>

                <div class="user-answer">
                  <pre
                    class="answer-content">{{ formatAnswer(item.userAnswer, item.exercise ? item.exercise.type : '') }}</pre>
                </div>
              </div>
            </div>

            <div class="history-actions">
              <router-link :to="`/exercises/${item.exercise._id}`" class="btn btn-small">重做此题</router-link>
              <button @click="removeHistoryItem(item.exercise._id)" class="btn btn-small btn-danger">删除记录</button>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination" v-if="totalPages > 1">
          <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1">上一页</button>

          <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>

          <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages">下一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import exercisesAPI from '@/api/exercises';
import api from '../../api/api';
import { ref, reactive, onMounted, onUnmounted } from 'vue';

export default {
  name: 'ExerciseHistory',
  components: {
  },

  setup() {
    const history = ref([]);
    const loading = ref(true);
    const stats = ref(null);
    const currentPage = ref(1);
    const totalPages = ref(1);

    const filters = reactive({
      timeFrame: '',
      exerciseType: '',
      limit: 10,
    });

    // 获取历史记录
    const fetchHistory = async (customParams) => {
      loading.value = true;
      try {
        // 默认参数
        const defaultParams = {
          page: currentPage.value,
          limit: filters.limit,
          timeFrame: filters.timeFrame,
          exerciseType: filters.exerciseType,
          _t: new Date().getTime() // 添加时间戳参数，防止缓存
        };

        // 合并自定义参数
        const params = customParams ? { ...defaultParams, ...customParams } : defaultParams;

        console.log('开始获取练习历史记录，参数:', params);

        try {
          // 从API获取数据
          console.log('从API获取练习历史记录...');
          const response = await exercisesAPI.getUserExerciseHistory(params);

          console.log('API返回的历史记录数据:', response);

          if (response && response.success) {
            // 标准API响应格式
            if (Array.isArray(response.data)) {
              history.value = response.data;
              stats.value = response.stats || calculateDefaultStats(response.data);
              currentPage.value = response.currentPage || 1;
              totalPages.value = response.totalPages || 1;
              console.log(`成功从API获取历史记录，共 ${history.value.length} 条记录`);
            } else {
              console.warn('API返回的data不是数组');
              history.value = [];
              stats.value = null;
            }
          } else {
            console.warn('API响应格式不正确或请求失败');
            history.value = [];
            stats.value = null;
          }
        } catch (error) {
          console.error('从API获取历史记录失败:', error);
          history.value = [];
          stats.value = null;
        }
      } catch (error) {
        console.error('获取历史记录失败:', error);
        // 确保出错时设置默认值
        history.value = [];
        stats.value = null;
      } finally {
        loading.value = false;
      }
    };

    // 计算默认统计数据
    const calculateDefaultStats = (historyData) => {
      if (!Array.isArray(historyData) || historyData.length === 0) {
        return {
          total: 0,
          correct: 0,
          accuracy: 0
        };
      }

      const total = historyData.length;
      const correct = historyData.filter(item => item.isCorrect).length;
      const accuracy = total > 0 ? (correct / total * 100).toFixed(2) : 0;

      return {
        total,
        correct,
        accuracy
      };
    };

    // 格式化日期
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // 格式化答案，根据题型不同显示
    const formatAnswer = (answer, type) => {
      if (answer === undefined || answer === null) return '未记录答案';

      // 对于多选题，处理数组形式的答案
      if (type === 'multiple-choice' && Array.isArray(answer)) {
        return answer.join(', ');
      }

      // 对于单选题的特殊处理
      if (type === 'single-choice' && typeof answer === 'string') {
        return answer;
      }

      // 对于判断题的特殊处理
      if (type === 'true-false') {
        if (answer === true || answer === 'true') return '正确';
        if (answer === false || answer === 'false') return '错误';
      }

      // 确保答案转换为字符串显示
      return String(answer);
    };

    // 获取题型名称
    const getTypeName = (type) => {
      const typeMap = {
        'single-choice': '单选题',
        'multiple-choice': '多选题',
        'true-false': '判断题',
        'fill-in': '填空题',
        'matching': '连线题',
        'short-answer': '简答题',
        'code-completion': '代码补全题',
        'interview': '面试题'
      };

      return typeMap[type] || type;
    };

    // 根据正确率获取颜色
    const getColorByAccuracy = (accuracy) => {
      const accuracyNum = parseFloat(accuracy);
      if (accuracyNum >= 80) return '#4CAF50'; // 绿色
      if (accuracyNum >= 60) return '#FFC107'; // 黄色
      return '#F44336'; // 红色
    };

    // 删除历史记录
    const removeHistoryItem = async (id) => {
      try {
        console.log('删除历史记录:', id);
        // 通过API删除历史记录
        await exercisesAPI.deleteExerciseHistory(id);

        // 重新加载历史记录
        fetchHistory();
      } catch (error) {
        console.error('删除历史记录失败:', error);
      }
    };

    // 清除所有历史记录
    const clearAllHistory = async () => {
      if (confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
        try {
          // 通过API清空所有历史记录
          await exercisesAPI.clearAllExerciseHistory();

          // 重新加载历史记录
          fetchHistory();
        } catch (error) {
          console.error('清空历史记录失败:', error);
        }
      }
    };

    // 清除无效记录
    const clearInvalidRecords = async () => {
      if (confirm('确定要清除所有无效记录吗？特别是ID以"68319db1e6242d4950b115d"开头的记录。此操作不可恢复。')) {
        try {
          // 通过API清除无效记录
          const response = await exercisesAPI.clearInvalidExerciseHistory();

          // 显示删除数量
          alert(`成功删除 ${response.deletedCount || 0} 条无效记录`);

          // 重新加载历史记录
          fetchHistory();
        } catch (error) {
          console.error('清除无效记录失败:', error);
        }
      }
    };

    // 判断题目是否无效
    const isInvalidExercise = (id) => {
      if (!id) return false;
      return typeof id === 'string' && id.startsWith('68319db1e6242d4950b115d');
    };

    // 添加练习更新事件监听器
    const handleExerciseUpdate = async (event) => {
      console.log('检测到练习更新事件，详情:', event.detail);
      console.log('开始重新加载历史记录数据...');

      try {
        // 生成唯一的时间戳
        const timestamp = new Date().getTime();

        // 添加延迟，确保后端数据已更新
        await new Promise(resolve => setTimeout(resolve, 300));

        // 重新加载历史记录数据，添加时间戳和强制刷新参数
        const params = {
          page: currentPage.value,
          limit: filters.limit,
          timeFrame: filters.timeFrame,
          exerciseType: filters.exerciseType,
          _t: timestamp,
          forceRefresh: true
        };

        console.log('重新获取历史记录，参数:', params);
        await fetchHistory(params);
        console.log('历史记录数据已更新');
      } catch (error) {
        console.error('更新历史记录数据失败:', error);
      }
    };

    // 初始化
    onMounted(() => {
      fetchHistory();

      // 添加练习更新事件监听器
      window.addEventListener('exercise-updated', handleExerciseUpdate);
    });

    // 组件卸载时移除事件监听器
    onUnmounted(() => {
      window.removeEventListener('exercise-updated', handleExerciseUpdate);
    });

    // 应用筛选器
    const applyFilters = () => {
      currentPage.value = 1; // 重置页码
      fetchHistory();
    };

    // 重置筛选器
    const resetFilters = () => {
      filters.timeFrame = '';
      filters.exerciseType = '';
      currentPage.value = 1;
      fetchHistory();
    };

    // 切换页面
    const changePage = (page) => {
      currentPage.value = page;
      fetchHistory();
    };

    return {
      history,
      loading,
      stats,
      filters,
      currentPage,
      totalPages,
      fetchHistory,
      changePage,
      formatDate,
      formatAnswer,
      getTypeName,
      getColorByAccuracy,
      removeHistoryItem,
      clearAllHistory,
      clearInvalidRecords,
      isInvalidExercise
    };
  }
};
</script>

<style scoped>
.exercise-history {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  height: 100vh;
  overflow-y: auto;
}

html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  color: #333;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-group select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn {
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: all 0.3s;
}

.btn-secondary {
  background-color: #f5f7fa;
  color: #606266;
  border: 1px solid #dcdfe6;
}

.btn-secondary:hover {
  background-color: #e6ebf5;
  color: #409eff;
}

.btn:not(.btn-secondary) {
  background-color: #409eff;
  color: white;
  border: none;
}

.btn:not(.btn-secondary):hover {
  background-color: #66b1ff;
}

.btn-danger {
  background-color: #F56C6C;
  color: white;
  border: none;
}

.btn-danger:hover {
  background-color: #E64747;
}

.btn-warning {
  background-color: #E6A23C;
  color: white;
  border: none;
}

.btn-warning:hover {
  background-color: #D29120;
}

.stats-panel {
  margin-bottom: 30px;
  padding: 20px;
  border-radius: 8px;
  background-color: #f9f9f9;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.stat-card {
  background-color: white;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #1976D2;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
}

.type-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.type-stat-card {
  background-color: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.type-name {
  font-weight: bold;
  margin-bottom: 10px;
}

.accuracy-bar {
  height: 10px;
  background-color: #e0e0e0;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 5px;
}

.accuracy-fill {
  height: 100%;
  border-radius: 5px;
}

.type-detail {
  font-size: 14px;
  color: #666;
}

.history-list {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.empty-state p {
  font-size: 16px;
  color: #666;
  margin-bottom: 20px;
}

.empty-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.history-items {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.history-item {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 15px;
  background-color: #fcfcfc;
}

.history-date {
  color: #666;
  font-size: 14px;
  margin-bottom: 10px;
}

.history-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 768px) {
  .history-content {
    grid-template-columns: 1fr;
  }
}

.history-exercise h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
}

.exercise-content {
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.history-answer {
  border-left: 1px solid #eee;
  padding-left: 20px;
}

@media (max-width: 768px) {
  .history-answer {
    border-left: none;
    border-top: 1px solid #eee;
    padding-left: 0;
    padding-top: 20px;
  }
}

.answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.answer-status {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 14px;
}

.correct {
  background-color: #E8F5E9;
  color: #388E3C;
}

.incorrect {
  background-color: #FFEBEE;
  color: #D32F2F;
}

.user-answer {
  margin-top: 10px;
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
  border-left: 3px solid #4a90e2;
}

.answer-content {
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  font-family: inherit;
  font-size: 14px;
}

.history-actions {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.btn-small {
  padding: 5px 10px;
  font-size: 12px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 30px;
}

.pagination button {
  padding: 5px 15px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  margin: 0 15px;
}

.invalid-exercise-warning {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.warning-icon {
  font-size: 16px;
  color: #FFC107;
}

.warning-text {
  font-size: 14px;
  color: #666;
}
</style>
<template>
  <div class="exercise-detail-container">
    <div class="exercise-detail">
      <div class="back-link">
        <router-link to="/exercises">
          <el-icon><ArrowLeft /></el-icon> 返回练习列表
        </router-link>
      </div>
      
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="error" class="error-state">
        <el-icon><WarningFilled /></el-icon>
        <p>{{ error }}</p>
        <el-button type="primary" @click="fetchExercise">重试</el-button>
      </div>
      
      <template v-else>
        <div class="exercise-header">
          <div class="exercise-title-area">
            <h1>{{ exercise.title }}</h1>
            <div class="exercise-meta">
              <el-tag size="small" effect="plain" :type="getExerciseTypeStyle(exercise.type)">
                {{ exercise.type }}
              </el-tag>
              <el-tag size="small" effect="plain" :type="getDifficultyStyle(exercise.difficulty)">
                {{ exercise.difficulty }}
              </el-tag>
              <span class="knowledge-point">{{ exercise.knowledgePoint }}</span>
            </div>
          </div>
          
          <div class="exercise-actions">
            <el-button type="primary" @click="startExercise">
              <el-icon><VideoPlay /></el-icon> 开始练习
            </el-button>
            <el-button type="default" @click="bookmarkExercise" :disabled="isBookmarked">
              <el-icon><Star /></el-icon> {{ isBookmarked ? '已收藏' : '收藏' }}
            </el-button>
          </div>
        </div>
        
        <div class="exercise-content">
          <div class="content-section">
            <h2>题目描述</h2>
            <div class="description" v-html="exercise.content"></div>
          </div>
          
          <div v-if="exercise.options && exercise.options.length > 0" class="content-section">
            <h2>选项</h2>
            <ul class="options-list">
              <li v-for="(option, index) in exercise.options" :key="index">
                <strong>{{ String.fromCharCode(65 + index) }}.</strong> {{ option }}
              </li>
            </ul>
          </div>
          
          <div v-if="showAnswer" class="content-section answer-section">
            <h2>答案</h2>
            <div class="answer">
              <p><strong>正确答案:</strong> {{ formatAnswer(exercise.answer) }}</p>
            </div>
          </div>
          
          <div class="toggle-answer">
            <el-button link @click="showAnswer = !showAnswer">
              {{ showAnswer ? '隐藏答案' : '查看答案' }}
            </el-button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getExerciseById } from '@/api/exercises';
import { ArrowLeft, WarningFilled, VideoPlay, Star } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const route = useRoute();
const router = useRouter();
const exerciseId = computed(() => route.params.id);

const exercise = ref({});
const loading = ref(true);
const error = ref('');
const showAnswer = ref(false);
const isBookmarked = ref(false);

// 获取练习详情
const fetchExercise = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await getExerciseById(exerciseId.value);
    
    if (response.success) {
      exercise.value = response.data;
      console.log('获取练习详情成功:', exercise.value);
    } else {
      throw new Error(response.message || '获取练习详情失败');
    }
  } catch (err) {
    console.error('获取练习详情错误:', err);
    error.value = err.message || '获取练习详情失败，请稍后重试';
  } finally {
    loading.value = false;
  }
};

// 开始练习
const startExercise = () => {
  router.push(`/exercises/test/${exerciseId.value}`);
};

// 收藏练习
const bookmarkExercise = () => {
  // TODO: 实现收藏功能
  isBookmarked.value = true;
  ElMessage.success('练习已收藏');
};

// 获取练习类型样式
const getExerciseTypeStyle = (type) => {
  const typeMap = {
    '单选题': 'primary',
    '多选题': 'success',
    '判断题': 'info',
    '填空题': 'warning',
    '编程题': 'danger'
  };
  
  return typeMap[type] || 'info';
};

// 获取难度样式
const getDifficultyStyle = (difficulty) => {
  const diffMap = {
    '简单': 'success',
    '中等': 'warning',
    '困难': 'danger'
  };
  
  return diffMap[difficulty] || 'info';
};

// 格式化答案
const formatAnswer = (answer) => {
  if (!answer) return '未提供';
  
  if (Array.isArray(answer)) {
    return answer.join(', ');
  }
  
  return answer;
};

// 监听ID变化
watch(exerciseId, () => {
  if (exerciseId.value) {
    fetchExercise();
  }
});

// 组件挂载时获取练习详情
onMounted(() => {
  if (exerciseId.value) {
    fetchExercise();
  }
});
</script>

<style scoped>
.exercise-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
}

.back-link {
  margin-bottom: 20px;
}

.back-link a {
  display: flex;
  align-items: center;
  color: #409EFF;
  text-decoration: none;
  font-size: 14px;
}

.back-link a:hover {
  text-decoration: underline;
}

.loading, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #409EFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  color: #F56C6C;
}

.error-state .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.exercise-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  border-bottom: 1px solid #EBEEF5;
  padding-bottom: 20px;
}

.exercise-title-area h1 {
  margin: 0 0 10px 0;
  font-size: 24px;
  color: #303133;
}

.exercise-meta {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.knowledge-point {
  background-color: #f2f6fc;
  color: #606266;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
}

.exercise-content {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.content-section {
  padding: 20px;
  border-bottom: 1px solid #EBEEF5;
}

.content-section h2 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 18px;
  color: #303133;
}

.description {
  line-height: 1.6;
  color: #606266;
}

.options-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.options-list li {
  padding: 12px 15px;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  margin-bottom: 10px;
  color: #606266;
  transition: background-color 0.3s;
}

.options-list li:hover {
  background-color: #F5F7FA;
}

.answer-section {
  background-color: #f8f9fb;
}

.answer {
  color: #303133;
}

.toggle-answer {
  padding: 15px;
  text-align: center;
}

.related-content {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
  height: fit-content;
}

.related-header {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 18px;
  color: #303133;
}

.related-description {
  color: #606266;
  margin-bottom: 20px;
  font-size: 14px;
  line-height: 1.5;
}

@media (max-width: 992px) {
  .exercise-detail-container {
    grid-template-columns: 1fr;
  }
  
  .exercise-header {
    flex-direction: column;
  }
  
  .exercise-actions {
    margin-top: 15px;
  }
}
</style> 
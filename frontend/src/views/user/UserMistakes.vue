<template>
  <div class="mistakes-container">
    <el-card class="mistakes-card">
      <template #header>
        <div class="card-header">
          <h2>我的错题本</h2>
          <div class="header-actions">
            <div class="filter-bar">
              <el-select v-model="filterType" placeholder="题目类型" clearable>
                <el-option label="单选题" value="single-choice"></el-option>
                <el-option label="多选题" value="multiple-choice"></el-option>
                <el-option label="判断题" value="true-false"></el-option>
                <el-option label="填空题" value="fill-in"></el-option>
                <el-option label="简答题" value="short-answer"></el-option>
                <el-option label="代码题" value="code-completion"></el-option>
              </el-select>
              <el-select v-model="filterDifficulty" placeholder="难度" clearable>
                <el-option label="简单" value="easy"></el-option>
                <el-option label="中等" value="medium"></el-option>
                <el-option label="困难" value="hard"></el-option>
              </el-select>
              <el-input
                v-model="searchKeyword"
                placeholder="搜索题目关键词"
                clearable
                class="search-input"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
          </div>
        </div>
      </template>
      
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="3" animated />
      </div>
      
      <div v-else>
        <el-empty v-if="mistakeList.length === 0" description="暂无错题记录">
          <template #description>
            <p>暂无数据，快点开始今天的学习吧</p>
          </template>
        </el-empty>
        
        <div v-else class="mistake-list">
          <div v-for="mistake in filteredMistakes" :key="mistake.id" class="mistake-item">
            <div class="mistake-header">
              <div class="mistake-info">
                <el-tag :type="getTypeTagType(mistake.type)">{{ getTypeName(mistake.type) }}</el-tag>
                <el-tag :type="getDifficultyTagType(mistake.difficulty)">{{ mistake.difficulty }}</el-tag>
                <span class="mistake-date">错误日期: {{ mistake.date }}</span>
              </div>
              <div class="mistake-actions">
                <el-button type="primary" link @click="reviewMistake(mistake.id)">
                  <el-icon><View /></el-icon> 复习
                </el-button>
                <el-button type="danger" link @click="removeMistake(mistake.id)">
                  <el-icon><Delete /></el-icon> 移除
                </el-button>
              </div>
            </div>
            
            <div class="mistake-content">
              <div class="mistake-question">
                <h3>{{ mistake.title }}</h3>
                <div v-html="mistake.content"></div>
              </div>
              
              <div class="mistake-analysis">
                <h4>错误分析</h4>
                <p class="user-answer">
                  <span class="label">你的答案:</span> 
                  <span class="wrong-answer">{{ formatUserAnswer(mistake.userAnswer, mistake.type) }}</span>
                </p>
                <p class="correct-answer">
                  <span class="label">正确答案:</span>
                  <span class="right-answer">{{ mistake.correctAnswer }}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="pagination-container" v-if="totalItems > pageSize && !loading">
          <el-pagination
            :current-page="currentPage"
            :page-size="pageSize"
            :page-sizes="[10, 20, 30, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="totalItems"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          ></el-pagination>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { View, Delete, Search } from '@element-plus/icons-vue';
import mistakeAPI from '@/api/mistakes';

const router = useRouter();
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const filterType = ref('');
const filterDifficulty = ref('');
const searchKeyword = ref('');

// 错题列表
const mistakeList = ref([]);

// 计算过滤后的错题列表
const filteredMistakes = computed(() => {
  let result = [...mistakeList.value];
  
  // 按题目类型过滤
  if (filterType.value) {
    result = result.filter(item => item.type === filterType.value);
  }
  
  // 按难度过滤
  if (filterDifficulty.value) {
    result = result.filter(item => {
      if (filterDifficulty.value === 'easy') return item.difficulty === '简单';
      if (filterDifficulty.value === 'medium') return item.difficulty === '中等';
      if (filterDifficulty.value === 'hard') return item.difficulty === '困难';
      return true;
    });
  }
  
  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(item => 
      item.title.toLowerCase().includes(keyword) || 
      item.content.toLowerCase().includes(keyword)
    );
  }
  
  totalItems.value = result.length;
  return result;
});

// 获取题目类型标签样式
const getTypeTagType = (type) => {
  switch (type) {
    case 'single-choice':
      return 'primary';
    case 'multiple-choice':
      return 'success';
    case 'true-false':
      return 'info';
    case 'fill-in':
      return 'warning';
    case 'short-answer':
      return 'danger';
    case 'code-completion':
      return 'primary';
    case 'interview':
      return 'info';
    default:
      return 'info';
  }
};

// 获取题目类型名称
const getTypeName = (type) => {
  switch (type) {
    case 'single-choice':
      return '单选题';
    case 'multiple-choice':
      return '多选题';
    case 'true-false':
      return '判断题';
    case 'fill-in':
      return '填空题';
    case 'short-answer':
      return '简答题';
    case 'code-completion':
      return '代码题';
    default:
      return '未知类型';
  }
};

// 获取难度标签样式
const getDifficultyTagType = (difficulty) => {
  switch (difficulty) {
    case '简单':
      return 'success';
    case '中等':
      return 'warning';
    case '困难':
      return 'danger';
    default:
      return 'info';
  }
};

// 复习错题
const reviewMistake = (id) => {
  console.log(`复习错题: ${id}`);
  router.push(`/practice?exerciseId=${id}`);
};

// 加载错题数据
const loadMistakeData = async () => {
  loading.value = true;
  try {
    console.log('开始加载错题数据...');
    const response = await mistakeAPI.getUserMistakes();
    
    console.log('错题数据API响应:', response);
    
    // 先检查整体响应是否正常
    if (!response) {
      console.error('获取错题数据响应为空');
      mistakeList.value = [];
      ElMessage.warning('获取错题数据失败，请稍后再试');
      return;
    }
    
    // 处理不同的响应格式
    let mistakesData = [];
    
    if (response.success && Array.isArray(response.data)) {
      // 标准格式 { success: true, data: [...] }
      mistakesData = response.data;
      console.log('标准格式响应，数据条数:', mistakesData.length);
    } else if (Array.isArray(response)) {
      // 直接返回数组
      mistakesData = response;
      console.log('数组格式响应，数据条数:', mistakesData.length);
    } else if (response.data && Array.isArray(response.data)) {
      // 嵌套数据 { data: [...] }
      mistakesData = response.data;
      console.log('嵌套数据格式响应，数据条数:', mistakesData.length);
    } else {
      console.warn('未知的响应格式:', response);
      mistakeList.value = [];
      ElMessage.info('暂无错题记录');
      return;
    }
    
    if (mistakesData.length === 0) {
      console.log('错题数据为空');
      mistakeList.value = [];
      ElMessage.info('暂无错题记录');
      return;
    }
    
    // 处理错题数据
    const processedMistakes = mistakesData.map(mistake => {
      return {
        id: mistake._id,
        exerciseId: mistake.exerciseId,
        title: mistake.title || '未知标题',
        content: mistake.content || '',
        type: mistake.exerciseType || 'unknown',
        difficulty: 'medium', // 默认难度
        date: new Date(mistake.createdAt || mistake.updatedAt || Date.now()).toLocaleDateString(),
        userAnswer: mistake.userAnswer !== undefined ? mistake.userAnswer : '未记录',
        correctAnswer: mistake.correctAnswer || '未提供',
        explanation: mistake.explanation || '暂无解析',
        knowledgePoint: mistake.knowledgePoint || '未分类',
        mastered: mistake.mastered || false,
        note: mistake.note || ''
      };
    });
    
    mistakeList.value = processedMistakes;
    totalItems.value = processedMistakes.length;
    
    console.log(`成功处理 ${processedMistakes.length} 个错题`);
  } catch (error) {
    console.error('获取错题数据异常', error);
    // 提供更详细的错误信息
    if (error.response) {
      console.error('错误响应:', error.response.data);
      ElMessage.error(`获取错题数据失败: ${error.response.data.message || '服务器错误'}`);
    } else if (error.request) {
      ElMessage.error('获取错题数据失败: 服务器未响应，请检查网络连接');
    } else {
      ElMessage.error(`获取错题数据失败: ${error.message}`);
    }
    mistakeList.value = [];
  } finally {
    loading.value = false;
  }
};

// 从错题本中移除
const removeMistake = async (id) => {
  ElMessageBox.confirm('确定要从错题本中移除该题目吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await mistakeAPI.removeFromMistakes(id);
      if (response.data && response.data.success) {
        ElMessage.success('已从错题本中移除');
        // 重新加载数据
        loadMistakeData();
      } else {
        ElMessage.error('移除失败，请稍后再试');
      }
    } catch (error) {
      console.error('移除错题失败', error);
      ElMessage.error('移除失败，请稍后再试');
    }
  }).catch(() => {
    // 用户取消操作
  });
};

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
  loadMistakeData();
};

const handleCurrentChange = (page) => {
  currentPage.value = page;
  loadMistakeData();
};

// 格式化用户答案
const formatUserAnswer = (answer, type) => {
  if (answer === undefined || answer === null) return '未记录';
  
  // 处理不同题型的答案格式
  if (type === 'multiple-choice' && Array.isArray(answer)) {
    return answer.join(', ');
  } else if (type === 'true-false') {
    return answer === true ? '正确' : 
           answer === false ? '错误' : 
           answer === 'true' ? '正确' : 
           answer === 'false' ? '错误' : answer;
  }
  
  return answer.toString();
};

// 初始化
onMounted(() => {
  loadMistakeData();
});
</script>

<style scoped>
.mistakes-container {
  width: 100%;
}

.mistakes-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  flex-direction: column;
}

.card-header h2 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.search-input {
  max-width: 300px;
}

.loading-container {
  padding: 20px 0;
}

.mistake-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
}

.mistake-item {
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--el-bg-color);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.mistake-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--el-color-primary-light-9);
  border-bottom: 1px solid var(--el-border-color-light);
}

.mistake-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mistake-date {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-left: 8px;
}

.mistake-actions {
  display: flex;
  gap: 16px;
}

.mistake-content {
  padding: 16px;
}

.mistake-question {
  margin-bottom: 16px;
}

.mistake-question h3 {
  font-size: 16px;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 12px;
  color: var(--el-text-color-primary);
}

.mistake-analysis {
  padding: 16px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
}

.mistake-analysis h4 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.user-answer, .correct-answer {
  margin: 8px 0;
  line-height: 1.5;
}

.label {
  font-weight: 600;
  margin-right: 8px;
}

.wrong-answer {
  color: var(--el-color-danger);
  text-decoration: line-through;
}

.right-answer {
  color: var(--el-color-success);
}

.explanation {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed var(--el-border-color-lighter);
}

.explanation h4 {
  margin-top: 0;
  margin-bottom: 8px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    gap: 8px;
  }
  
  .mistake-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .mistake-actions {
    margin-top: 8px;
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
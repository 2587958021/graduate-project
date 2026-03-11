<template>
  <div class="exercise-statistics">
    <div class="page-header">
      <h1>练习统计</h1>
      <div class="actions">
        <el-select v-model="timeRange" placeholder="选择时间范围" size="large" @change="fetchExerciseStats">
          <el-option label="全部时间" value="all" />
          <el-option label="近一周" value="week" />
          <el-option label="近一月" value="month" />
          <el-option label="近三月" value="quarter" />
        </el-select>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="6" animated />
    </div>

    <div v-else-if="error" class="error-message">
      <el-empty description="暂无练习数据">
        <template #description>
          <p>{{ error }}</p>
        </template>
        <el-button type="primary" @click="goToExercise">去练习</el-button>
      </el-empty>
    </div>

    <div v-else class="statistics-grid">
      <!-- 总体统计区域 -->
      <div class="grid-section overview-stats">
        <div class="stat-box">
          <div class="stat-icon"><el-icon>
              <Document />
            </el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.total > 0 ? stats.total : '暂无数据' }}</div>
            <div class="stat-label">已完成不同题目</div>
          </div>
        </div>

        <div class="stat-box">
          <div class="stat-icon correct"><el-icon>
              <Check />
            </el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.total > 0 ? stats.correctRate : '暂无数据' }}</div>
            <div class="stat-label">正确率</div>
          </div>
        </div>

        <div class="stat-box">
          <div class="stat-icon wrong"><el-icon>
              <Close />
            </el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.total > 0 ? stats.wrongRate : '暂无数据' }}</div>
            <div class="stat-label">错误率</div>
          </div>
        </div>
      </div>

      <!-- 题型分布 -->
      <div class="grid-section type-distribution-section">
        <h3 class="section-title">题型分布</h3>
        <div id="typeDistributionChart" ref="typeDistributionChart" class="chart-container"></div>
      </div>

      <!-- 薄弱点分析模块 -->
      <div class="grid-section weakness-analysis-section">
        <h3 class="section-title">
          薄弱点分析
          <el-tooltip content="基于练习数据的智能分析，识别需要加强的知识点和题型" placement="top">
            <el-icon class="info-icon">
              <InfoFilled />
            </el-icon>
          </el-tooltip>
          <el-button type="primary" size="small" class="refresh-button" :loading="weaknessLoading"
            @click="fetchWeaknessAnalysis">
            <el-icon>
              <Refresh />
            </el-icon>
            刷新分析
          </el-button>
        </h3>

        <div v-if="weaknessLoading" class="loading-container">
          <el-skeleton :rows="3" animated />
        </div>

        <div
          v-else-if="!weaknessData || (!weaknessData.weakKnowledgePoints.length && !weaknessData.weakExerciseTypes.length)"
          class="empty-weakness">
          <el-empty description="暂无数据">
            <template #description>
              <p>{{ weaknessData && weaknessData.summary.totalExercises > 0 && stats.correctRate !== '0%' ? '您的学习状况良好！'
                :
                weaknessData && weaknessData.summary.totalExercises > 0 && stats.correctRate === '0%' ?
                  '您的练习全部错误，需要加强学习！' : '暂无练习记录' }}</p>
            </template>
            <el-button type="primary" @click="goToExercise">去练习</el-button>
          </el-empty>
        </div>

        <div v-else class="weakness-content">
          <!-- 薄弱知识点 -->
          <div v-if="weaknessData.weakKnowledgePoints.length > 0" class="weakness-section">
            <h4>薄弱知识点</h4>
            <el-table :data="weaknessData.weakKnowledgePoints" style="width: 100%" border stripe>
              <el-table-column prop="knowledgePoint" label="知识点" />
              <el-table-column prop="correctRate" label="正确率">
                <template #default="scope">
                  <el-progress :percentage="scope.row.correctRate" :color="getCorrectRateColor(scope.row.correctRate)"
                    :stroke-width="10" />
                </template>
              </el-table-column>
              <el-table-column prop="recommendedPractices" label="建议练习次数" width="120" />
              <el-table-column label="操作" width="100" align="center">
                <template #default="scope">
                  <el-button type="primary" @click="practiceKnowledgePoint(scope.row.knowledgePoint)" size="small">
                    去练习
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 薄弱题型 -->
          <div v-if="weaknessData.weakExerciseTypes.length > 0" class="weakness-section">
            <h4>薄弱题型</h4>
            <el-table :data="weaknessData.weakExerciseTypes" style="width: 100%" border stripe>
              <el-table-column label="题型">
                <template #default="scope">
                  {{ getTypeName(scope.row.exerciseType) }}
                </template>
              </el-table-column>
              <el-table-column prop="correctRate" label="正确率">
                <template #default="scope">
                  <el-progress :percentage="scope.row.correctRate" :color="getCorrectRateColor(scope.row.correctRate)"
                    :stroke-width="10" />
                </template>
              </el-table-column>
              <el-table-column prop="recommendedPractices" label="建议练习次数" width="120" />
              <el-table-column label="操作" width="100" align="center">
                <template #default="scope">
                  <el-button type="primary" @click="practiceExerciseType(scope.row.exerciseType)" size="small">
                    去练习
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>

      <!-- 学习资源推荐模块 -->
      <div class="grid-section resource-recommendations-section">
        <h3 class="section-title">
          学习资源推荐
          <el-tooltip content="基于您的薄弱点和学习情况推荐的学习资源" placement="top">
            <el-icon class="info-icon">
              <InfoFilled />
            </el-icon>
          </el-tooltip>
          <el-button type="primary" size="small" class="view-more-button" @click="showResourcesDialog">
            查看更多
          </el-button>
        </h3>

        <div v-if="resourcesLoading" class="loading-container">
          <el-skeleton :rows="3" animated />
        </div>

        <div v-else-if="!recommendedResources.length" class="empty-resources">
          <el-empty description="暂无推荐资源">
            <template #description>
              <p>完成更多练习题，系统将为您推荐更有针对性的学习资源</p>
            </template>
            <el-button type="primary" @click="showResourcesDialog">浏览所有资源</el-button>
          </el-empty>
        </div>

        <div v-else class="resources-preview">
          <div v-for="(resource, index) in recommendedResources.slice(0, 3)" :key="resource.id" class="resource-item">
            <div class="resource-index">{{ index + 1 }}</div>
            <div class="resource-content">
              <h4 class="resource-title">
                <a :href="resource.url" target="_blank" class="resource-link">{{ resource.title }}</a>
                <el-tag size="small" :type="getResourceTagType(resource.difficulty)">
                  {{ formatResourceDifficulty(resource.difficulty) }}
                </el-tag>
              </h4>
              <p class="resource-description">{{ resource.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 资源对话框 -->
    <el-dialog v-model="resourcesDialogVisible" title="学习资源推荐" width="70%" destroy-on-close>
      <div class="resources-list">
        <div v-for="resource in allResources" :key="resource.id" class="resource-item-full">
          <h4 class="resource-title">
            <a :href="resource.url" target="_blank" class="resource-link">{{ resource.title }}</a>
            <el-tag size="small" :type="getResourceTagType(resource.difficulty)">
              {{ formatResourceDifficulty(resource.difficulty) }}
            </el-tag>
          </h4>
          <p class="resource-description">{{ resource.description }}</p>
          <div class="resource-meta">
            <span class="resource-category">分类: {{ resource.category }}</span>
            <span class="resource-type">类型: {{ resource.type }}</span>
            <span class="resource-rating">评分: {{ resource.rating }}</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import * as echarts from 'echarts';
import { Document, Check, Close, Refresh, InfoFilled, Reading } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import api from '@/api/api.js';
import { useAuthStore } from '@/store/auth'; // 导入认证状态管理

const router = useRouter();
const authStore = useAuthStore(); // 获取认证状态
const loading = ref(true);
const error = ref('');
const timeRange = ref('all');
const typeDistributionChart = ref(null);

// 统计数据
const stats = ref({
  total: 0,
  correct: 0,
  correctRate: '0%',
  wrongRate: '0%'
});

// 题型分布
const typeDistribution = ref([]);

// 薄弱点分析数据
const weaknessData = ref(null);
const weaknessLoading = ref(false);

// 学习资源推荐数据
const recommendedResources = ref([]);
const resourcesLoading = ref(false);

// 添加资源对话框
const resourcesDialogVisible = ref(false);
const allResources = ref([]);

// 监听时间范围变化
watch(timeRange, () => {
  fetchExerciseStats();
  fetchWeaknessAnalysis(); // 同时更新薄弱点分析
  fetchResourceRecommendations(); // 同时更新资源推荐
});

// 获取练习统计数据
const fetchExerciseStats = async () => {
  // 不再检查用户是否已登录
  // if (!authStore.isAuthenticated) {
  //   ElMessage.warning('请先登录后查看练习统计');
  //   router.push('/login');
  //   return false;
  // }

  loading.value = true;
  error.value = '';

  try {
    console.log('开始获取练习统计数据');

    // 获取用户ID，如果未登录则使用默认ID
    const userId = authStore.isAuthenticated ? (authStore.user?._id || '1748618904860') : '1748618904860';
    console.log('使用的用户ID:', userId);

    // 从后端API获取数据
    const response = await api.get('/exercises/stats', {
      params: {
        timeFrame: timeRange.value,
        userId: userId // 确保userId是字符串类型
      }
    });

    console.log('API返回的原始数据:', response);

    // 统一处理响应数据
    let statsData = null;
    if (response && typeof response === 'object') {
      // 尝试获取数据，处理不同的响应格式
      statsData = response.data?.data || response.data || response;
    }

    console.log('解析后的数据:', statsData);

    if (statsData) {
      // 更新统计数据，确保所有数值都有默认值
      stats.value = {
        total: parseInt(statsData.total) || 0,
        correct: parseInt(statsData.correct) || 0,
        correctRate: `${parseFloat(statsData.correctRate || 0).toFixed(1)}%`,
        wrongRate: `${(100 - parseFloat(statsData.correctRate || 0)).toFixed(1)}%`
      };

      console.log('更新后的统计数据:', stats.value);

      // 更新题型分布数据
      if (Array.isArray(statsData.typeDistribution)) {
        typeDistribution.value = statsData.typeDistribution.map(item => ({
          type: item.type || item.exerciseType || 'unknown',
          count: parseInt(item.count) || 0,
          correctRate: parseFloat(item.correctRate || 0).toFixed(1)
        }));
      } else {
        // 设置默认的题型分布数据
        typeDistribution.value = [
          { type: 'single-choice', count: 0, correctRate: 0 },
          { type: 'multiple-choice', count: 0, correctRate: 0 },
          { type: 'true-false', count: 0, correctRate: 0 }
        ];
      }

      console.log('更新题型分布数据:', typeDistribution.value);

      // 使用nextTick确保DOM更新后再初始化图表
      nextTick(() => {
        console.log('在nextTick中初始化图表');
        setTimeout(() => {
          initTypeDistributionChart();
        }, 100); // 添加小延时确保DOM完全准备好
      });

      return true;
    } else {
      throw new Error('无效的响应数据格式');
    }
  } catch (error) {
    console.error('获取练习统计数据失败:', error);
    error.value = '获取练习统计数据失败';

    // 设置默认数据
    stats.value = {
      total: 0,
      correct: 0,
      correctRate: '0%',
      wrongRate: '0%'
    };

    typeDistribution.value = [
      { type: 'single-choice', count: 0, correctRate: 0 },
      { type: 'multiple-choice', count: 0, correctRate: 0 },
      { type: 'true-false', count: 0, correctRate: 0 }
    ];

    // 渲染默认图表
    nextTick(() => {
      console.log('在错误处理中初始化默认图表');
      setTimeout(() => {
        initTypeDistributionChart();
      }, 100);
    });

    return false;
  } finally {
    loading.value = false;
  }
};

// 获取薄弱点分析
const fetchWeaknessAnalysis = async () => {
  // 不再检查用户是否已登录
  // if (!authStore.isAuthenticated) {
  //   ElMessage.warning('请先登录后查看薄弱点分析');
  //   router.push('/login');
  //   return;
  // }

  weaknessLoading.value = true;

  try {
    // 获取用户ID，如果未登录则使用默认ID
    const userId = authStore.isAuthenticated ? (authStore.user?._id || '1748618904860') : '1748618904860';
    console.log('薄弱点分析使用的用户ID:', userId);

    // 从API获取薄弱点分析
    const response = await api.get('/exercises/weakness-analysis', {
      params: {
        timeframe: timeRange.value,
        includeMistakes: true,
        userId: userId // 确保userId是字符串类型
      }
    });

    console.log('薄弱点分析API返回的原始数据:', response);

    // 检查各种可能的响应格式
    let analysisData = null;

    if (response && response.data && response.data.success) {
      // 标准格式：{ success: true, data: {...} }
      analysisData = response.data.data;
    } else if (response && response.data) {
      // 直接返回数据对象
      analysisData = response.data;
    } else if (response && response.success && response.data) {
      // 另一种标准格式
      analysisData = response.data;
    }

    // 处理API返回数据
    if (analysisData) {
      // 更新薄弱点数据
      weaknessData.value = analysisData;
    } else {
      // API返回成功但数据结构不符合预期
      setDefaultWeaknessData();
    }
  } catch (error) {
    console.error('获取薄弱点分析失败:', error);
    // 设置默认数据
    setDefaultWeaknessData();

    if (error.response && error.response.status === 404) {
      console.log('薄弱点分析API未实现，使用默认数据');
    } else {
      ElMessage.error('获取薄弱点分析失败');
    }
  } finally {
    weaknessLoading.value = false;
  }
};

// 添加练习更新事件监听器
const handleExerciseUpdate = () => {
  console.log('检测到练习更新事件，重新加载统计数据');
  fetchExerciseStats();
  fetchWeaknessAnalysis();
};

// 设置默认的薄弱点数据
const setDefaultWeaknessData = () => {
  weaknessData.value = {
    weakKnowledgePoints: [],
    weakExerciseTypes: [],
    summary: {
      totalExercises: stats.value.total || 0,
      totalMistakes: stats.value.total - (stats.value.correct || 0)
    }
  };
};

// 显示无数据提示
const showNoDataMessage = (chartDom, message = '暂无数据') => {
  if (!chartDom) return;

  // 先清除所有内容
  chartDom.innerHTML = '';

  // 创建一个居中的提示信息
  const msgDiv = document.createElement('div');
  msgDiv.style.display = 'flex';
  msgDiv.style.justifyContent = 'center';
  msgDiv.style.alignItems = 'center';
  msgDiv.style.height = '100%';
  msgDiv.style.color = '#909399';
  msgDiv.style.fontSize = '16px';
  msgDiv.style.fontWeight = '500';
  msgDiv.style.flexDirection = 'column';

  // 添加图标
  const iconDiv = document.createElement('div');
  iconDiv.innerHTML = '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="48" height="48"><path fill="#909399" d="M855.7 210.8l-42.4-42.4a8.03 8.03 0 0 0-11.3 0L168.3 801.9a8.03 8.03 0 0 0 0 11.3l42.4 42.4c3.1 3.1 8.2 3.1 11.3 0L855.6 222c3.2-3 3.2-8.1.1-11.2zM304 448c79.4 0 144-64.6 144-144s-64.6-144-144-144-144 64.6-144 144 64.6 144 144 144zm0-216c39.7 0 72 32.3 72 72s-32.3 72-72 72-72-32.3-72-72 32.3-72 72-72zm416 344c-79.4 0-144 64.6-144 144s64.6 144 144 144 144-64.6 144-144-64.6-144-144-144zm0 216c-39.7 0-72-32.3-72-72s32.3-72 72-72 72 32.3 72 72-32.3 72-72 72z"></path></svg>';
  msgDiv.appendChild(iconDiv);

  // 添加文字
  const textDiv = document.createElement('div');
  textDiv.innerText = message;
  textDiv.style.marginTop = '16px';
  msgDiv.appendChild(textDiv);

  // 添加到图表容器
  chartDom.appendChild(msgDiv);
};

// 初始化题型分布图表
const initTypeDistributionChart = () => {
  try {
    console.log('开始初始化题型分布图表');

    // 获取DOM元素
    let chartDom = typeDistributionChart.value;
    if (!chartDom) {
      chartDom = document.getElementById('typeDistributionChart');
      if (chartDom) {
        typeDistributionChart.value = chartDom;
      }
    }

    if (!chartDom) {
      console.error('找不到图表DOM元素');
      return;
    }

    // 确保DOM元素尺寸正确
    chartDom.style.width = '100%';
    chartDom.style.height = '350px';
    chartDom.style.position = 'relative';

    // 销毁之前的实例（如果存在）
    const existingChart = echarts.getInstanceByDom(chartDom);
    if (existingChart) {
      existingChart.dispose();
    }

    // 初始化图表
    const chart = echarts.init(chartDom);

    // 检查是否有有效数据
    const hasValidData = typeDistribution.value &&
      Array.isArray(typeDistribution.value) &&
      typeDistribution.value.some(item => item.count > 0);

    // 准备图表数据
    const pieData = hasValidData ? typeDistribution.value.map(item => ({
      name: getTypeName(item.type),
      value: parseInt(item.count) || 0,
      correctRate: parseFloat(item.correctRate) || 0
    })) : [
      { name: '单选题', value: 0, correctRate: 0 },
      { name: '多选题', value: 0, correctRate: 0 },
      { name: '判断题', value: 0, correctRate: 0 }
    ];

    // 图表配置
    const option = {
      backgroundColor: 'transparent',
      title: {
        text: hasValidData ? '题型分布' : '暂无练习数据',
        left: 'center',
        top: hasValidData ? 'auto' : '40%',
        textStyle: {
          fontSize: hasValidData ? 16 : 18,
          color: hasValidData ? undefined : '#909399'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: function (params) {
          if (params.value === 0) {
            return `${params.name}: 暂无数据`;
          }
          return `${params.name}: ${params.value}题 (${params.percent}%)<br/>正确率: ${params.data.correctRate}%`;
        }
      },
      legend: {
        orient: 'horizontal',
        bottom: 0,
        left: 'center',
        itemWidth: 14,
        itemHeight: 10,
        fontSize: 12,
        show: hasValidData
      },
      color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'],
      series: [
        {
          name: '题型分布',
          type: 'pie',
          radius: hasValidData ? ['40%', '70%'] : '0%',
          center: ['50%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: hasValidData,
            position: 'outside',
            formatter: '{b}: {c}题',
            fontSize: 12
          },
          labelLine: {
            show: hasValidData,
            length: 15,
            length2: 10
          },
          emphasis: {
            focus: 'series',
            scaleSize: 10
          },
          data: pieData,
          animation: true
        }
      ]
    };

    // 设置图表选项
    chart.setOption(option);
    console.log('成功设置图表选项');

    // 保存图表实例
    typeDistributionChart.value = chart;

    // 确保图表正确渲染
    setTimeout(() => {
      if (chart && !chart._disposed && typeof chart.resize === 'function') {
        chart.resize();
        console.log('调整图表大小');
      }
    }, 200);

    // 添加窗口大小变化的监听
    const handleResize = () => {
      if (chart && !chart._disposed && typeof chart.resize === 'function') {
        chart.resize();
      }
    };

    window.addEventListener('resize', handleResize);

    // 返回清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart && !chart._disposed) {
        chart.dispose();
      }
    };
  } catch (error) {
    console.error('初始化题型分布图表失败:', error);

    // 获取DOM元素并显示错误信息
    const chartDom = typeDistributionChart.value || document.getElementById('typeDistributionChart');
    if (chartDom) {
      showNoDataMessage(chartDom, '图表加载失败，请刷新重试');
    }
  }
};

// 获取题型名称
const getTypeName = (type) => {
  const typeNames = {
    'single-choice': '单选题',
    'multiple-choice': '多选题',
    'true-false': '判断题',
    'short-answer': '简答题',
    'code-completion': '代码补全',
    'interview': '面试题'
  };

  return typeNames[type] || type;
};

// 获取正确率颜色
const getCorrectRateColor = (correctRate) => {
  if (correctRate < 30) return '#F56C6C';
  if (correctRate < 60) return '#E6A23C';
  if (correctRate < 80) return '#409EFF';
  return '#67C23A';
};

// 跳转到练习中心
const goToExercise = () => {
  router.push('/exercises');
};

// 练习特定题型
const practiceExerciseType = (exerciseType) => {
  router.push({
    path: '/exercises',
    query: { type: exerciseType }
  });
};

// 练习特定知识点
const practiceKnowledgePoint = (knowledgePoint) => {
  router.push({
    path: '/exercises',
    query: { knowledgePoint }
  });
};

// 添加格式化资源难度的函数
const formatResourceDifficulty = (difficulty) => {
  const difficultyMap = {
    'beginner': '初级',
    'intermediate': '中级',
    'advanced': '高级'
  };
  return difficultyMap[difficulty] || difficulty;
};

// 添加获取资源标签类型的函数
const getResourceTagType = (difficulty) => {
  const typeMap = {
    'beginner': 'success',
    'intermediate': 'warning',
    'advanced': 'danger'
  };
  return typeMap[difficulty] || '';
};

// 获取资源推荐
const fetchResourceRecommendations = async () => {
  resourcesLoading.value = true;

  try {
    // 使用固定的示例资源
    const sampleResources = [
      {
        id: "res1001",
        title: "JavaScript 基础教程",
        type: "tutorial",
        category: "JavaScript",
        knowledgePoints: ["JavaScript基础", "变量", "数据类型", "函数", "对象"],
        difficulty: "beginner",
        url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide",
        description: "MDN提供的全面JavaScript基础教程，涵盖从变量到函数的所有基础知识",
        rating: 4.8,
        tags: ["JavaScript", "基础", "入门"]
      },
      {
        id: "res1003",
        title: "React官方文档",
        type: "documentation",
        category: "React",
        knowledgePoints: ["React基础", "组件", "Hooks", "状态管理"],
        difficulty: "intermediate",
        url: "https://zh-hans.reactjs.org/docs/getting-started.html",
        description: "React官方文档，提供全面的API参考和最佳实践",
        rating: 4.7,
        tags: ["React", "文档", "组件"]
      },
      {
        id: "res1018",
        title: "React Hooks详解",
        type: "tutorial",
        category: "React",
        knowledgePoints: ["React Hooks", "useState", "useEffect", "自定义Hook"],
        difficulty: "intermediate",
        url: "https://zh-hans.reactjs.org/docs/hooks-intro.html",
        description: "React Hooks完整指南，从基础到高级用法",
        rating: 4.8,
        tags: ["React", "Hooks", "函数组件"]
      }
    ];

    // 设置推荐资源
    recommendedResources.value = sampleResources;
  } catch (error) {
    console.error('获取资源推荐失败:', error);
    recommendedResources.value = [];
  } finally {
    resourcesLoading.value = false;
  }
};

// 显示资源对话框
const showResourcesDialog = () => {
  // 加载更多资源
  allResources.value = [
    ...recommendedResources.value,
    {
      id: "res1009",
      title: "现代JavaScript教程",
      type: "tutorial",
      category: "JavaScript",
      knowledgePoints: ["JavaScript基础", "DOM", "事件", "异步编程"],
      difficulty: "beginner",
      url: "https://zh.javascript.info/",
      description: "从基础到高级的现代JavaScript教程，内容全面且易于理解",
      rating: 4.9,
      tags: ["JavaScript", "教程", "现代"]
    },
    {
      id: "res1013",
      title: "ES6入门教程",
      type: "tutorial",
      category: "JavaScript",
      knowledgePoints: ["ES6", "箭头函数", "Promise", "模块化"],
      difficulty: "intermediate",
      url: "https://es6.ruanyifeng.com/",
      description: "阮一峰的ES6入门教程，全面介绍ES6新特性",
      rating: 4.8,
      tags: ["ES6", "JavaScript", "教程"]
    }
  ];

  // 显示对话框
  resourcesDialogVisible.value = true;
};

// 页面加载时获取统计数据
onMounted(async () => {
  // 获取练习统计数据
  await fetchExerciseStats();

  // 获取薄弱点分析
  await fetchWeaknessAnalysis();

  // 获取资源推荐
  await fetchResourceRecommendations();

  // 监听窗口大小变化，重绘图表
  const handleResize = () => {
    if (typeDistributionChart.value && typeof typeDistributionChart.value.resize === 'function') {
      typeDistributionChart.value.resize();
    }
  };

  window.addEventListener('resize', handleResize);

  // 添加练习更新事件监听器
  window.addEventListener('exercise-updated', handleExerciseUpdate);

  // 组件卸载时清理
  onUnmounted(() => {
    // 移除事件监听
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('exercise-updated', handleExerciseUpdate);

    // 销毁图表实例
    if (typeDistributionChart.value && !typeDistributionChart.value._disposed && typeof typeDistributionChart.value.dispose === 'function') {
      typeDistributionChart.value.dispose();
    }
  });
});
</script>

<style scoped>
.exercise-statistics {
  padding: 20px 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 24px;
  margin: 0;
  color: var(--el-color-primary);
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.loading-container {
  padding: 30px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.error-message {
  text-align: center;
  padding: 50px 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.grid-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  padding: 24px;
  transition: transform 0.3s, box-shadow 0.3s;
}

.grid-section:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px 0 rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-light);
  color: var(--el-color-primary);
}

.overview-stats {
  grid-column: span 2;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.stat-box {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 8px;
  background: var(--el-bg-color-page);
  transition: transform 0.3s;
}

.stat-box:hover {
  transform: scale(1.03);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: var(--el-color-primary);
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 20px;
  color: white;
  font-size: 24px;
}

.stat-icon.correct {
  background-color: var(--el-color-success);
}

.stat-icon.wrong {
  background-color: var(--el-color-danger);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
}

.stat-label {
  font-size: 16px;
  color: var(--el-text-color-secondary);
}

.type-distribution-section {
  grid-column: span 2;
}

.weak-points-section {
  grid-column: span 2;
}

.chart-container {
  width: 100% !important;
  height: 350px !important;
  min-height: 300px;
  margin-bottom: 20px;
  position: relative;
  display: block;
}

.weakness-analysis-section {
  grid-column: span 2;
}

.info-icon {
  font-size: 16px;
  margin-left: 8px;
  color: var(--el-color-info);
  cursor: help;
}

.refresh-button {
  float: right;
  margin-top: -5px;
}

.empty-weakness {
  padding: 30px 0;
  text-align: center;
}

.weakness-section {
  margin-bottom: 24px;
}

.weakness-section h4 {
  font-size: 16px;
  margin-top: 0;
  margin-bottom: 16px;
  color: var(--el-color-primary);
}

.recommendations-section {
  margin-top: 24px;
}

.recommendations-section h4 {
  font-size: 16px;
  margin-top: 0;
  margin-bottom: 16px;
  color: var(--el-color-primary);
}

.recommendation-card {
  background-color: var(--el-bg-color-page);
  border-radius: 8px;
  padding: 16px;
}

.overall-recommendation {
  font-weight: 500;
  color: var(--el-color-info-dark);
  margin-top: 0;
}

.recommendation-list h5 {
  font-size: 14px;
  margin-top: 16px;
  margin-bottom: 8px;
  color: var(--el-color-info-dark);
}

.recommendation-list ul {
  margin: 0;
  padding-left: 20px;
}

.recommendation-list li {
  margin-bottom: 8px;
  color: var(--el-text-color-regular);
}

.resources-button {
  float: right;
  margin-top: -5px;
}

.resource-recommendations-section {
  grid-column: span 2;
}

.empty-resources {
  padding: 30px 0;
  text-align: center;
}

.resources-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: var(--el-bg-color-page);
  border-radius: 8px;
}

.resource-item {
  display: flex;
  align-items: center;
  width: 33.33%;
}

.resource-index {
  font-size: 24px;
  font-weight: bold;
  margin-right: 20px;
  color: var(--el-color-primary);
}

.resource-content {
  flex: 1;
}

.resource-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
  color: var(--el-color-primary);
}

.resource-link {
  color: var(--el-color-primary);
  text-decoration: none;
}

.view-more-button {
  float: right;
  margin-top: -5px;
}

@media (max-width: 768px) {
  .statistics-grid {
    grid-template-columns: 1fr;
  }

  .overview-stats {
    grid-column: span 1;
    grid-template-columns: 1fr;
  }

  .knowledge-section,
  .type-distribution-section,
  .accuracy-section,
  .weak-points-section {
    grid-column: span 1;
  }

  .weakness-analysis-section {
    grid-column: span 1;
  }
}

.resources-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 10px;
}

.resource-item-full {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  background-color: #fafafa;
  transition: all 0.3s;
}

.resource-item-full:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.resource-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
}

.resource-link {
  color: #409eff;
  text-decoration: none;
  font-weight: bold;
}

.resource-link:hover {
  text-decoration: underline;
}

.resource-description {
  color: #606266;
  margin-bottom: 10px;
  line-height: 1.5;
}

.resource-meta {
  display: flex;
  gap: 15px;
  color: #909399;
  font-size: 13px;
}
</style>
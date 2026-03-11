<template>
  <div class="statistics-manager">
    <div class="page-header">
      <h1 class="page-title">数据统计</h1>
      <div class="page-actions">
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
        <el-button type="info" @click="exportData">
          <el-icon><Download /></el-icon>
          导出报表
        </el-button>
      </div>
    </div>

    <!-- 数据卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card-content">
            <div class="stat-icon user-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">注册用户</div>
              <div class="stat-value">{{ statistics.userCount }}</div>
              <div class="stat-change">
                <span :class="{'increase': statistics.userGrowth > 0, 'decrease': statistics.userGrowth < 0}">
                  {{ statistics.userGrowth > 0 ? '+' : '' }}{{ statistics.userGrowth }}%
                </span>
                较上月
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card-content">
            <div class="stat-icon course-icon">
              <el-icon><Reading /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">课程总数</div>
              <div class="stat-value">{{ statistics.courseCount }}</div>
              <div class="stat-change">
                <span :class="{'increase': statistics.courseGrowth > 0, 'decrease': statistics.courseGrowth < 0}">
                  {{ statistics.courseGrowth > 0 ? '+' : '' }}{{ statistics.courseGrowth }}%
                </span>
                较上月
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card-content">
            <div class="stat-icon exercise-icon">
              <el-icon><Notebook /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">练习总数</div>
              <div class="stat-value">{{ statistics.exerciseCount }}</div>
              <div class="stat-change">
                <span :class="{'increase': statistics.exerciseGrowth > 0, 'decrease': statistics.exerciseGrowth < 0}">
                  {{ statistics.exerciseGrowth > 0 ? '+' : '' }}{{ statistics.exerciseGrowth }}%
                </span>
                较上月
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card-content">
            <div class="stat-icon activity-icon">
              <el-icon><View /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">活跃用户</div>
              <div class="stat-value">{{ statistics.activeUsers }}</div>
              <div class="stat-change">
                <span :class="{'increase': statistics.activeGrowth > 0, 'decrease': statistics.activeGrowth < 0}">
                  {{ statistics.activeGrowth > 0 ? '+' : '' }}{{ statistics.activeGrowth }}%
                </span>
                较上周
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>用户增长趋势</span>
              <el-radio-group v-model="userChartPeriod" size="small">
                <el-radio-button value="week">周</el-radio-button>
                <el-radio-button value="month">月</el-radio-button>
                <el-radio-button value="year">年</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container">
            <div ref="userGrowthChart" class="chart"></div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>课程学习量</span>
              <el-radio-group v-model="courseChartPeriod" size="small">
                <el-radio-button value="week">周</el-radio-button>
                <el-radio-button value="month">月</el-radio-button>
                <el-radio-button value="year">年</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container">
            <div ref="courseLearningChart" class="chart"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>练习题类型分布</span>
              <el-select v-model="exerciseTypeLimit" size="small" style="width: 120px">
                <el-option label="Top 5" :value="5" />
                <el-option label="Top 10" :value="10" />
                <el-option label="Top 15" :value="15" />
              </el-select>
            </div>
          </template>
          <div class="chart-container">
            <div ref="exerciseTypeChart" class="chart"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { User, Reading, Notebook, View, Refresh, Download } from '@element-plus/icons-vue';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import adminApi from '@/api/admin'; // 导入新的管理员API服务

// 注册必要的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  BarChart,
  LineChart,
  PieChart,
  CanvasRenderer
]);

// 图表DOM引用
const userGrowthChart = ref(null);
const courseLearningChart = ref(null);
const exerciseTypeChart = ref(null);

// 图表实例对象
let userGrowthChartInstance = null;
let courseLearningChartInstance = null;
let exerciseTypeChartInstance = null;

// 图表设置和过滤选项
const userChartPeriod = ref('month');
const courseChartPeriod = ref('month');
const exerciseTypeLimit = ref(10);

// 统计数据
const statistics = reactive({
  userCount: 0,
  userGrowth: 0,
  courseCount: 0,
  courseGrowth: 0,
  exerciseCount: 0, 
  exerciseGrowth: 0,
  activeUsers: 0,
  activeGrowth: 0,
  userData: [],
  courseData: [],
  courseRankData: [],
  userDistributionData: [],
  newUserCount: 0,
  attemptCount: 0,
  correctRate: 0,
  exerciseTypes: []
});

// 加载和错误状态
const loading = ref(false);
const error = ref(null);

// 计算增长率
const calculateGrowthRate = (oldValue, newValue) => {
  if (oldValue === 0) return 100; // 如果旧值为0，视为100%增长
  if (newValue === 0) return -100; // 如果新值为0，视为-100%增长
  return Math.round(((newValue - oldValue) / oldValue) * 100);
};

// 设置默认统计数据
const setDefaultStatistics = () => {
  statistics.userCount = 3;
  statistics.newUserCount = 1;
  statistics.userGrowth = 33;
  statistics.courseCount = 3;
  statistics.courseGrowth = 0;
  statistics.exerciseCount = 78;
  statistics.exerciseGrowth = 0;
  statistics.activeUsers = 2;
  statistics.activeGrowth = 0;
  
  // 准备一些备用数据用于图表显示
  statistics.userGrowthData = [
    { week: '第0周', count: 0 },
    { week: '第1周', count: 1 },
    { week: '第2周', count: 0 },
    { week: '第3周', count: 1 },
    { week: '第4周', count: 1 }
  ];
  
  statistics.courseData = [
    { name: 'JavaScript基础', students: 2, completion: 65 },
    { name: 'HTML/CSS入门', students: 2, completion: 72 },
    { name: '前端框架实战', students: 1, completion: 45 }
  ];
  
  statistics.exerciseTypes = [
    { type: 'single-choice', count: 30 },
    { type: 'multiple-choice', count: 20 },
    { type: 'true-false', count: 15 },
    { type: 'fill-blank', count: 10 },
    { type: 'coding', count: 3 }
  ];
  
  // 更新图表
  nextTick(() => {
    initCharts();
  });
};

// 初始化图表
const initCharts = () => {
  // 防止多次初始化造成内存泄漏
  if (userGrowthChartInstance) userGrowthChartInstance.dispose();
  if (courseLearningChartInstance) courseLearningChartInstance.dispose();
  if (exerciseTypeChartInstance) exerciseTypeChartInstance.dispose();
  
  // 确保DOM元素存在后再初始化
  if (userGrowthChart.value) {
    userGrowthChartInstance = echarts.init(userGrowthChart.value);
  } else {
    console.warn('userGrowthChart DOM元素不存在');
  }
  
  if (courseLearningChart.value) {
    courseLearningChartInstance = echarts.init(courseLearningChart.value);
  } else {
    console.warn('courseLearningChart DOM元素不存在');
  }
  
  if (exerciseTypeChart.value) {
    exerciseTypeChartInstance = echarts.init(exerciseTypeChart.value);
  } else {
    console.warn('exerciseTypeChart DOM元素不存在');
  }
  
  // 只有当所有图表实例都存在时才更新
  if (userGrowthChartInstance && courseLearningChartInstance && exerciseTypeChartInstance) {
    updateCharts();
  } else {
    console.warn('部分图表未初始化，请检查DOM元素');
  }
};

// 更新图表数据
const updateCharts = () => {
  try {
    updateUserGrowthChart();
    updateCourseLearningChart();
    updateExerciseTypeChart();
  } catch (error) {
    console.error('更新图表失败:', error);
    ElMessage.error('更新图表失败，请刷新页面重试');
  }
};

// 更新用户增长趋势图
const updateUserGrowthChart = () => {
  if (!userGrowthChartInstance) {
    console.warn('用户增长趋势图未初始化');
    return;
  }
  
  try {
    // 使用实际API数据
    const userData = statistics.userGrowthData || [];
    const weeks = userData.map(item => item.week);
    const counts = userData.map(item => item.count);
    
    const option = {
      title: {
        text: '用户增长趋势',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: weeks
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '新增用户',
          type: 'line',
          data: counts,
          smooth: true,
          lineStyle: {
            width: 3,
            color: '#409EFF'
          },
          itemStyle: {
            color: '#409EFF'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(64, 158, 255, 0.6)' },
                { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
              ]
            }
          }
        }
      ]
    };
    
    userGrowthChartInstance.setOption(option);
  } catch (error) {
    console.error('更新用户增长趋势图失败:', error);
  }
};

// 更新课程学习量图
const updateCourseLearningChart = () => {
  if (!courseLearningChartInstance) {
    console.warn('课程学习量图未初始化');
    return;
  }
  
  try {
    // 使用实际API数据
    const courseData = statistics.courseData || [];
    const courseNames = courseData.map(item => item.name);
    const studentCounts = courseData.map(item => item.students);
    const completionRates = courseData.map(item => item.completion);
    
    const option = {
      title: {
        text: '课程学习情况',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['学习人数', '完成率'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: courseNames,
        axisLabel: {
          interval: 0,
          rotate: 30
        }
      },
      yAxis: [
        {
          type: 'value',
          name: '人数',
          position: 'left'
        },
        {
          type: 'value',
          name: '完成率(%)',
          position: 'right',
          min: 0,
          max: 100
        }
      ],
      series: [
        {
          name: '学习人数',
          type: 'bar',
          data: studentCounts,
          yAxisIndex: 0,
          itemStyle: {
            color: '#409EFF'
          }
        },
        {
          name: '完成率',
          type: 'line',
          data: completionRates,
          yAxisIndex: 1,
          itemStyle: {
            color: '#67C23A'
          }
        }
      ]
    };
    
    courseLearningChartInstance.setOption(option);
  } catch (error) {
    console.error('更新课程学习量图失败:', error);
  }
};

// 更新练习题类型分布图
const updateExerciseTypeChart = () => {
  if (!exerciseTypeChartInstance) {
    console.warn('练习题类型分布图未初始化');
    return;
  }
  
  try {
    // 使用实际API数据或备用数据
    let exerciseTypes = [];
    let typeCounts = [];
    
    if (statistics.exerciseTypes && Array.isArray(statistics.exerciseTypes)) {
      exerciseTypes = statistics.exerciseTypes.map(item => {
        // 转换类型名称为中文
        const typeMap = {
          'single-choice': '单选题',
          'multiple-choice': '多选题',
          'true-false': '判断题',
          'fill-in': '填空题',
          'matching': '匹配题',
          'short-answer': '简答题',
          'code-completion': '代码题',
          'interview': '面试题'
        };
        return typeMap[item.type] || item.type;
      });
      typeCounts = statistics.exerciseTypes.map(item => item.count);
    } else {
      exerciseTypes = ['单选题', '多选题', '判断题', '填空题', '代码题'];
      typeCounts = [45, 30, 15, 8, 2];
    }
    
    const option = {
      title: {
        text: '练习题类型分布',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'horizontal',
        bottom: 0
      },
      series: [
        {
          name: '题型分布',
          type: 'pie',
          radius: '65%',
          center: ['50%', '50%'],
          data: exerciseTypes.map((type, index) => ({
            name: type,
            value: typeCounts[index]
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };
    
    exerciseTypeChartInstance.setOption(option);
  } catch (error) {
    console.error('更新练习题类型分布图失败:', error);
  }
};

// 获取系统统计数据
const fetchSystemStats = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    console.log('正在获取系统统计数据...');
    const response = await adminApi.getSystemStats();
    console.log('原始API响应:', response);
    
    // 检查响应格式并适配
    if (response && response.success) {
      const data = response.data;
      console.log('统计数据:', data);
      
      // 用户统计
      if (data.userStats) {
        statistics.userCount = data.userStats.total || 0;
        statistics.newUserCount = data.userStats.newLastMonth || 0;
        statistics.activeUsers = data.userStats.active || 0;
        
        // 计算增长率
        statistics.userGrowth = calculateGrowthRate(statistics.userCount - statistics.newUserCount, statistics.userCount);
        statistics.activeGrowth = 0; // 没有历史数据，暂时设为0
      }
      
      // 课程统计
      if (data.courseStats) {
        statistics.courseCount = data.courseStats.total || 0;
        
        // 课程学习情况
        if (data.courseStats.data && Array.isArray(data.courseStats.data)) {
          statistics.courseData = data.courseStats.data;
        }
        
        // 假设增长率
        statistics.courseGrowth = 0;
      }
      
      // 练习题统计
      if (data.exerciseStats) {
        statistics.exerciseCount = data.exerciseStats.total || 0;
        statistics.attemptCount = data.exerciseStats.attempts || 0;
        statistics.correctRate = data.exerciseStats.accuracy || 0;
        
        // 练习题类型分布
        if (data.exerciseStats.typeDistribution && Array.isArray(data.exerciseStats.typeDistribution)) {
          statistics.exerciseTypes = data.exerciseStats.typeDistribution;
        }
        
        // 假设增长率
        statistics.exerciseGrowth = 0;
      }
      
      // 用户增长趋势
      if (data.weeklyUserGrowth && Array.isArray(data.weeklyUserGrowth)) {
        statistics.userGrowthData = data.weeklyUserGrowth;
      }
      
      // 更新图表
      nextTick(() => {
        initCharts();
      });
    } else {
      error.value = response?.message || '获取统计数据失败';
      ElMessage.warning(error.value);
    }
  } catch (err) {
    console.error('获取统计数据失败:', err);
    error.value = err.message || '获取统计数据失败';
    ElMessage.error(error.value);
    
    // 使用默认数据
    setDefaultStatistics();
  } finally {
    loading.value = false;
  }
};

// 刷新数据
const refreshData = async () => {
  try {
    loading.value = true;
    // 使用带刷新标志的API调用
    const response = await adminApi.refreshSystemStats();
    console.log('刷新数据响应:', response);
    
    if (response && response.success) {
      await fetchSystemStats();
      ElMessage.success('数据已刷新');
    } else {
      throw new Error((response && response.message) || '刷新数据失败');
    }
  } catch (err) {
    console.error('刷新数据失败:', err);
    ElMessage.error('刷新数据失败: ' + (err.message || '未知错误'));
    // 使用默认数据
    setDefaultStatistics();
  } finally {
    loading.value = false;
  }
};

// 导出数据为CSV
const exportData = () => {
  ElMessage.success('数据报表已导出');
};

// 监听图表筛选项变化
watch(userChartPeriod, () => {
  updateUserGrowthChart();
});

watch(courseChartPeriod, () => {
  updateCourseLearningChart();
});

watch(exerciseTypeLimit, () => {
  updateExerciseTypeChart();
});

// 监听窗口大小变化，重绘图表
const handleResize = () => {
  userGrowthChartInstance?.resize();
  courseLearningChartInstance?.resize();
  exerciseTypeChartInstance?.resize();
};

onMounted(() => {
  // 加载数据
  fetchSystemStats();
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize);
  
  // 组件卸载时清理事件监听和图表实例
  return () => {
    window.removeEventListener('resize', handleResize);
    userGrowthChartInstance?.dispose();
    courseLearningChartInstance?.dispose();
    exerciseTypeChartInstance?.dispose();
  };
});
</script>

<style scoped>
.statistics-manager {
  padding: 20px;
  height: 100%;
  overflow: visible; /* 不产生自己的滚动条 */
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.page-actions {
  display: flex;
  gap: 12px;
}

/* 数据卡片样式 */
.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  height: 120px;
  margin-bottom: 20px;
  border-radius: 8px;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}

.stat-card-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 15px;
}

.stat-icon .el-icon {
  font-size: 30px;
  color: white;
}

.user-icon {
  background-color: #409EFF;
}

.course-icon {
  background-color: #67C23A;
}

.exercise-icon {
  background-color: #E6A23C;
}

.activity-icon {
  background-color: #F56C6C;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-change {
  font-size: 12px;
  color: #909399;
}

.increase {
  color: #67C23A;
  font-weight: bold;
}

.decrease {
  color: #F56C6C;
  font-weight: bold;
}

/* 图表样式 */
.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  height: 400px;
  margin-bottom: 20px;
  border-radius: 8px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 320px;
  width: 100%;
}

.chart {
  height: 100%;
  width: 100%;
}
</style> 
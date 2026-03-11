<template>
  <div class="exercise-list-container">
    <div class="header-actions">
      <h1 class="page-title">练习题库</h1>
      <div class="action-buttons">
        <button @click="forceRefreshData" class="refresh-btn">
          <i class="fas fa-sync"></i> 刷新数据
        </button>
        <router-link to="/exercise-history" class="history-btn">
          <i class="fas fa-history"></i> 历史记录
        </router-link>
      </div>
    </div>

    <div class="filters">
      <div class="filter-group">
        <label>分类：</label>
        <select v-model="selectedCategory" @change="filterExercises">
          <option value="">全部</option>
          <option value="javascript">JavaScript</option>
          <option value="framework">前端框架</option>
          <option value="html_css">HTML/CSS</option>
        </select>
      </div>

      <div class="filter-group">
        <label>类型：</label>
        <select v-model="selectedType" @change="filterExercises">
          <option value="">全部</option>
          <option value="single-choice">单选题</option>
          <option value="multiple-choice">多选题</option>
          <option value="true-false">判断题</option>
          <option value="short-answer">简答题</option>
          <option value="code-completion">代码补全</option>
          <option value="interview">面试题</option>
        </select>
      </div>

      <div class="filter-group">
        <label>状态：</label>
        <select v-model="selectedStatus" @change="filterExercises">
          <option value="">全部</option>
          <option value="completed">已完成</option>
          <option value="uncompleted">未完成</option>
          <option value="correct">已答对</option>
          <option value="wrong">已答错</option>
        </select>
      </div>

      <div class="search-group">
        <input type="text" v-model="searchKeyword" @input="onSearchInput" placeholder="搜索题目...">
        <button @click="filterExercises">搜索</button>
      </div>
    </div>

    <div class="exercise-stats">
      <div class="stat-item">
        <span class="stat-value">{{ exercises.length }}</span>
        <span class="stat-label">题目数量</span>
      </div>
      <div class="stat-item" v-if="selectedCategory">
        <span class="stat-value">{{ categoryStats[selectedCategory] || 0 }}</span>
        <span class="stat-label">{{ getCategoryName(selectedCategory) }}题目</span>
      </div>
      <div class="stat-item" v-if="selectedType">
        <span class="stat-value">{{ typeStats[selectedType] || 0 }}</span>
        <span class="stat-label">{{ getTypeName(selectedType) }}</span>
      </div>
      <div class="stat-item" v-if="selectedStatus">
        <span class="stat-value">
          {{
            selectedStatus === 'uncompleted' ? (exercises.length - completedCount) :
              selectedStatus === 'correct' ? correctCount :
                selectedStatus === 'wrong' ? wrongCount :
                  completedCount
          }}
        </span>
        <span class="stat-label">
          {{
            selectedStatus === 'uncompleted' ? '未完成题目' :
              selectedStatus === 'correct' ? '已答对题目' :
                selectedStatus === 'wrong' ? '已答错题目' :
                  '已完成题目'
          }}
        </span>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="filteredExercises.length === 0" class="no-exercises">
      <p>没有找到符合条件的题目</p>
    </div>

    <div v-else class="exercise-grid">
      <div v-for="exercise in paginatedExercises" :key="exercise._id" class="exercise-card" :class="{
        'completed': isExerciseCompleted(exercise._id),
        'wrong': isExerciseCompleted(exercise._id) && !isExerciseCorrect(exercise._id)
      }" @click="goToExercise(exercise)">
        <div class="exercise-card-header">
          <span class="exercise-type" :class="exercise.type">{{ getTypeName(exercise.type) }}</span>
          <span v-if="isExerciseCompleted(exercise._id)" class="completion-status"
            :class="{ 'correct': isExerciseCorrect(exercise._id), 'wrong': !isExerciseCorrect(exercise._id) }">
            {{ isExerciseCorrect(exercise._id) ? '已答对' : '已答错' }}
          </span>
        </div>
        <h3 class="exercise-title">{{ exercise.title }}</h3>
        <p class="exercise-category">{{ getCategoryName(exercise.category) }}</p>
        <p class="exercise-knowledge-point">知识点: {{ exercise.knowledgePoint }}</p>
        <div class="exercise-action">
          <button class="btn-practice">
            {{ isExerciseCompleted(exercise._id) ? '再次练习' : '开始练习' }}
          </button>
        </div>
      </div>
    </div>

    <div class="pagination">
      <button :disabled="currentPage === 1" @click="changePage(currentPage - 1)" class="pagination-btn">
        上一页
      </button>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <button :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)" class="pagination-btn">
        下一页
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, onUnmounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getExercises } from '@/api/exercises.js';
import exercisesApi from '@/api/exercises.js';
import { ElMessage } from 'element-plus';

export default {
  name: 'ExerciseList',
  setup(props, { emit }) {
    const router = useRouter();
    const exercises = ref([]);
    const filteredExercises = ref([]);
    const loading = ref(true);
    const error = ref(null);

    // 筛选条件
    const selectedCategory = ref('');
    const selectedType = ref('');
    const selectedStatus = ref('');
    const searchKeyword = ref('');

    // 分页
    const currentPage = ref(1);
    const pageSize = ref(24);
    const totalPages = computed(() => {
      return Math.ceil(filteredExercises.value.length / pageSize.value);
    });

    // 统计数据
    const categoryStats = ref({});
    const typeStats = ref({});

    // 完成状态数据
    const completedExercises = ref({});
    const completedCount = computed(() => {
      // 只计算当前exercises列表中已完成的题目数量
      return exercises.value.filter(exercise => isExerciseCompleted(exercise._id)).length;
    });

    // 计算已答对题目数量
    const correctCount = computed(() => {
      return exercises.value.filter(exercise => isExerciseCorrect(exercise._id)).length;
    });

    // 计算已答错题目数量
    const wrongCount = computed(() => {
      return exercises.value.filter(exercise =>
        isExerciseCompleted(exercise._id) && !isExerciseCorrect(exercise._id)
      ).length;
    });

    // 从服务器加载已完成的题目
    const loadCompletedExercises = async () => {
      try {
        console.log('从服务器加载已完成的题目');

        // 添加时间戳参数，防止浏览器缓存
        const timestamp = new Date().getTime();

        // 获取用户练习历史记录
        const historyResponse = await exercisesApi.getUserExerciseHistory({
          _t: timestamp // 添加时间戳参数，防止缓存
        });
        console.log('历史记录API返回:', historyResponse);

        // 获取用户练习统计数据
        const statsResponse = await exercisesApi.getUserExerciseStats({
          _t: timestamp // 添加时间戳参数，防止缓存
        });
        console.log('统计数据API返回:', statsResponse);

        // 处理历史记录数据
        if (historyResponse && historyResponse.data) {
          // 将API返回的数据转换为与原本格式兼容的对象
          const completedMap = {};

          const historyData = Array.isArray(historyResponse.data) ? historyResponse.data : historyResponse.data.data;

          if (Array.isArray(historyData)) {
            historyData.forEach(record => {
              const exerciseId = record.exerciseId || (record.exercise && record.exercise._id);
              if (exerciseId) {
                completedMap[exerciseId] = {
                  completed: true,
                  isCorrect: record.isCorrect,
                  timestamp: record.timestamp || record.createdAt || new Date().toISOString(),
                  userAnswer: record.userAnswer
                };
              }
            });

            completedExercises.value = completedMap;
            console.log(`已加载${Object.keys(completedExercises.value).length}道已完成的题目`);

            // 强制重新计算统计数据
            calculateStats();
          } else {
            console.warn('历史记录数据不是数组:', historyData);
            completedExercises.value = {};
          }
        } else {
          console.warn('获取练习历史数据格式不正确:', historyResponse);
          completedExercises.value = {};
        }
      } catch (error) {
        console.error('加载已完成题目数据失败:', error);
        completedExercises.value = {};
      }
    };

    // 添加练习更新事件监听器
    const handleExerciseUpdate = async (event) => {
      console.log('检测到练习更新事件，详情:', event.detail);
      console.log('开始重新加载练习数据...');

      try {
        // 生成唯一的时间戳
        const timestamp = new Date().getTime();

        // 先获取统计数据，强制后端重新计算
        await exercisesApi.getUserExerciseStats({
          _t: timestamp,
          forceRefresh: true
        });

        console.log('统计数据已强制刷新');

        // 重新加载已完成的题目数据
        await loadCompletedExercises();
        console.log('已完成题目数据已更新');

        // 重新应用筛选
        filterExercises();

        // 更新完成后，强制更新UI
        nextTick(() => {
          console.log('数据刷新完成，已完成题目数量:', completedCount.value);
        });
      } catch (error) {
        console.error('更新练习数据失败:', error);
      }
    };

    // 检查题目是否已完成
    const isExerciseCompleted = (exerciseId) => {
      return completedExercises.value[exerciseId]?.completed === true;
    };

    // 检查题目是否答对
    const isExerciseCorrect = (exerciseId) => {
      return completedExercises.value[exerciseId]?.isCorrect === true;
    };

    // 从URL参数获取筛选条件
    const initFiltersFromUrl = () => {
      const urlParams = new URLSearchParams(window.location.search);

      // 获取URL中的筛选参数
      const category = urlParams.get('category');
      const type = urlParams.get('type');
      const status = urlParams.get('status');
      const search = urlParams.get('search');

      // 设置筛选条件
      if (category) selectedCategory.value = category;
      if (type) selectedType.value = type;
      if (status) selectedStatus.value = status;
      if (search) searchKeyword.value = search;

      console.log('从URL初始化筛选条件:', {
        category: selectedCategory.value,
        type: selectedType.value,
        status: selectedStatus.value,
        search: searchKeyword.value
      });
    };

    const fetchExercises = async () => {
      loading.value = true;
      try {
        // 准备查询参数
        const params = {};

        if (selectedCategory.value) {
          params.category = selectedCategory.value;
        }

        if (selectedType.value) {
          params.type = selectedType.value;
        }

        if (searchKeyword.value && searchKeyword.value.trim() !== '') {
          params.search = searchKeyword.value.trim();
        }

        // 添加时间戳参数，防止浏览器缓存
        params._t = new Date().getTime();

        console.log('正在请求练习题数据，参数:', params);

        // 尝试从API获取数据
        try {
          const response = await getExercises(params);
          console.log('获取练习题返回数据:', response);

          if (response && response.data && Array.isArray(response.data)) {
            // 直接是数组形式
            exercises.value = response.data;
            console.log(`成功获取${exercises.value.length}道题目，直接数组形式`);
          } else if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
            // 嵌套在data.data中的数组
            exercises.value = response.data.data;
            console.log(`成功获取${exercises.value.length}道题目，位于response.data.data中`);

            // 更新总数信息
            if (response.data.total) {
              console.log(`后端总共有${response.data.total}道题目`);
            }
          } else {
            console.error('响应数据结构不符合预期:', response);
            console.error('JSON字符串:', JSON.stringify(response));
            throw new Error('响应数据结构不符合预期');
          }

          // 重新加载已完成题目的状态
          await loadCompletedExercises();

          // 应用筛选
          filterExercises();
          calculateStats();
        } catch (apiError) {
          console.error('API请求失败，使用模拟数据:', apiError);
          console.error('详细错误信息:', apiError.stack);

          // 使用模拟数据
          useMockData();

          // 应用筛选
          filterExercises();
          calculateStats();
        }
      } catch (error) {
        console.error('获取练习题失败:', error);
        error.value = '加载练习题失败，请稍后重试';
      } finally {
        loading.value = false;
      }
    };

    const filterExercises = () => {
      // 重置页码
      currentPage.value = 1;

      // 应用筛选条件
      let result = [...exercises.value];

      // 按分类筛选
      if (selectedCategory.value) {
        result = result.filter(exercise => exercise.category === selectedCategory.value);
      }

      // 按类型筛选
      if (selectedType.value) {
        result = result.filter(exercise => exercise.type === selectedType.value);
      }

      // 按状态筛选
      if (selectedStatus.value) {
        switch (selectedStatus.value) {
          case 'completed':
            result = result.filter(exercise => isExerciseCompleted(exercise._id));
            break;
          case 'uncompleted':
            result = result.filter(exercise => !isExerciseCompleted(exercise._id));
            break;
          case 'correct':
            result = result.filter(exercise => isExerciseCorrect(exercise._id));
            break;
          case 'wrong':
            result = result.filter(exercise => isExerciseCompleted(exercise._id) && !isExerciseCorrect(exercise._id));
            break;
        }
      }

      // 按关键词搜索
      if (searchKeyword.value && searchKeyword.value.trim() !== '') {
        const keyword = searchKeyword.value.trim().toLowerCase();
        result = result.filter(exercise =>
          (exercise.title && exercise.title.toLowerCase().includes(keyword)) ||
          (exercise.knowledgePoint && exercise.knowledgePoint.toLowerCase().includes(keyword)) ||
          (exercise.category && exercise.category.toLowerCase().includes(keyword))
        );
      }

      filteredExercises.value = result;
      console.log(`筛选后题目数量: ${filteredExercises.value.length}, 状态: ${selectedStatus.value}`);

      // 更新URL参数
      updateUrlParams();
    };

    const calculateStats = () => {
      // 重置统计数据
      categoryStats.value = {};
      typeStats.value = {};

      // 计算分类统计
      exercises.value.forEach(exercise => {
        // 按分类统计
        if (exercise.category) {
          if (!categoryStats.value[exercise.category]) {
            categoryStats.value[exercise.category] = 0;
          }
          categoryStats.value[exercise.category]++;
        }

        // 按类型统计
        if (exercise.type) {
          if (!typeStats.value[exercise.type]) {
            typeStats.value[exercise.type] = 0;
          }
          typeStats.value[exercise.type]++;
        }
      });

      console.log('统计数据已更新:', {
        categories: categoryStats.value,
        types: typeStats.value,
        completedCount: completedCount.value,
        totalExercises: exercises.value.length
      });
    };

    const changePage = (page) => {
      currentPage.value = page;
    };

    const goToExercise = (exercise) => {
      console.log('选择练习题，完整练习题对象:', exercise);

      // 确保练习题有ID，如果没有则生成一个临时ID
      let exerciseId = exercise._id;
      if (!exerciseId) {
        // 使用标题和类型创建一个临时ID
        exerciseId = `temp_${exercise.title ? exercise.title.substring(0, 10) : ''}_${Date.now()}`;
        console.log(`练习题没有ID，生成临时ID: ${exerciseId}`);
      }

      console.log('使用的练习题ID:', exerciseId);
      emit('select-exercise', exerciseId);
    };

    // 处理搜索框输入
    const onSearchInput = (e) => {
      if (e.target.value === '') {
        filterExercises();
      }
    };

    const paginatedExercises = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      return filteredExercises.value.slice(start, end);
    });

    const getCategoryName = (category) => {
      const categoryMap = {
        'javascript': 'JavaScript',
        'framework': '前端框架',
        'html_css': 'HTML/CSS',
        'html': 'HTML/CSS'
      };
      return categoryMap[category] || category;
    };

    const getTypeName = (type) => {
      const typeMap = {
        'single-choice': '单选题',
        'multiple-choice': '多选题',
        'true-false': '判断题',
        'short-answer': '简答题',
        'code-completion': '代码补全',
        'interview': '面试题'
      };
      return typeMap[type] || type;
    };

    const updateUrlParams = () => {
      const params = new URLSearchParams();
      if (selectedCategory.value) params.append('category', selectedCategory.value);
      if (selectedType.value) params.append('type', selectedType.value);
      if (selectedStatus.value) params.append('status', selectedStatus.value);
      if (searchKeyword.value && searchKeyword.value.trim() !== '') params.append('search', searchKeyword.value.trim());
      router.push({ query: params });
    };

    // 使用模拟数据
    const useMockData = () => {
      console.log('使用模拟数据');
      exercises.value = [
        {
          _id: 'mock1',
          title: 'JavaScript中如何添加事件监听器？',
          type: 'single-choice',
          content: '以下哪种方法可以为HTML元素添加事件监听器？',
          options: [
            { id: 'A', text: 'element.addEventListener(event, function)' },
            { id: 'B', text: 'element.attachEvent(event, function)' },
            { id: 'C', text: 'element.addEvent(event, function)' },
            { id: 'D', text: 'element.listenTo(event, function)' }
          ],
          answer: 'A',
          explanation: 'addEventListener是标准的DOM方法，用于为元素添加事件监听器。',
          difficulty: 'easy',
          category: 'javascript',
          knowledgePoint: 'DOM事件'
        },
        {
          _id: 'mock2',
          title: 'typeof null的返回值是什么？',
          type: 'single-choice',
          content: '在JavaScript中，执行typeof null会返回什么值？',
          options: [
            { id: 'A', text: 'null' },
            { id: 'B', text: 'undefined' },
            { id: 'C', text: 'object' },
            { id: 'D', text: 'string' }
          ],
          answer: 'C',
          explanation: '这是JavaScript的一个历史遗留问题，typeof null返回"object"，尽管null本身不是对象。',
          difficulty: 'medium',
          category: 'javascript',
          knowledgePoint: '数据类型'
        },
        {
          _id: 'mock3',
          title: 'CSS选择器优先级',
          type: 'multiple-choice',
          content: '以下哪些CSS选择器的优先级比简单类选择器(.class)高？',
          options: [
            { id: 'A', text: 'ID选择器(#id)' },
            { id: 'B', text: '元素选择器(div)' },
            { id: 'C', text: '行内样式(style="")' },
            { id: 'D', text: '伪类选择器(:hover)' }
          ],
          answer: ['A', 'C'],
          explanation: 'CSS选择器优先级从高到低为：!important > 行内样式 > ID选择器 > 类选择器 > 标签选择器',
          difficulty: 'medium',
          category: 'html_css',
          knowledgePoint: 'CSS选择器'
        },
        {
          _id: 'mock4',
          title: 'React状态更新',
          type: 'true-false',
          content: 'React中，setState操作总是立即更新组件状态。',
          answer: false,
          explanation: 'setState是异步的，React会批量处理状态更新以提高性能。如果需要立即使用更新后的状态，应该使用回调函数。',
          difficulty: 'medium',
          category: 'framework',
          knowledgePoint: 'React状态管理'
        },
        {
          _id: 'mock5',
          title: '闭包概念',
          type: 'short-answer',
          content: '简要解释JavaScript中闭包的概念及其常见用途。',
          answer: '闭包是指函数能够记住并访问其词法作用域，即使该函数在其词法作用域之外执行。常见用途包括：数据封装、模块化模式、创建私有变量等。',
          explanation: '闭包是JavaScript中强大的特性，允许函数创建一个私有"作用域"，保存数据不被外部访问。',
          difficulty: 'hard',
          category: 'javascript',
          knowledgePoint: '闭包'
        },
        // 添加更多模拟数据来测试分页
        {
          _id: 'mock6',
          title: 'Vue组件渲染指令',
          type: 'single-choice',
          content: '在Vue中，哪个指令用于条件性地渲染元素？',
          options: [
            { id: 'A', text: 'v-if' },
            { id: 'B', text: 'v-for' },
            { id: 'C', text: 'v-show' },
            { id: 'D', text: 'v-render' }
          ],
          answer: 'A',
          explanation: 'v-if指令用于条件性地渲染元素，只有当指令的表达式返回truthy值时才会渲染元素。',
          difficulty: 'easy',
          category: 'framework',
          knowledgePoint: 'Vue基础'
        },
        {
          _id: 'mock7',
          title: 'Vue循环渲染指令',
          type: 'single-choice',
          content: '在Vue中，哪个指令用于循环渲染元素？',
          options: [
            { id: 'A', text: 'v-if' },
            { id: 'B', text: 'v-for' },
            { id: 'C', text: 'v-show' },
            { id: 'D', text: 'v-repeat' }
          ],
          answer: 'B',
          explanation: 'v-for指令用于循环渲染元素，可以遍历数组或对象。',
          difficulty: 'easy',
          category: 'framework',
          knowledgePoint: 'Vue基础'
        },
        {
          _id: 'mock8',
          title: 'Vue事件绑定指令',
          type: 'single-choice',
          content: '在Vue中，哪个指令用于绑定事件？',
          options: [
            { id: 'A', text: 'v-on' },
            { id: 'B', text: 'v-bind' },
            { id: 'C', text: 'v-event' },
            { id: 'D', text: 'v-click' }
          ],
          answer: 'A',
          explanation: 'v-on指令用于绑定事件，简写形式是@符号。',
          difficulty: 'easy',
          category: 'framework',
          knowledgePoint: 'Vue基础'
        }
      ];

      // 模拟更多数据，添加70个未完成题目
      // 如果检测到状态为"未完成"，则创建足够的模拟数据
      if (selectedStatus.value === 'uncompleted') {
        console.log("检测到未完成状态，添加更多模拟数据");
        for (let i = 9; i <= 79; i++) {
          exercises.value.push({
            _id: `mock${i}`,
            title: `模拟题目 ${i}`,
            type: 'single-choice',
            content: `这是模拟题目内容 ${i}`,
            options: [
              { id: 'A', text: '选项A' },
              { id: 'B', text: '选项B' },
              { id: 'C', text: '选项C' },
              { id: 'D', text: '选项D' }
            ],
            answer: 'A',
            explanation: '这是模拟题目的解释',
            difficulty: 'easy',
            category: 'javascript',
            knowledgePoint: '模拟知识点'
          });
        }
      }
    };

    // 强制刷新数据
    const forceRefreshData = async () => {
      console.log('手动强制刷新数据');
      loading.value = true;

      try {
        // 清空缓存数据
        completedExercises.value = {};

        // 生成唯一的时间戳
        const timestamp = new Date().getTime();

        // 先获取统计数据，强制后端重新计算
        await exercisesApi.getUserExerciseStats({
          _t: timestamp,
          forceRefresh: true
        });

        // 重新加载已完成题目数据
        await loadCompletedExercises();

        // 重新获取练习题数据
        await fetchExercises();

        console.log('数据刷新完成，已完成题目数量:', completedCount.value);

        // 显示刷新成功提示
        ElMessage({
          message: `数据已刷新，当前已完成${completedCount.value}道题目`,
          type: 'success',
          duration: 2000
        });
      } catch (error) {
        console.error('强制刷新数据失败:', error);
        ElMessage.error('刷新数据失败，请稍后重试');
      } finally {
        loading.value = false;
      }
    };

    // 自动刷新数据的函数
    const autoRefreshData = () => {
      console.log('自动刷新数据');
      forceRefreshData();
    };

    onMounted(async () => {
      // 初始化筛选条件
      initFiltersFromUrl();

      // 加载已完成的题目
      await loadCompletedExercises();

      // 获取练习题数据
      fetchExercises();

      // 监听状态变化
      watch(selectedStatus, (newStatus) => {
        console.log('状态变更为:', newStatus);
        if (newStatus === 'uncompleted') {
          // 如果状态变为未完成，重新获取数据
          fetchExercises();
        }
      });

      // 添加练习更新事件监听器
      window.addEventListener('exercise-updated', handleExerciseUpdate);

      // 添加路由变化监听，确保每次进入页面都刷新数据
      watch(() => router.currentRoute.value.path, (newPath, oldPath) => {
        if (newPath === '/practice' && oldPath !== '/practice') {
          console.log('检测到路由变化，重新加载数据');
          forceRefreshData();
        }
      });

      // 自动刷新数据
      setTimeout(autoRefreshData, 500);
    });

    // 组件卸载时移除事件监听器
    onUnmounted(() => {
      window.removeEventListener('exercise-updated', handleExerciseUpdate);
    });

    return {
      exercises,
      filteredExercises,
      loading,
      error,
      selectedCategory,
      selectedType,
      selectedStatus,
      searchKeyword,
      currentPage,
      totalPages,
      categoryStats,
      typeStats,
      completedCount,
      correctCount,
      wrongCount,
      isExerciseCompleted,
      isExerciseCorrect,
      filterExercises,
      changePage,
      goToExercise,
      getCategoryName,
      getTypeName,
      paginatedExercises,
      onSearchInput,
      useMockData,
      forceRefreshData
    };
  },
  emits: ['select-exercise']
}
</script>

<style scoped>
.exercise-list-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 28px;
  color: #333;
  margin: 0;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.refresh-btn,
.history-btn {
  padding: 10px 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
  color: #666;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: all 0.3s;
  border: none;
  cursor: pointer;
}

.refresh-btn:hover,
.history-btn:hover {
  background-color: #e6ebf5;
  color: #409eff;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
  background-color: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-size: 14px;
  color: #666;
}

.filter-group select {
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  color: #333;
  background-color: white;
  min-width: 120px;
}

.search-group {
  display: flex;
  gap: 8px;
  flex: 1;
}

.search-group input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
}

.search-group button {
  padding: 8px 16px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.search-group button:hover {
  background-color: #66b1ff;
}

.exercise-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.exercise-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.exercise-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  padding: 16px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.exercise-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px 0 rgba(0, 0, 0, 0.1);
}

.exercise-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.exercise-type {
  display: inline-block;
  padding: 4px 8px;
  background-color: #e6f7ff;
  color: #1890ff;
  border-radius: 4px;
  font-size: 12px;
}

.exercise-type.single-choice {
  background-color: #e6f7ff;
  color: #1890ff;
}

.exercise-type.multiple-choice {
  background-color: #f6ffed;
  color: #52c41a;
}

.exercise-type.true-false {
  background-color: #fff0f6;
  color: #eb2f96;
}

.exercise-type.short-answer {
  background-color: #f9f0ff;
  color: #722ed1;
}

.exercise-type.code-completion {
  background-color: #fcf4e6;
  color: #fa8c16;
}

.exercise-type.interview {
  background-color: #e6fffb;
  color: #13c2c2;
}

.exercise-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #333;
  line-height: 1.4;
  flex: 1;
}

.exercise-category {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.exercise-knowledge-point {
  font-size: 13px;
  color: #999;
  margin-bottom: 16px;
}

.exercise-action {
  margin-top: auto;
}

.btn-practice {
  width: 100%;
  padding: 8px 0;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-practice:hover {
  background-color: #66b1ff;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.pagination-btn {
  padding: 8px 16px;
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #ecf5ff;
  color: #409eff;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #666;
}

.loading,
.no-exercises {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #666;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #409eff;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.completion-status {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.completion-status.correct {
  background-color: #67C23A;
  color: white;
}

.completion-status.wrong {
  background-color: #F56C6C;
  color: white;
}

.exercise-card.completed {
  border-left: 4px solid #67C23A;
}

.exercise-card.completed.wrong {
  border-left: 4px solid #F56C6C;
}
</style>
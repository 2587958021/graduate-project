<template>
  <div class="course-manager-page">
    <div class="page-header">
      <h1 class="page-title">课程管理</h1>
      <div class="page-actions">
        <el-tooltip content="添加B站视频链接，系统将自动创建课程和章节" placement="bottom" effect="light">
          <el-button type="primary" @click="showQuickCreateDialog">
            <el-icon>
              <Plus />
            </el-icon>
            添加B站链接
          </el-button>
        </el-tooltip>
        <el-button type="info" @click="openHistoryDrawer">
          <el-icon>
            <Timer />
          </el-icon>
          删除历史
        </el-button>
      </div>
    </div>

    <div class="filter-section">
      <el-row :gutter="16" class="filter-row">
        <el-col :span="6">
          <el-select v-model="filters.category" placeholder="按分类筛选" clearable @change="handleFilterChange"
            class="filter-select">
            <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-col>
        <el-col :span="5">
          <el-select v-model="filters.published" placeholder="按状态筛选" clearable @change="handleFilterChange"
            class="filter-select">
            <el-option label="已发布" :value="true" />
            <el-option label="未发布" :value="false" />
          </el-select>
        </el-col>
        <el-col :span="9">
          <div class="search-wrapper">
            <el-input v-model="filters.search" placeholder="搜索课程名称" clearable @input="debounceFilterChange"
              @clear="handleFilterChange" class="search-input">
              <template #suffix>
                <el-icon class="search-icon">
                  <Search />
                </el-icon>
              </template>
            </el-input>
          </div>
        </el-col>
        <el-col :span="4" class="reset-col">
          <el-button @click="resetFilters" type="info" plain>
            <el-icon>
              <Refresh />
            </el-icon>
            重置
          </el-button>
        </el-col>
      </el-row>
    </div>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>

    <div v-else-if="error" class="error-container">
      <el-empty description="加载失败" :image-size="200">
        <template #description>
          <p>{{ error }}</p>
        </template>
        <el-button type="primary" @click="fetchCourses">重试</el-button>
      </el-empty>
    </div>

    <div class="batch-actions" v-if="selectedCourses.length > 0">
      <el-alert type="info" :title="`已选择 ${selectedCourses.length} 项`" show-icon :closable="false">
        <template #default>
          <div class="batch-actions-buttons">
            <el-button size="small" type="danger" @click="confirmBatchDelete">批量删除</el-button>
            <el-button size="small" @click="clearSelection">取消选择</el-button>
          </div>
        </template>
      </el-alert>
    </div>

    <!-- 撤销删除提示 -->
    <div class="undo-notification" v-if="showUndoAlert">
      <el-alert type="warning" :title="deletedCourses.length > 1 ? `已删除 ${deletedCourses.length} 门课程` : '已删除课程'"
        show-icon :closable="true" @close="showUndoAlert = false">
        <template #default>
          <div class="undo-actions">
            <span class="undo-tip">可撤销操作（删除历史永久保存）</span>
            <el-button size="small" type="primary" @click="undoDelete">
              <el-icon>
                <Back />
              </el-icon>
              撤销删除
            </el-button>
          </div>
        </template>
      </el-alert>
    </div>

    <el-table v-else :data="courses" stripe style="width: 100%" border v-loading="tableLoading"
      @selection-change="handleSelectionChange" ref="courseTable">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column prop="title" label="课程名称" min-width="200">
        <template #default="{ row }">
          <span class="course-title">{{ row.title }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="category" label="分类" width="120">
        <template #default="{ row }">
          <el-tag :type="getCategoryTagType(row.category)">
            {{ getCategoryLabel(row.category) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="level" label="难度" width="100">
        <template #default="{ row }">
          <el-tag :type="getLevelTagType(row.level)" size="small">{{ row.level }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="isPublished" label="状态" width="150">
        <template #default="{ row }">
          <div class="status-container">
            <el-tag type="success" v-if="row.isPublished">已发布</el-tag>
            <el-tag type="danger" v-else>未发布</el-tag>
            <span class="status-time" v-if="row.publishedAt && row.isPublished">
              {{ formatDate(row.publishedAt) }}
            </span>
            <span class="status-hint" v-if="!row.isPublished">
              需要重新发布
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="150">
        <template #default="{ row }">
          {{ formatDate(row.createdAt, true) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="160">
        <template #default="{ row }">
          <div class="action-buttons">
            <el-button size="small" :type="row.isPublished ? 'warning' : 'success'" plain
              @click="row.isPublished ? unpublishCourse(row) : publishCourse(row)" class="action-btn">
              <el-icon>
                <component :is="row.isPublished ? 'Download' : 'Upload'" />
              </el-icon>
              {{ row.isPublished ? '取消发布' : '发布课程' }}
            </el-button>

            <el-button size="small" type="danger" plain @click="confirmDelete(row)" class="action-btn">
              <el-icon>
                <Delete />
              </el-icon>
              删除
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container" v-if="totalPages > 1">
      <el-pagination v-model="currentPage" :page-size="pageSize" :total="total"
        layout="total, prev, pager, next, jumper" @current-change="handlePageChange" />
    </div>

    <!-- 删除历史抽屉 -->
    <el-drawer v-model="historyDrawerVisible" direction="rtl" size="60%">
      <template #header>
        <div class="history-drawer-header">
          <h3>课程删除历史</h3>
          <div class="history-actions">
            <span v-if="selectedHistoryItems.length > 0" class="selected-count">
              已选择 {{ selectedHistoryItems.length }} 项
            </span>
            <el-button v-if="selectedHistoryItems.length > 0" type="primary" size="small"
              @click="batchRestoreFromHistory">
              批量恢复
            </el-button>
            <el-button v-if="selectedHistoryItems.length > 0" type="danger" size="small"
              @click="batchDeleteFromHistory">
              批量删除
            </el-button>
          </div>
        </div>
      </template>

      <div class="history-content">
        <div v-if="historyLoading" class="loading-container">
          <el-skeleton :rows="10" animated />
        </div>

        <div v-else-if="deletionHistory.length === 0" class="empty-history">
          <el-empty description="暂无删除历史记录" />
        </div>

        <el-table v-else :data="deletionHistory" border stripe style="width: 100%"
          @selection-change="handleHistorySelectionChange">
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="课程" min-width="240">
            <template #default="{ row }">
              <div class="history-course-info">
                <span>{{ row.course.title }}</span>
                <el-tag size="small" type="info" class="category-tag">
                  {{ getCategoryLabel(row.course.category) }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="删除时间" width="200">
            <template #default="{ row }">
              <div class="time-info">
                <span>{{ row.timeString }}</span>
                <span class="time-ago">{{ formatTimeAgo(row.timestamp) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button size="small" type="primary" plain @click="restoreFromHistory(row)" :loading="historyLoading">
                  恢复
                </el-button>
                <el-button size="small" type="danger" plain @click="deleteFromHistory(row.id)">
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>

    <!-- 快速创建课程对话框 -->
    <el-dialog v-model="quickCreateDialogVisible" title="快速创建课程" width="500px" @close="resetQuickForm">
      <el-form ref="quickFormRef" :model="quickForm" :rules="quickFormRules" label-width="100px" label-position="top">
        <el-form-item label="B站视频链接" prop="videoUrl">
          <el-input v-model="quickForm.videoUrl" placeholder="输入B站视频链接" clearable />
          <div class="form-item-tip">
            支持B站视频链接格式: https://www.bilibili.com/video/BVxxxxx 或 https://b23.tv/xxxxxx
          </div>
        </el-form-item>

        <el-form-item label="立即发布">
          <el-switch v-model="quickForm.isPublished" />
          <div class="form-item-tip">
            开启后，创建完成的课程将立即发布并显示在前台
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="quickCreateDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleQuickCreate" :loading="quickCreating">
            创建课程
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  Plus,
  Delete,
  Upload,
  Download,
  Search,
  Refresh,
  Back,
  Timer,
  Check,
  Close,
  Loading,
  Picture
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getAllCourses,
  updateCourse,
  deleteCourse,
  quickCreateCourse
} from '@/api/courses.js';
import axios from 'axios';
import { formatDate as formatDateUtil } from '@/utils/dateUtils.js';
import _ from 'lodash';

// 使用setup函数包装整个组件逻辑
export default {
  setup() {
    const router = useRouter();

    // 状态变量
    const courses = ref([]);
    const loading = ref(true);
    const tableLoading = ref(false);
    const error = ref(null);
    const currentPage = ref(1);
    const pageSize = ref(20);
    const total = ref(0);
    const totalPages = ref(0);

    // 表格引用
    const courseTable = ref(null);
    const selectedCourses = ref([]);

    // 删除撤销相关
    const deletedCourses = ref([]);  // 存储被删除的课程
    const showUndoAlert = ref(false);  // 控制撤销提示的显示
    const undoTimeout = ref(null);     // 撤销计时器

    // 删除历史相关
    const historyDrawerVisible = ref(false);  // 控制历史抽屉的显示
    const deletionHistory = ref([]);          // 存储所有删除历史
    const historyLoading = ref(false);        // 历史记录加载状态
    const selectedHistoryItems = ref([]);     // 选中的历史记录项

    // 快速创建课程对话框
    const quickCreateDialogVisible = ref(false);
    const quickFormRef = ref(null);
    const quickCreating = ref(false);

    const quickForm = reactive({
      videoUrl: '',
      coverImage: '',
      title: '',
      category: '其他',
      level: '初级',
      isPublished: false
    });

    // 表单验证规则
    const quickFormRules = {
      videoUrl: [
        { required: true, message: '请输入B站视频链接', trigger: 'blur' },
        {
          pattern: /bilibili\.com\/video\/[A-Za-z0-9]+|b23\.tv/i,
          message: '请输入有效的B站视频链接',
          trigger: 'blur'
        }
      ]
    };

    // 筛选选项
    const categoryOptions = [
      { label: 'HTML/CSS', value: 'html_css' },
      { label: 'JavaScript', value: 'javascript' },
      { label: 'TypeScript', value: 'typescript' },
      { label: 'Vue', value: 'vue' },
      { label: 'React', value: 'react' },
      { label: 'uni-app', value: 'uni-app' },
      { label: '其他', value: '其他' }
    ];
    const levels = ['初级', '中级', '高级'];

    // 筛选条件
    const filters = reactive({
      category: '',
      published: '',
      search: ''
    });

    // 简单的防抖函数
    let searchTimeout = null;
    const debounceFilterChange = () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      searchTimeout = setTimeout(() => {
        console.log('防抖后执行查询');
        handleFilterChange();
      }, 300);
    };

    // 获取课程列表
    const fetchCourses = async () => {
      loading.value = true;
      error.value = null;

      try {
        const params = {
          page: currentPage.value,
          limit: pageSize.value
        };

        if (filters.category) params.category = filters.category;
        if (filters.published !== '') params.isPublished = filters.published;
        if (filters.search) params.search = filters.search;

        console.log('获取课程列表，请求参数:', params);

        const response = await getAllCourses(params);

        console.log('原始API响应:', response);

        // 检查响应格式并适配
        if (response && response.data) {
          console.log('获取课程响应:', response.data);

          // 检查数据结构
          if (Array.isArray(response.data)) {
            // 直接是数组格式
            courses.value = response.data;
            total.value = response.data.length;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            // 标准分页格式
            courses.value = response.data.data;
            total.value = response.data.total || response.data.count || response.data.data.length;
          } else if (response.success && Array.isArray(response.data)) {
            // 另一种格式
            courses.value = response.data;
            total.value = response.total || response.count || response.data.length;
          } else {
            // 尝试直接使用response
            courses.value = Array.isArray(response) ? response : [];
            total.value = courses.value.length;
            console.warn('无法识别的响应格式，尝试直接使用response');
          }

          totalPages.value = Math.ceil(total.value / pageSize.value) || 1;

          console.log('处理后的课程数据:', courses.value);
          console.log('总数:', total.value, '总页数:', totalPages.value);
        } else {
          throw new Error('API返回数据格式不正确');
        }

        if (courses.value.length === 0 && total.value > 0 && currentPage.value > 1) {
          // 如果当前页没有数据但总数大于0，回到第一页
          currentPage.value = 1;
          fetchCourses();
        }
      } catch (err) {
        console.error('获取课程列表失败:', err);
        error.value = err.response?.data?.message || err.message || '获取课程列表失败';
        ElMessage.error(error.value);
        courses.value = []; // 确保设置为空数组而不是undefined
      } finally {
        loading.value = false;
      }
    };

    // 筛选处理
    const handleFilterChange = () => {
      console.log('执行筛选，分类:', filters.category, '状态:', filters.published, '搜索文本:', filters.search);
      currentPage.value = 1;
      fetchCourses();
    };

    // 重置筛选条件
    const resetFilters = () => {
      filters.category = '';
      filters.published = '';
      filters.search = '';
      currentPage.value = 1;
      fetchCourses();
      ElMessage.success('已重置筛选条件');
    };

    // 页面切换
    const handlePageChange = (page) => {
      currentPage.value = page;
      fetchCourses();
    };

    // 获取分类标签类型
    const getCategoryTagType = (category) => {
      const typeMap = {
        'html_css': '',
        'javascript': 'warning',
        'typescript': 'primary',
        'vue': 'success',
        'react': 'info',
        'uni-app': 'danger',
        '其他': ''
      };

      return typeMap[category] || '';
    };

    // 获取分类显示标签
    const getCategoryLabel = (category) => {
      const found = categoryOptions.find(item => item.value === category);
      return found ? found.label : category;
    };

    // 获取难度标签类型
    const getLevelTagType = (level) => {
      const typeMap = {
        '初级': 'info',
        '中级': 'warning',
        '高级': 'danger'
      };

      return typeMap[level] || '';
    };

    // 格式化日期
    const formatDate = (dateString, short = false) => {
      if (!dateString) return '';

      const date = new Date(dateString);

      if (short) {
        // 短格式: YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }

      // 完整格式
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // 发布课程
    const publishCourse = async (course) => {
      // 添加确认对话框
      ElMessageBox.confirm(
        `确定要发布课程"${course.title}"吗？发布后学生将可以访问此课程。`,
        '发布确认',
        {
          confirmButtonText: '确定发布',
          cancelButtonText: '返回',
          type: 'info'
        }
      )
        .then(async () => {
          tableLoading.value = true;

          try {
            await updateCourse(course._id, { isPublished: true });
            ElMessage.success('课程已发布');
            fetchCourses();
          } catch (err) {
            console.error('发布课程失败:', err);
            ElMessage.error(err.response?.data?.message || '发布课程失败');
          } finally {
            tableLoading.value = false;
          }
        })
        .catch(() => {
          // 用户取消操作
          ElMessage.info('已取消操作');
        });
    };

    // 取消发布课程
    const unpublishCourse = async (course) => {
      // 添加确认对话框
      ElMessageBox.confirm(
        `确定要取消发布课程"${course.title}"吗？取消发布后学生将无法访问此课程。`,
        '取消发布确认',
        {
          confirmButtonText: '确定取消发布',
          cancelButtonText: '返回',
          type: 'warning'
        }
      )
        .then(async () => {
          tableLoading.value = true;

          try {
            await updateCourse(course._id, { isPublished: false });
            ElMessage.success('课程已取消发布');
            fetchCourses();
          } catch (err) {
            console.error('取消发布课程失败:', err);
            ElMessage.error(err.response?.data?.message || '取消发布课程失败');
          } finally {
            tableLoading.value = false;
          }
        })
        .catch(() => {
          // 用户取消操作
          ElMessage.info('已取消操作');
        });
    };

    // 处理表格选择变化
    const handleSelectionChange = (selection) => {
      selectedCourses.value = selection;
      console.log('已选择课程:', selection);
    };

    // 清除所有选择
    const clearSelection = () => {
      if (courseTable.value) {
        courseTable.value.clearSelection();
      }
    };

    // 确认批量删除
    const confirmBatchDelete = () => {
      if (selectedCourses.value.length === 0) {
        ElMessage.warning('请先选择要删除的课程');
        return;
      }

      ElMessageBox.confirm(
        `确定要删除选中的 ${selectedCourses.value.length} 门课程吗？此操作不可逆！`,
        '批量删除确认',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
        .then(() => {
          batchDeleteCourses();
        })
        .catch(() => {
          // 用户取消删除
        });
    };

    // 执行批量删除
    const batchDeleteCourses = async () => {
      tableLoading.value = true;

      try {
        // 获取所有选中项的ID
        const idsToDelete = selectedCourses.value.map(item => item._id);
        console.log('要删除的ID列表:', idsToDelete);

        // 保存被删除的课程用于撤销
        deletedCourses.value = [...selectedCourses.value];

        // 使用Promise.all并行处理删除请求
        const deletePromises = idsToDelete.map(id => deleteCourse(id));

        await Promise.all(deletePromises);

        ElMessage.success(`已成功删除 ${idsToDelete.length} 门课程`);
        clearSelection(); // 清除选择
        fetchCourses(); // 重新加载数据

        // 显示撤销提示
        showUndoNotification(`已删除 ${idsToDelete.length} 门课程`);

        // 将删除的课程添加到历史记录
        saveToDeleteHistory();
      } catch (err) {
        console.error('批量删除失败:', err);
        ElMessage.error('批量删除失败，请重试');
      } finally {
        tableLoading.value = false;
      }
    };

    // 显示撤销通知
    const showUndoNotification = (message) => {
      // 清除之前的计时器
      if (undoTimeout.value) {
        clearTimeout(undoTimeout.value);
      }

      showUndoAlert.value = true;

      // 设置10秒后关闭提示，但不清空删除记录
      undoTimeout.value = setTimeout(() => {
        showUndoAlert.value = false;
      }, 10000);
    };

    // 撤销删除
    const undoDelete = async () => {
      if (deletedCourses.value.length === 0) {
        ElMessage.warning('没有可撤销的操作');
        return;
      }

      tableLoading.value = true;

      try {
        // 循环恢复删除的课程
        for (const course of deletedCourses.value) {
          // 需要移除_id字段以创建新记录
          const courseData = { ...course };
          delete courseData._id;

          // 使用API重新创建课程
          await updateCourse(course._id, courseData);
        }

        ElMessage.success(`已恢复 ${deletedCourses.value.length} 门课程`);

        // 清空暂存的删除课程
        deletedCourses.value = [];
        showUndoAlert.value = false;

        // 重新加载课程列表
        fetchCourses();
      } catch (err) {
        console.error('撤销删除失败:', err);
        ElMessage.error('撤销删除失败，请重试');
      } finally {
        tableLoading.value = false;
      }
    };

    // 保存删除记录到历史中
    const saveToDeleteHistory = () => {
      if (deletedCourses.value.length === 0) return;

      // 格式化时间
      const now = new Date();
      const timeString = now.toLocaleString();

      // 为每个删除的课程创建一个历史记录
      const historyItems = deletedCourses.value.map(course => ({
        id: Date.now() + Math.random().toString(36).substring(2, 10), // 生成唯一ID
        timestamp: now.getTime(),
        timeString,
        course: { ...course }
      }));

      // 保存到本地存储
      const existingHistory = JSON.parse(localStorage.getItem('courseDeletionHistory') || '[]');
      const updatedHistory = [...historyItems, ...existingHistory];

      // 本地存储
      localStorage.setItem('courseDeletionHistory', JSON.stringify(updatedHistory));

      // 更新当前状态
      deletionHistory.value = updatedHistory;
    };

    // 加载删除历史
    const loadDeletionHistory = () => {
      const savedHistory = localStorage.getItem('courseDeletionHistory');
      if (savedHistory) {
        deletionHistory.value = JSON.parse(savedHistory);
      }
    };

    // 打开历史抽屉
    const openHistoryDrawer = () => {
      loadDeletionHistory(); // 确保加载最新历史
      historyDrawerVisible.value = true;
    };

    // 清空选中的历史记录项
    const clearHistorySelection = () => {
      selectedHistoryItems.value = [];
    };

    // 处理历史记录选择变化
    const handleHistorySelectionChange = (selection) => {
      selectedHistoryItems.value = selection;
    };

    // 从历史记录中恢复课程
    const restoreFromHistory = async (historyItem) => {
      historyLoading.value = true;

      try {
        // 准备恢复的数据
        const courseData = { ...historyItem.course };
        delete courseData._id; // 移除ID以创建新记录

        await updateCourse(historyItem.course._id, courseData);

        ElMessage.success('课程恢复成功');

        // 从历史记录中移除
        removeFromHistory(historyItem.id);

        // 重新加载课程列表
        fetchCourses();
      } catch (err) {
        console.error('恢复课程失败:', err);
        ElMessage.error('恢复课程失败: ' + (err.message || '未知错误'));
      } finally {
        historyLoading.value = false;
      }
    };

    // 批量恢复课程
    const batchRestoreFromHistory = async () => {
      if (selectedHistoryItems.value.length === 0) {
        ElMessage.warning('请先选择要恢复的课程');
        return;
      }

      historyLoading.value = true;

      try {
        // 循环恢复选中的历史记录
        for (const historyItem of selectedHistoryItems.value) {
          const courseData = { ...historyItem.course };
          delete courseData._id; // 移除ID以创建新记录

          await updateCourse(historyItem.course._id, courseData);

          // 从历史记录中移除
          removeFromHistory(historyItem.id);
        }

        ElMessage.success(`已恢复 ${selectedHistoryItems.value.length} 门课程`);

        // 清除选择
        clearHistorySelection();

        // 重新加载课程列表
        fetchCourses();
      } catch (err) {
        console.error('批量恢复失败:', err);
        ElMessage.error('批量恢复失败: ' + (err.message || '未知错误'));
      } finally {
        historyLoading.value = false;
      }
    };

    // 从历史记录中移除
    const removeFromHistory = (id) => {
      const updatedHistory = deletionHistory.value.filter(item => item.id !== id);
      deletionHistory.value = updatedHistory;

      // 更新本地存储
      localStorage.setItem('courseDeletionHistory', JSON.stringify(updatedHistory));
    };

    // 从历史记录中彻底删除
    const deleteFromHistory = (id) => {
      ElMessageBox.confirm(
        '确定要从删除历史中彻底移除这门课程吗？此操作不可恢复。',
        '彻底删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
        .then(() => {
          removeFromHistory(id);
          ElMessage.success('已从历史记录中移除');
        })
        .catch(() => {
          // 用户取消
        });
    };

    // 格式化时间差（多久以前）
    const formatTimeAgo = (timestamp) => {
      const now = Date.now();
      const diff = now - timestamp;

      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days}天前`;
      if (hours > 0) return `${hours}小时前`;
      if (minutes > 0) return `${minutes}分钟前`;
      return '刚刚';
    };

    // 原有确认删除课程方法修改
    const confirmDelete = (course) => {
      ElMessageBox.confirm(
        `确定要删除课程"${course.title}"吗？此操作不可逆！`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
        .then(() => {
          deleteCourseWithHistory(course);
        })
        .catch(() => {
          // 取消删除
        });
    };

    // 删除课程并保存历史
    const deleteCourseWithHistory = async (course) => {
      tableLoading.value = true;

      try {
        // 保存被删除的课程用于撤销
        deletedCourses.value = [course];

        await deleteCourse(course._id);
        ElMessage.success('课程已删除');

        // 显示撤销提示
        showUndoNotification('已删除课程');

        // 将删除的课程添加到历史记录
        saveToDeleteHistory();

        fetchCourses();
      } catch (err) {
        console.error('删除课程失败:', err);
        ElMessage.error(err.response?.data?.message || '删除课程失败');
        deletedCourses.value = []; // 清空删除记录
      } finally {
        tableLoading.value = false;
      }
    };

    // 获取当前token的计算属性
    const getAuthHeaders = computed(() => {
      const token = localStorage.getItem('token') || '';
      return { Authorization: `Bearer ${token}` };
    });

    // 检查用户登录状态和管理员权限
    const userStore = computed(() => {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('解析用户信息失败:', e);
        return null;
      }
    });

    // 验证权限
    const checkAdminPermission = () => {
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('未登录，无法访问管理页面');
        ElMessage.error('请先登录');
        router.push('/login');
        return false;
      }

      const user = userStore.value;
      if (!user || user.role !== 'admin') {
        console.error('无管理员权限');
        ElMessage.error('您没有管理员权限');
        router.push('/');
        return false;
      }

      return true;
    };

    // 页面加载时获取课程列表
    onMounted(() => {
      // 检查权限
      if (!checkAdminPermission()) return;

      try {
        fetchCourses();
        loadDeletionHistory(); // 加载删除历史
      } catch (err) {
        console.error('页面加载时获取课程失败:', err);
        error.value = '加载课程数据失败，请刷新页面重试';
        loading.value = false;
      }
    });

    // 显示快速创建对话框
    const showQuickCreateDialog = () => {
      quickCreateDialogVisible.value = true;
    };

    // 重置快速创建表单
    const resetQuickForm = () => {
      if (quickFormRef.value) {
        quickFormRef.value.resetFields();
      }
      quickForm.videoUrl = '';
      quickForm.coverImage = '';
      quickForm.title = '';
      quickForm.isPublished = false;
    };

    // 处理添加B站链接
    const handleQuickCreate = async () => {
      if (!quickFormRef.value) return;

      await quickFormRef.value.validate(async (valid) => {
        if (valid) {
          try {
            quickCreating.value = true;
            console.log('开始创建课程，表单数据:', quickForm);

            const payload = {
              videoUrl: quickForm.videoUrl,
              coverImage: quickForm.coverImage || '',
              category: '其他', // 默认分类
              level: '初级',    // 默认难度
              isPublished: quickForm.isPublished
            };

            console.log('提交到后端的数据:', payload);

            const response = await quickCreateCourse(payload);
            console.log('课程创建成功，响应:', response);

            ElMessage.success('课程添加成功');
            quickCreateDialogVisible.value = false;
            fetchCourses(); // 刷新课程列表
          } catch (error) {
            console.error('添加课程失败:', error);
            let errorMsg = '添加失败';
            if (error.response) {
              console.error('错误响应详情:', error.response);
              if (error.response.data && error.response.data.message) {
                errorMsg = error.response.data.message;
              }
            }
            ElMessage.error(`添加失败: ${errorMsg}`);
          } finally {
            quickCreating.value = false;
          }
        }
      });
    };

    // 处理封面上传成功
    const handleCoverSuccess = (res, file) => {
      if (res.success && res.data && res.data.url) {
        quickForm.coverImage = res.data.url;
      } else {
        ElMessage.error('封面上传失败');
      }
    };

    // 上传前检查
    const beforeCoverUpload = (file) => {
      const isImage = file.type.startsWith('image/');
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isImage) {
        ElMessage.error('只能上传图片文件!');
        return false;
      }
      if (!isLt2M) {
        ElMessage.error('图片大小不能超过 2MB!');
        return false;
      }
      return true;
    };



    return {
      courses,
      loading,
      tableLoading,
      error,
      currentPage,
      pageSize,
      total,
      totalPages,
      selectedCourses,
      courseTable,
      filters,
      categoryOptions,
      historyDrawerVisible,
      deletionHistory,
      historyLoading,
      selectedHistoryItems,
      quickCreateDialogVisible,
      quickFormRef,
      quickForm,
      quickFormRules,
      quickCreating,
      levels,
      fetchCourses,
      handleFilterChange,
      resetFilters,
      handlePageChange,
      getCategoryTagType,
      getCategoryLabel,
      getLevelTagType,
      formatDate,
      publishCourse,
      unpublishCourse,
      handleSelectionChange,
      clearSelection,
      confirmBatchDelete,
      batchDeleteCourses,
      undoDelete,
      confirmDelete,
      deleteCourseWithHistory,
      openHistoryDrawer,
      handleHistorySelectionChange,
      restoreFromHistory,
      batchRestoreFromHistory,
      deleteFromHistory,
      formatTimeAgo,
      showQuickCreateDialog,
      resetQuickForm,
      handleQuickCreate,
      handleCoverSuccess,
      beforeCoverUpload,
      getAuthHeaders
    };
  }
}
</script>

<style scoped>
.course-manager-page {
  padding: 20px;
  font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  height: 100%;
  overflow: visible;
  /* 不产生自己的滚动条 */
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

.filter-section {
  margin-bottom: 20px;
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
}

.filter-row {
  display: flex;
  align-items: center;
}

.filter-select,
.search-input {
  width: 100%;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.status-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-time {
  font-size: 12px;
  color: #909399;
}

.status-hint {
  font-size: 12px;
  color: #F56C6C;
}

.course-title {
  font-weight: 500;
  color: #303133;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  width: 100%;
  justify-content: center;
  padding: 4px 8px;
  font-size: 12px;
}

/* 表格响应式优化 */
:deep(.el-table) {
  --el-table-border-color: #ebeef5;
  --el-table-header-bg-color: #f5f7fa;
}

:deep(.el-table__header th) {
  font-weight: 600;
  color: #606266;
  background-color: #f5f7fa;
}

:deep(.el-table__row td) {
  padding: 10px 0;
}

/* 抽屉样式 */
.history-drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.history-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selected-count {
  font-size: 14px;
  color: #409EFF;
}

.tag-input {
  width: 100px;
  margin-left: 8px;
  vertical-align: bottom;
}

.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 178px;
  height: 178px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar-uploader:hover {
  border-color: #409EFF;
}

.cover-image {
  width: 178px;
  height: 178px;
  object-fit: cover;
  display: block;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-container,
.error-container {
  padding: 40px 0;
}

.undo-notification {
  margin-bottom: 16px;
}

.undo-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.undo-tip {
  font-size: 12px;
  color: #909399;
}

.batch-actions {
  margin-bottom: 16px;
}

.batch-actions-buttons {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}

.form-item-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.w-100 {
  width: 100%;
}

.mb-4 {
  margin-bottom: 16px;
}

.ml-2 {
  margin-left: 8px;
}

.import-result h3 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 500;
}

.cover-uploader {
  width: 100%;
  display: flex;
  justify-content: center;
}

.cover-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
  width: 200px;
  height: 112px;
  /* 16:9 比例 */
}

.cover-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.cover-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 200px;
  height: 112px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

.cover-preview {
  width: 200px;
  height: 112px;
  object-fit: cover;
  display: block;
}

.upload-tip {
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
  text-align: center;
}

.cover-preview-container {
  width: 200px;
  height: 112px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.cover-placeholder span {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
<template>
  <div class="exercise-manager-page">
    <div class="page-header">
      <h1 class="page-title">练习管理</h1>
      <div class="page-actions">
        <el-button type="primary" @click="showCreateDialog">
          <el-icon>
            <Plus />
          </el-icon>
          创建新练习
        </el-button>
        <el-button type="success" @click="showImportDialog">
          <el-icon>
            <Upload />
          </el-icon>
          批量导入
        </el-button>
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
        <el-col :span="7">
          <el-select v-model="selectedCategory" placeholder="按分类筛选" clearable @change="handleFilterChange"
            class="filter-select">
            <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-col>
        <el-col :span="9">
          <div class="search-wrapper">
            <el-input v-model="searchText" placeholder="搜索题目内容" clearable @keyup.enter="handleFilterChange"
              class="search-input" />
          </div>
        </el-col>
        <el-col :span="4" class="action-col">
          <el-button @click="handleFilterChange" class="action-button" type="primary">
            <el-icon>
              <Search />
            </el-icon>
            搜索
          </el-button>
        </el-col>
        <el-col :span="4" class="reset-col">
          <el-button @click="handleReset" class="action-button" type="info" plain>
            <el-icon>
              <Refresh />
            </el-icon>
            重置
          </el-button>
        </el-col>
      </el-row>
    </div>

    <div class="batch-actions" v-if="selectedExercises.length > 0">
      <el-alert type="info" :title="`已选择 ${selectedExercises.length} 项`" show-icon :closable="false">
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
      <el-alert type="warning" :title="deletedExercises.length > 1 ? `已删除 ${deletedExercises.length} 道练习题` : '已删除练习题'"
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

    <el-table v-loading="loading" :data="exercises" stripe style="width: 100%" border
      @selection-change="handleSelectionChange" ref="exerciseTable">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column prop="content" label="题目" min-width="300" show-overflow-tooltip />
      <el-table-column prop="type" label="类型" width="120">
        <template #default="{ row }">
          <el-tag>{{ getTypeLabel(row.type) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="category" label="分类" width="120" />
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <div class="action-buttons">
            <el-button size="small" @click="editExercise(row)" type="primary" plain>
              <el-icon>
                <Edit />
              </el-icon>
              编辑
            </el-button>
            <el-button size="small" type="danger" plain @click="confirmDelete(row)">
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
      <el-pagination :current-page="currentPage" :page-size="pageSize" :total="total"
        layout="total, prev, pager, next, jumper" @current-change="handlePageChange" />
    </div>

    <!-- 创建/编辑练习对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEditing ? '编辑题目' : '创建题目'" width="700px">
      <el-form ref="exerciseFormRef" :model="exerciseForm" :rules="exerciseRules" label-width="100px">
        <el-form-item label="题目类型" prop="type">
          <el-select v-model="exerciseForm.type" placeholder="请选择题目类型">
            <el-option v-for="item in exerciseTypes" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="分类" prop="category">
          <el-input v-model="exerciseForm.category" placeholder="请输入分类，如: JavaScript, HTML, CSS等" />
        </el-form-item>

        <el-form-item label="题目内容" prop="content">
          <el-input v-model="exerciseForm.content" type="textarea" :rows="4" placeholder="请输入题目内容" />
        </el-form-item>

        <!-- 选择题选项 -->
        <template v-if="['single-choice', 'multiple-choice'].includes(exerciseForm.type)">
          <el-divider content-position="left">选项</el-divider>

          <div v-for="(option, index) in exerciseForm.options" :key="index" class="option-item">
            <el-form-item :label="`选项 ${index + 1}`" :prop="`options.${index}.text`"
              :rules="{ required: true, message: '请输入选项内容', trigger: 'blur' }">
              <div class="option-content">
                <el-input v-model="option.text" placeholder="请输入选项内容" />

                <div class="option-actions">
                  <el-checkbox v-model="option.isCorrect"
                    :disabled="exerciseForm.type === 'single-choice' && hasSelectedOption && !option.isCorrect">
                    正确答案
                  </el-checkbox>

                  <el-button type="danger" circle plain size="small" @click="removeOption(index)">
                    <el-icon>
                      <Delete />
                    </el-icon>
                  </el-button>
                </div>
              </div>
            </el-form-item>
          </div>

          <el-button type="primary" plain @click="addOption" :disabled="exerciseForm.options.length >= 6">
            <el-icon>
              <Plus />
            </el-icon>
            添加选项
          </el-button>
        </template>

        <!-- 判断题答案 -->
        <template v-else-if="exerciseForm.type === 'true-false'">
          <el-form-item label="正确答案" prop="answer.trueFalse">
            <el-radio-group v-model="exerciseForm.answer.trueFalse">
              <el-radio :label="true">正确</el-radio>
              <el-radio :label="false">错误</el-radio>
            </el-radio-group>
          </el-form-item>
        </template>

        <!-- 填空题答案 -->
        <template v-else-if="exerciseForm.type === 'fill-in'">
          <el-form-item label="正确答案" prop="answer.text">
            <el-input v-model="exerciseForm.answer.text" placeholder="请输入正确答案" />
          </el-form-item>
          <el-form-item label="提示">
            <el-input v-model="exerciseForm.hint" placeholder="可选，输入提示信息" />
          </el-form-item>
        </template>

        <!-- 简答题答案 -->
        <template v-else-if="exerciseForm.type === 'short-answer'">
          <el-form-item label="参考答案" prop="answer.text">
            <el-input v-model="exerciseForm.answer.text" type="textarea" :rows="3" placeholder="请输入参考答案" />
          </el-form-item>
          <el-form-item label="关键词" prop="answer.keywords">
            <el-input v-model="exerciseForm.answer.keywords" placeholder="可选，输入答案关键词，用逗号分隔" />
          </el-form-item>
        </template>

        <!-- 代码补全答案 -->
        <template v-else-if="exerciseForm.type === 'code-completion'">
          <el-form-item label="代码模板" prop="codeTemplate">
            <el-input v-model="exerciseForm.codeTemplate" type="textarea" :rows="4"
              placeholder="请输入代码模板，使用 // TODO: 标记需要学生填写的部分" />
          </el-form-item>
          <el-form-item label="参考答案" prop="answer.code">
            <el-input v-model="exerciseForm.answer.code" type="textarea" :rows="4" placeholder="请输入参考答案（完整代码）" />
          </el-form-item>
        </template>

        <el-form-item label="知识点" prop="knowledgePoint">
          <el-input v-model="exerciseForm.knowledgePoint" placeholder="知识点标签，如：函数、循环、DOM等" />
        </el-form-item>

        <el-form-item label="题目解析">
          <el-input v-model="exerciseForm.explanation" type="textarea" :rows="3" placeholder="可选，题目解析" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveExercise" :loading="saveLoading">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 删除历史抽屉 -->
    <el-drawer v-model="historyDrawerVisible" title="删除历史" size="60%" direction="rtl">
      <template #header>
        <div class="history-drawer-header">
          <h3>删除历史</h3>
          <div class="history-actions">
            <template v-if="selectedHistoryItems.length > 0">
              <span class="selected-count">已选择 {{ selectedHistoryItems.length }} 项</span>
              <el-button size="small" type="primary" @click="batchRestoreFromHistory" :loading="historyLoading">
                <el-icon>
                  <Document />
                </el-icon>
                批量恢复
              </el-button>
              <el-button size="small" type="danger" @click="batchDeleteFromHistory">
                <el-icon>
                  <Delete />
                </el-icon>
                彻底删除
              </el-button>
              <el-button size="small" plain @click="clearHistorySelection">
                取消选择
              </el-button>
            </template>
            <template v-else>
              <el-button size="small" type="danger" @click="clearAllHistory" v-if="deletionHistory.length > 0">
                清空历史
              </el-button>
            </template>
          </div>
        </div>
      </template>

      <div class="history-content" v-loading="historyLoading">
        <div v-if="deletionHistory.length === 0" class="empty-history">
          <el-empty description="暂无删除历史" />
        </div>

        <el-table v-else :data="deletionHistory" style="width: 100%" @selection-change="handleHistorySelectionChange">
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="删除时间" width="180">
            <template #default="{ row }">
              <div class="time-info">
                <span>{{ row.timeString }}</span>
                <span class="time-ago">{{ formatTimeAgo(row.timestamp) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="exercise.content" label="题目内容" min-width="250" show-overflow-tooltip />
          <el-table-column prop="exercise.type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag>{{ getTypeLabel(row.exercise.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="exercise.category" label="分类" width="100" />
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <el-button size="small" type="primary" @click="restoreFromHistory(row)"
                :loading="historyLoading">恢复</el-button>
              <el-button size="small" type="danger" @click="deleteFromHistory(row.id)">彻底删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="批量导入题目" width="600px">
      <div class="import-dialog-content">
        <el-alert type="info" :closable="false" show-icon>
          <h3>批量导入说明</h3>
          <p>支持导入JSON或Excel(XLSX)格式的题目文件。请先下载模板，按照模板格式填写题目数据，然后上传文件。</p>
        </el-alert>

        <div class="template-download">
          <h4>模板下载：</h4>
          <div class="download-buttons">
            <el-button type="primary" @click="downloadTemplate('json')" size="small">
              <el-icon>
                <Download />
              </el-icon> JSON模板
            </el-button>
            <el-button type="primary" @click="downloadTemplate('xlsx')" size="small">
              <el-icon>
                <Download />
              </el-icon> Excel模板
            </el-button>
          </div>
        </div>

        <el-divider content-position="center">文件上传</el-divider>

        <el-upload class="upload-container" drag action="#" :auto-upload="false" :on-change="handleFileChange"
          :limit="1" :file-list="uploadFiles" accept=".json,.xlsx,.xls">
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            拖拽文件到此处或 <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持JSON或Excel格式文件，大小不超过5MB
            </div>
          </template>
        </el-upload>

        <div class="import-status" v-if="importStatus.show">
          <el-progress :percentage="importStatus.percentage" :status="importStatus.status"
            :indeterminate="importStatus.indeterminate" :duration="5" />
          <div class="import-message">
            {{ importStatus.message }}
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="importDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="importExercises" :loading="importLoading">
            开始导入
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete, CircleClose, Refresh, Search, Back, Document, Timer, Upload, Download, UploadFilled, Edit } from '@element-plus/icons-vue';
import api from '@/api/api.js';
import exercisesAPI from '@/api/exercises.js';

// 状态变量
const exercises = ref([]);
const loading = ref(true);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const totalPages = ref(0);
const dialogVisible = ref(false);
const isEditing = ref(false);
const saveLoading = ref(false);
const exerciseFormRef = ref(null);
const exerciseTable = ref(null);
const selectedExercises = ref([]);

// 删除撤销相关
const deletedExercises = ref([]);  // 存储被删除的练习题
const showUndoAlert = ref(false);  // 控制撤销提示的显示
const undoTimeout = ref(null);     // 撤销计时器

// 删除历史相关
const historyDrawerVisible = ref(false);  // 控制历史抽屉的显示
const deletionHistory = ref([]);          // 存储所有删除历史
const historyLoading = ref(false);        // 历史记录加载状态
const selectedHistoryItems = ref([]);     // 选中的历史记录项

// 筛选变量
const selectedCategory = ref('');
const searchText = ref('');

// 练习题分类选项
const categoryOptions = [
  { label: 'HTML/CSS', value: 'html_css' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Vue', value: 'vue' },
  { label: 'React', value: 'react' },
  { label: 'Node.js', value: 'nodejs' },
  { label: '前端框架', value: 'framework' },
  { label: '浏览器API', value: 'browser_api' },
  { label: '网络基础', value: 'network' }
];

// 练习题类型
const exerciseTypes = [
  { label: '单选题', value: 'single-choice' },
  { label: '多选题', value: 'multiple-choice' },
  { label: '判断题', value: 'true-false' },
  { label: '填空题', value: 'fill-in' },
  { label: '简答题', value: 'short-answer' },
  { label: '代码补全', value: 'code-completion' }
];

// 处理表格选择变化
const handleSelectionChange = (selection) => {
  selectedExercises.value = selection;
  console.log('已选择题目:', selection);
};

// 清除所有选择
const clearSelection = () => {
  if (exerciseTable.value) {
    exerciseTable.value.clearSelection();
  }
};

// 确认批量删除
const confirmBatchDelete = () => {
  if (selectedExercises.value.length === 0) {
    ElMessage.warning('请先选择要删除的练习题');
    return;
  }

  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedExercises.value.length} 道练习题吗？此操作不可恢复！`,
    '批量删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(() => {
      batchDeleteExercises();
    })
    .catch(() => {
      // 用户取消删除
    });
};

// 执行批量删除
const batchDeleteExercises = async () => {
  loading.value = true;

  try {
    const baseUrl = window.location.origin.includes('localhost')
      ? 'http://localhost:3000/api'
      : window.location.origin + '/api';

    // 获取所有选中项的ID
    const idsToDelete = selectedExercises.value.map(item => item._id);
    console.log('要删除的ID列表:', idsToDelete);

    // 保存被删除的题目用于撤销
    deletedExercises.value = [...selectedExercises.value];

    // 使用Promise.all并行处理删除请求
    const deletePromises = idsToDelete.map(id =>
      fetch(`${baseUrl}/exercises/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
    );

    const results = await Promise.all(deletePromises);

    // 检查是否所有删除都成功
    const allSuccess = results.every(res => res.ok);

    if (allSuccess) {
      ElMessage.success(`已成功删除 ${idsToDelete.length} 道练习题`);
      clearSelection(); // 清除选择
      fetchExercises(); // 重新加载数据

      // 显示撤销提示
      showUndoNotification(`已删除 ${idsToDelete.length} 道练习题`, true);
    } else {
      const failedCount = results.filter(res => !res.ok).length;
      ElMessage.warning(`${idsToDelete.length - failedCount} 道题目删除成功，${failedCount} 道题目删除失败`);

      // 仅保存成功删除的题目用于撤销
      const successIds = [];
      results.forEach((res, index) => {
        if (res.ok) {
          successIds.push(idsToDelete[index]);
        }
      });

      deletedExercises.value = deletedExercises.value.filter(item => successIds.includes(item._id));

      if (deletedExercises.value.length > 0) {
        showUndoNotification(`已删除 ${deletedExercises.value.length} 道练习题`, true);
      }

      fetchExercises(); // 重新加载数据
    }
  } catch (err) {
    console.error('批量删除失败:', err);
    ElMessage.error('批量删除失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 筛选处理
const handleFilterChange = () => {
  console.log('执行筛选，分类:', selectedCategory.value, '搜索文本:', searchText.value);
  currentPage.value = 1;
  fetchExercises();
};

// 重置筛选
const handleReset = () => {
  console.log('执行重置筛选');
  selectedCategory.value = '';
  searchText.value = '';
  currentPage.value = 1;
  // 清除选择
  clearSelection();
  // 立即重新加载数据
  fetchExercises();
  ElMessage.success('已重置筛选条件');
};

// 获取练习题列表
const fetchExercises = async () => {
  loading.value = true;
  console.log('获取练习题列表，分类:', selectedCategory.value, '搜索文本:', searchText.value);

  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    };

    if (selectedCategory.value) {
      params.category = selectedCategory.value;
    }

    // 确保搜索文本正确传递
    if (searchText.value && searchText.value.trim() !== '') {
      params.search = searchText.value.trim();
    }

    console.log('API请求参数:', params);

    // 构建查询字符串
    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');

    // 使用fetch直接调用API
    const baseUrl = window.location.origin.includes('localhost')
      ? 'http://localhost:3000/api'
      : window.location.origin + '/api';

    console.log('API请求地址:', `${baseUrl}/exercises?${queryString}`);

    const response = await fetch(`${baseUrl}/exercises?${queryString}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('API响应数据:', data);

      exercises.value = data.data || [];
      total.value = data.total || 0;
      totalPages.value = data.totalPages || Math.ceil(total.value / pageSize.value);
    } else {
      const errorData = await response.json();
      console.error('API响应错误:', errorData);
      ElMessage.error(errorData.message || '获取练习列表失败');
      exercises.value = [];
    }
  } catch (err) {
    console.error('获取练习题失败:', err);
    ElMessage.error('获取练习题列表失败');
    exercises.value = [];
  } finally {
    loading.value = false;
  }
};

// 分页处理
const handlePageChange = (page) => {
  console.log('页码变更:', page);
  currentPage.value = page;
  fetchExercises();
};

// 练习表单初始状态
const initialFormState = {
  content: '',
  type: 'single-choice',
  category: '',
  knowledgePoint: '',
  options: [
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false }
  ],
  answer: {
    trueFalse: true,
    text: '',
    code: '',
    keywords: ''
  },
  codeTemplate: '',
  explanation: '',
  hint: ''
};

// 练习表单
const exerciseForm = reactive({ ...initialFormState });

// 检查是否已经选择了正确答案（单选题）
const hasSelectedOption = computed(() => {
  if (exerciseForm.type !== 'single-choice') return false;
  return exerciseForm.options.some(option => option.isCorrect);
});

// 表单验证规则
const exerciseRules = {
  content: [
    { required: true, message: '请输入题目内容', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择题目类型', trigger: 'change' }
  ],
  category: [
    { required: true, message: '请输入分类', trigger: 'blur' }
  ]
};

// 监听题目类型变化，重置答案相关字段
watch(() => exerciseForm.type, (newType) => {
  // 重置答案
  exerciseForm.answer = {
    trueFalse: true,
    text: '',
    code: '',
    keywords: ''
  };

  // 如果是选择题，初始化选项
  if (['single-choice', 'multiple-choice'].includes(newType)) {
    if (!exerciseForm.options || exerciseForm.options.length === 0) {
      exerciseForm.options = [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ];
    }
  }
});

// 添加选项
const addOption = () => {
  if (exerciseForm.options.length < 6) {
    exerciseForm.options.push({ text: '', isCorrect: false });
  }
};

// 移除选项
const removeOption = (index) => {
  if (exerciseForm.options.length > 2) {
    exerciseForm.options.splice(index, 1);
  } else {
    ElMessage.warning('至少需要2个选项');
  }
};

// 获取类型显示文本
const getTypeLabel = (type) => {
  const found = exerciseTypes.find(item => item.value === type);
  return found ? found.label : type;
};

// 重置表单
const resetForm = () => {
  Object.assign(exerciseForm, initialFormState);
  if (exerciseFormRef.value) {
    exerciseFormRef.value.resetFields();
  }
};

// 显示创建对话框
const showCreateDialog = () => {
  isEditing.value = false;
  resetForm();
  dialogVisible.value = true;
};

// 编辑练习题
const editExercise = (exercise) => {
  isEditing.value = true;

  // 深拷贝练习题数据
  Object.assign(exerciseForm, JSON.parse(JSON.stringify(exercise)));

  // 确保选项有正确的格式
  if (['single-choice', 'multiple-choice'].includes(exercise.type) && (!exerciseForm.options || exerciseForm.options.length === 0)) {
    exerciseForm.options = [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ];
  }

  // 确保答案对象存在
  if (!exerciseForm.answer) {
    exerciseForm.answer = {
      trueFalse: true,
      text: '',
      code: '',
      keywords: ''
    };
  }

  dialogVisible.value = true;
};

// 验证选择题是否选择了正确答案
const validateChoiceOptions = () => {
  if (['single-choice', 'multiple-choice'].includes(exerciseForm.type)) {
    // 检查是否至少有一个正确答案
    const hasCorrect = exerciseForm.options.some(option => option.isCorrect);
    if (!hasCorrect) {
      ElMessage.error('请选择至少一个正确答案');
      return false;
    }

    // 对于单选题，确保只有一个正确答案
    if (exerciseForm.type === 'single-choice') {
      const correctCount = exerciseForm.options.filter(option => option.isCorrect).length;
      if (correctCount > 1) {
        ElMessage.error('单选题只能有一个正确答案');
        return false;
      }
    }

    // 检查所有选项是否都填写了内容
    const emptyOption = exerciseForm.options.find(option => !option.text.trim());
    if (emptyOption) {
      ElMessage.error('所有选项必须填写内容');
      return false;
    }
  }

  return true;
};

// 保存练习题
const saveExercise = async () => {
  if (!exerciseFormRef.value) return;

  try {
    await exerciseFormRef.value.validate();

    // 额外验证
    if (!validateChoiceOptions()) return;

    saveLoading.value = true;

    // 准备提交的数据
    const exerciseData = { ...exerciseForm };

    // 根据练习类型处理数据
    if (!['single-choice', 'multiple-choice'].includes(exerciseData.type)) {
      delete exerciseData.options;
    }

    // 使用fetch直接调用API
    const baseUrl = window.location.origin.includes('localhost')
      ? 'http://localhost:3000/api'
      : window.location.origin + '/api';

    try {
      if (isEditing.value && exerciseData._id) {
        // 更新练习题
        console.log('正在更新练习题:', exerciseData);
        const response = await fetch(`${baseUrl}/exercises/${exerciseData._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(exerciseData)
        });

        if (response.ok) {
          ElMessage.success('更新练习题成功');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || '更新失败');
        }
      } else {
        // 创建练习题
        console.log('正在创建练习题:', exerciseData);
        const response = await fetch(`${baseUrl}/exercises`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(exerciseData)
        });

        if (response.ok) {
          ElMessage.success('创建练习题成功');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || '创建失败');
        }
      }

      dialogVisible.value = false;
      fetchExercises();
    } catch (err) {
      console.error('保存练习题API调用失败:', err);
      ElMessage.error(err.message || (isEditing.value ? '更新练习题失败' : '创建练习题失败'));
    }
  } catch (err) {
    console.error('保存练习题失败:', err);
    ElMessage.error(err.message || '表单验证失败，请检查输入');
  } finally {
    saveLoading.value = false;
  }
};

// 确认删除练习题
const confirmDelete = (exercise) => {
  ElMessageBox.confirm(
    '确定要删除这道练习题吗？此操作无法恢复。',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(() => {
      deleteExercise(exercise._id);
    })
    .catch(() => {
      // 用户取消删除
    });
};

// 删除练习题
const deleteExercise = async (id) => {
  loading.value = true;

  try {
    // 保存被删除的题目用于撤销
    const exerciseToDelete = exercises.value.find(item => item._id === id);
    if (exerciseToDelete) {
      deletedExercises.value = [exerciseToDelete];
    }

    // 使用fetch直接调用API
    const baseUrl = window.location.origin.includes('localhost')
      ? 'http://localhost:3000/api'
      : window.location.origin + '/api';

    console.log('正在删除练习题:', id);
    const response = await fetch(`${baseUrl}/exercises/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      ElMessage.success('练习题删除成功');
      fetchExercises();

      // 显示撤销提示
      showUndoNotification('已删除练习题', false);
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || '删除失败');
    }
  } catch (err) {
    console.error('删除练习题失败:', err);
    ElMessage.error(err.message || '删除练习题失败');
    deletedExercises.value = []; // 清空删除记录
  } finally {
    loading.value = false;
  }
};

// 显示撤销通知
const showUndoNotification = (message, isBatch) => {
  // 清除之前的计时器
  if (undoTimeout.value) {
    clearTimeout(undoTimeout.value);
  }

  showUndoAlert.value = true;

  // 设置10秒后关闭提示，但不清空删除记录
  undoTimeout.value = setTimeout(() => {
    showUndoAlert.value = false;
    // 不再清空deletedExercises，只隐藏提示
  }, 10000);

  // 将删除的题目添加到历史记录中
  saveToDeleteHistory();
};

// 保存删除记录到历史中
const saveToDeleteHistory = () => {
  if (deletedExercises.value.length === 0) return;

  // 格式化时间
  const now = new Date();
  const timeString = now.toLocaleString();

  // 为每个删除的题目创建一个历史记录
  const historyItems = deletedExercises.value.map(exercise => ({
    id: Date.now() + Math.random().toString(36).substring(2, 10), // 生成唯一ID
    timestamp: now.getTime(),
    timeString,
    exercise: { ...exercise }
  }));

  // 保存到本地存储
  const existingHistory = JSON.parse(localStorage.getItem('exerciseDeletionHistory') || '[]');
  const updatedHistory = [...historyItems, ...existingHistory];

  // 本地存储
  localStorage.setItem('exerciseDeletionHistory', JSON.stringify(updatedHistory));

  // 更新当前状态
  deletionHistory.value = updatedHistory;
};

// 加载删除历史
const loadDeletionHistory = () => {
  const savedHistory = localStorage.getItem('exerciseDeletionHistory');
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

// 从历史记录中恢复题目
const restoreFromHistory = async (historyItem) => {
  historyLoading.value = true;

  try {
    const baseUrl = window.location.origin.includes('localhost')
      ? 'http://localhost:3000/api'
      : window.location.origin + '/api';

    // 准备恢复的数据
    const exerciseData = { ...historyItem.exercise };
    delete exerciseData._id; // 移除ID以创建新记录

    const response = await fetch(`${baseUrl}/exercises`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(exerciseData)
    });

    if (response.ok) {
      ElMessage.success('题目恢复成功');

      // 从历史记录中移除
      removeFromHistory(historyItem.id);

      // 重新加载练习列表
      fetchExercises();
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || '恢复失败');
    }
  } catch (err) {
    console.error('恢复题目失败:', err);
    ElMessage.error('恢复题目失败: ' + (err.message || '未知错误'));
  } finally {
    historyLoading.value = false;
  }
};

// 批量恢复题目
const batchRestoreFromHistory = async () => {
  if (selectedHistoryItems.value.length === 0) {
    ElMessage.warning('请先选择要恢复的题目');
    return;
  }

  historyLoading.value = true;

  try {
    const baseUrl = window.location.origin.includes('localhost')
      ? 'http://localhost:3000/api'
      : window.location.origin + '/api';

    // 并行恢复所有选中的题目
    const restorePromises = selectedHistoryItems.value.map(historyItem => {
      const exerciseData = { ...historyItem.exercise };
      delete exerciseData._id;

      return fetch(`${baseUrl}/exercises`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(exerciseData)
      }).then(response => ({
        response,
        historyItemId: historyItem.id
      }));
    });

    const results = await Promise.all(restorePromises);

    // 统计成功和失败
    const successResults = results.filter(result => result.response.ok);
    const failedResults = results.filter(result => !result.response.ok);

    // 处理成功和失败消息
    if (successResults.length > 0) {
      ElMessage.success(`成功恢复 ${successResults.length} 道题目`);

      // 从历史记录中删除成功恢复的项
      successResults.forEach(result => {
        removeFromHistory(result.historyItemId);
      });

      // 重新加载练习列表
      fetchExercises();
    }

    if (failedResults.length > 0) {
      ElMessage.warning(`${failedResults.length} 道题目恢复失败`);
    }

    // 清除选择
    clearHistorySelection();
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
  localStorage.setItem('exerciseDeletionHistory', JSON.stringify(updatedHistory));
};

// 从历史记录中彻底删除
const deleteFromHistory = (id) => {
  ElMessageBox.confirm(
    '确定要从删除历史中彻底移除这道题目吗？此操作不可恢复。',
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

// 批量删除历史记录
const batchDeleteFromHistory = () => {
  if (selectedHistoryItems.value.length === 0) {
    ElMessage.warning('请先选择要删除的历史记录');
    return;
  }

  ElMessageBox.confirm(
    `确定要从删除历史中彻底移除选中的 ${selectedHistoryItems.value.length} 道题目吗？此操作不可恢复。`,
    '批量彻底删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(() => {
      // 获取所有选中项的ID
      const idsToDelete = selectedHistoryItems.value.map(item => item.id);

      // 从历史记录中筛选出要保留的项
      const updatedHistory = deletionHistory.value.filter(item => !idsToDelete.includes(item.id));
      deletionHistory.value = updatedHistory;

      // 更新本地存储
      localStorage.setItem('exerciseDeletionHistory', JSON.stringify(updatedHistory));

      ElMessage.success(`已从历史记录中移除 ${idsToDelete.length} 项`);
      clearHistorySelection();
    })
    .catch(() => {
      // 用户取消
    });
};

// 清空全部历史记录
const clearAllHistory = () => {
  ElMessageBox.confirm(
    '确定要清空所有删除历史记录吗？此操作不可恢复。',
    '清空历史确认',
    {
      confirmButtonText: '确定清空',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(() => {
      deletionHistory.value = [];
      localStorage.removeItem('exerciseDeletionHistory');
      ElMessage.success('已清空所有删除历史');
    })
    .catch(() => {
      // 用户取消
    });
};

// 格式化时间显示
const formatTimeAgo = (timestamp) => {
  const now = Date.now();
  const diffMs = now - timestamp;

  // 转换为秒、分钟、小时、天
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) {
    return `${diffDay} 天前`;
  } else if (diffHour > 0) {
    return `${diffHour} 小时前`;
  } else if (diffMin > 0) {
    return `${diffMin} 分钟前`;
  } else {
    return '刚刚';
  }
};

// 撤销删除操作
const undoDelete = async () => {
  if (deletedExercises.value.length === 0) return;

  loading.value = true;

  try {
    const baseUrl = window.location.origin.includes('localhost')
      ? 'http://localhost:3000/api'
      : window.location.origin + '/api';

    // 恢复被删除的练习题
    const restorePromises = deletedExercises.value.map(exercise => {
      // 移除可能的_id，因为创建新记录时不需要
      const exerciseData = { ...exercise };
      delete exerciseData._id;

      return fetch(`${baseUrl}/exercises`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(exerciseData)
      });
    });

    const results = await Promise.all(restorePromises);
    const successCount = results.filter(res => res.ok).length;

    if (successCount === deletedExercises.value.length) {
      ElMessage.success(`已成功恢复 ${successCount} 道练习题`);
    } else {
      ElMessage.warning(`已恢复 ${successCount} 道练习题，${deletedExercises.value.length - successCount} 道恢复失败`);
    }

    // 清空通知提示
    showUndoAlert.value = false;

    // 从历史记录中移除已恢复的题目
    if (successCount > 0) {
      // 获取最近添加到历史的项ID
      const recentHistoryIds = deletionHistory.value
        .slice(0, deletedExercises.value.length)
        .map(item => item.id);

      // 从历史记录中移除
      deletionHistory.value = deletionHistory.value.filter(item => !recentHistoryIds.includes(item.id));
      localStorage.setItem('exerciseDeletionHistory', JSON.stringify(deletionHistory.value));
    }

    // 重新加载数据
    fetchExercises();

    // 清空当前删除记录
    deletedExercises.value = [];

    // 清除计时器
    if (undoTimeout.value) {
      clearTimeout(undoTimeout.value);
      undoTimeout.value = null;
    }
  } catch (err) {
    console.error('撤销删除失败:', err);
    ElMessage.error('撤销删除失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 初始化
onMounted(() => {
  fetchExercises();
  loadDeletionHistory(); // 初始加载删除历史
});

// u6a21u677fu793au4f8bu6570u636e
const importDialogVisible = ref(false);
const importLoading = ref(false);
const uploadFiles = ref([]);
const importStatus = reactive({
  show: false,
  percentage: 0,
  status: '',
  message: '',
  indeterminate: false
});

// u6a21u677fu793au4f8bu6570u636e
const templateExamples = [
  {
    title: 'JavaScript中的闭包',
    type: 'single-choice',
    category: 'JavaScript',
    content: '下面关于JavaScript中闭包的描述，哪一项是正确的？',
    options: [
      { text: '闭包是指函数与其词法环境的组合', isCorrect: true },
      { text: '闭包只能在箭头函数中使用', isCorrect: false },
      { text: '闭包会导致内存泄漏，应尽量避免使用', isCorrect: false },
      { text: 'JavaScript引擎会自动归还闭包中的变量', isCorrect: false }
    ],
    knowledgePoint: '闭包',
    explanation: '闭包是指函数与其词法环境的组合。这种结构允许函数访问其外部作用域中的变量。'
  },
  {
    title: '数组遍历方法',
    type: 'multiple-choice',
    category: 'JavaScript',
    content: '以下哪些是JavaScript数组原生的遍历方法？（多选）',
    options: [
      { text: 'forEach()', isCorrect: true },
      { text: 'map()', isCorrect: true },
      { text: 'each()', isCorrect: false },
      { text: 'filter()', isCorrect: true },
      { text: 'loop()', isCorrect: false }
    ],
    knowledgePoint: '数组方法',
    explanation: 'forEach(), map(), filter()都是JavaScript数组的原生遍历方法。each()是jQuery中的方法，loop()不是标准数组方法。'
  },
  {
    title: 'React生命周期',
    type: 'true-false',
    category: '前端框架',
    content: 'React组件的componentDidMount生命周期方法在组件渲染前被调用。',
    answer: { trueFalse: false },
    knowledgePoint: 'React生命周期',
    explanation: 'componentDidMount生命周期方法在组件渲染完成后被调用，而不是在渲染前。'
  },
  {
    title: 'CSS盒模型',
    type: 'short-answer',
    category: 'CSS',
    content: '简要说明 CSS 盒模型的组成部分及其含义。',
    answer: { text: 'CSS盒模型从内到外包括：content(内容)、padding(内边距)、border(边框)、margin(外边距)。其中content是实际内容区域，padding是内容与边框之间的空白，border是包围内容和内边距的边框，margin是盒子与其他元素之间的空白。' },
    knowledgePoint: 'CSS盒模型',
    explanation: 'CSS盒模型是CSS布局的基本概念，每个HTML元素都可以看作一个盒子。'
  },
  {
    title: 'JavaScript异步编程',
    type: 'code-completion',
    category: 'JavaScript',
    content: '完成下面的JavaScript代码，实现一个简单的Promise链式调用。',
    codeTemplate: 'function fetchData() {\n  // TODO: 返回一个Promise，在成功时返回数据，失败时返回错误\n}\n\nfetchData()\n  .then(data => {\n    console.log(data);\n    // TODO: 返回处理后的数据\n  })\n  .catch(error => {\n    // TODO: 错误处理\n  });',
    answer: { code: 'function fetchData() {\n  return new Promise((resolve, reject) => {\n    setTimeout(() => {\n      const success = true; // 模拟请求成功或失败\n      if (success) {\n        resolve({ id: 1, name: "Example Data" });\n      } else {\n        reject(new Error("Failed to fetch data"));\n      }\n    }, 1000);\n  });\n}\n\nfetchData()\n  .then(data => {\n    console.log(data);\n    return { ...data, processed: true };\n  })\n  .catch(error => {\n    console.error("Error:", error.message);\n  });' },
    knowledgePoint: 'Promise',
    explanation: '这个示例展示了如何创建和使用Promise进行异步操作。Promise是JavaScript中处理异步操作的标准方式。'
  }
];

// u663eu793au5bfcu5165u5bfcu5165u72b6u6001
const showImportDialog = () => {
  importDialogVisible.value = true;
  uploadFiles.value = [];
  resetImportStatus();
};

// u91cdu7f6eu5bfcu5165u72b6u6001
const resetImportStatus = () => {
  importStatus.show = false;
  importStatus.percentage = 0;
  importStatus.status = '';
  importStatus.message = '';
  importStatus.indeterminate = false;
};

// u5904u7406u6587u4ef6u53d8u66f4
const handleFileChange = (file) => {
  console.log('选择文件:', file);
  if (file && file.size > 5 * 1024 * 1024) { // 5MB限制
    ElMessage.error('文件过大，请选择小于5MB的文件');
    uploadFiles.value = [];
    return false;
  }

  const fileExt = file.name.split('.').pop().toLowerCase();
  if (!['json', 'xlsx', 'xls'].includes(fileExt)) {
    ElMessage.error('只支持JSON或Excel(XLSX/XLS)格式的文件');
    uploadFiles.value = [];
    return false;
  }

  uploadFiles.value = [file];
  return true;
};

// u4e0bu8f7du6a21u677f
const downloadTemplate = (type) => {
  if (type === 'json') {
    // 创建JSON模板并下载
    const templateData = JSON.stringify(templateExamples, null, 2);
    const blob = new Blob([templateData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '练习题导入模板.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    ElMessage.success('JSON模板下载成功');
  } else if (type === 'xlsx') {
    // 我们只提供下载说明，实际Excel转换需要额外库支持
    ElMessage.info('请使用JSON模板并手动转换为Excel格式，或联系管理员获取Excel模板');
  }
};

// u89e3u6790u5bfCu5165u6587u4ef6
const parseImportFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const fileExt = file.name.split('.').pop().toLowerCase();

    reader.onload = (e) => {
      try {
        if (fileExt === 'json') {
          // 解析JSON文件
          const content = e.target.result;
          const exercises = JSON.parse(content);
          resolve(exercises);
        } else if (['xlsx', 'xls'].includes(fileExt)) {
          // 我们需要引入额外的库来处理Excel文件
          // 这里简单返回错误，实际实现中需要引入xlsx.js等库
          reject(new Error('目前仅支持JSON格式的文件导入，请将Excel转为JSON后重试'));
        } else {
          reject(new Error('不支持的文件格式'));
        }
      } catch (err) {
        console.error('解析文件失败:', err);
        reject(new Error('解析文件失败: ' + err.message));
      }
    };

    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };

    reader.readAsText(file);
  });
};

// u9a8cu8bc1u5bfCu5165u7684u6570u636e
const validateExerciseData = (exerciseData) => {
  // 验证是否为数组
  if (!Array.isArray(exerciseData)) {
    return {
      valid: false,
      message: '导入的数据必须是一个数组'
    };
  }

  // 验证是否有题目
  if (exerciseData.length === 0) {
    return {
      valid: false,
      message: '没有找到题目数据'
    };
  }

  // 验证每个题目的基本字段
  const invalidExercises = [];
  exerciseData.forEach((exercise, index) => {
    if (!exercise.type || !exercise.content || !exercise.category) {
      invalidExercises.push(index + 1);
    }
  });

  if (invalidExercises.length > 0) {
    return {
      valid: false,
      message: `第 ${invalidExercises.join(', ')} 题缺少必要的字段（类型、内容或分类）`
    };
  }

  return {
    valid: true,
    message: ''
  };
};

// u6279u91cfu5bfCu5165u7ec3u4e60u9898
const importExercises = async () => {
  if (uploadFiles.value.length === 0) {
    ElMessage.warning('请先选择要导入的文件');
    return;
  }

  try {
    importLoading.value = true;
    resetImportStatus();
    importStatus.show = true;
    importStatus.indeterminate = true;
    importStatus.message = '正在解析文件...';

    // 解析文件
    const exerciseData = await parseImportFile(uploadFiles.value[0].raw);

    // 验证数据
    importStatus.message = '正在验证数据...';
    const validation = validateExerciseData(exerciseData);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    // 获取基础URL
    const baseUrl = window.location.origin.includes('localhost')
      ? 'http://localhost:3000/api'
      : window.location.origin + '/api';

    // 开始导入
    importStatus.indeterminate = false;
    importStatus.percentage = 0;
    importStatus.message = `开始导入 ${exerciseData.length} 道题目...`;

    // 使用批量导入API
    const response = await fetch(`${baseUrl}/exercises/bulk-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(exerciseData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '批量导入失败');
    }

    const result = await response.json();

    // 更新导入状态
    importStatus.percentage = 100;
    importStatus.status = 'success';
    importStatus.message = `导入完成: 成功 ${result.count} 道题目`;

    // 显示结果消息
    ElMessage.success(`成功导入 ${result.count} 道题目`);

    // 刷新页面
    setTimeout(() => {
      fetchExercises();
    }, 1000);

  } catch (err) {
    console.error('导入失败:', err);
    importStatus.status = 'exception';
    importStatus.message = `导入失败: ${err.message}`;
    ElMessage.error(err.message || '导入题目失败');
  } finally {
    importLoading.value = false;
  }
};

// u663eu793au64a4u9500u901au77e5
</script>

<style scoped>
.exercise-manager-page {
  padding: 20px;
  font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}

.page-actions {
  display: flex;
  gap: 10px;
}

.filter-section {
  margin-bottom: 20px;
  background-color: var(--card-background);
  padding: 16px 20px;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-light);
  transition: all var(--transition-speed) ease;
}

.filter-row {
  display: flex;
  align-items: center;
}

.filter-select {
  width: 100%;
}

.search-wrapper {
  width: 100%;
}

.search-input {
  width: 100%;
}

.action-col,
.reset-col {
  display: flex;
  justify-content: center;
  align-items: center;
}

.action-button {
  width: 100px;
  height: 36px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 15px;
  margin: 0 auto;
  border-radius: var(--border-radius);
  transition: all var(--transition-speed) ease;
  font-weight: 500;
}

.action-button:hover {
  transform: translateY(-2px);
}

.action-button .el-icon {
  margin-right: 6px;
  font-size: 16px;
}

.batch-actions {
  margin-bottom: 15px;
}

.batch-actions-buttons {
  margin-top: 8px;
  display: flex;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  text-align: right;
  margin-top: 20px;
}

.option-item {
  border: 1px dashed var(--border-color);
  border-radius: var(--border-radius);
  padding: 10px;
  margin-bottom: 10px;
  background-color: var(--background-color);
}

.option-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.option-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 10px;
}

.undo-notification {
  margin-bottom: 15px;
}

.undo-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 5px;
}

.undo-tip {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 删除历史样式 */
.history-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.history-drawer-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.history-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.selected-count {
  font-size: 14px;
  color: var(--text-secondary);
  margin-right: 10px;
}

.history-content {
  padding: 10px 0;
}

.empty-history {
  padding: 30px 0;
}

.time-info {
  display: flex;
  flex-direction: column;
}

.time-ago {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

:deep(.el-table th) {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #333;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background-color: #f9fafc;
}

:deep(.el-input__wrapper) {
  border-radius: var(--border-radius);
}

:deep(.el-button) {
  border-radius: var(--border-radius);
  transition: all var(--transition-speed) ease;
}

:deep(.el-tag) {
  border-radius: var(--border-radius);
}

:deep(.el-drawer__header) {
  margin-bottom: 12px;
}

:deep(.el-drawer__body) {
  padding: 0 20px;
}

:deep(.el-alert) {
  border-radius: var(--border-radius);
}

:deep(.el-button--small) {
  padding: 8px 12px;
  font-weight: 500;
}

.clickable-tag:hover {
  transform: scale(1.05);
  opacity: 0.9;
}

/* 操作按钮样式 */
.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-start;
}

.action-buttons .el-button {
  margin-left: 0;
  margin-right: 0;
  flex: 0 0 auto;
  min-width: 86px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-buttons .el-icon {
  margin-right: 4px;
}

.import-dialog-content {
  padding: 20px;
}

.import-dialog-content h3 {
  margin-bottom: 10px;
}

.import-dialog-content p {
  margin-bottom: 10px;
}

.template-download {
  margin-bottom: 20px;
}

.download-buttons {
  display: flex;
  gap: 10px;
}

.upload-container {
  width: 100%;
  height: 200px;
  border: 1px dashed var(--border-color);
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-container .el-icon {
  font-size: 48px;
  color: var(--text-secondary);
}

.upload-container .el-upload__text {
  margin-top: 10px;
  font-size: 14px;
  color: var(--text-secondary);
}

.upload-container .el-upload__tip {
  margin-top: 5px;
  font-size: 12px;
  color: var(--text-secondary);
}

.import-status {
  margin-top: 20px;
  text-align: center;
}

.import-message {
  margin-top: 10px;
  font-size: 14px;
  color: var(--text-secondary);
}
</style>
<template>
  <div class="kimi-layout">
    <!-- 左侧导航栏 -->
    <div class="kimi-sidebar">
      <div class="sidebar-header">
        <h2 class="logo">AI学习助手</h2>
      </div>
      
      <div class="sidebar-menu">
        <div 
          class="menu-item" 
          :class="{ active: !showHistoryDialogs }"
          @click="showCurrentDialog"
        >
          <el-icon><ChatDotRound /></el-icon>
          <span>当前对话</span>
        </div>
        <div 
          class="menu-item" 
          :class="{ active: showHistoryDialogs }"
          @click="loadHistoryDialogs"
        >
          <el-icon><Collection /></el-icon>
          <span>历史对话</span>
        </div>
      </div>
    </div>
    
    <!-- 主内容区 -->
    <div class="kimi-main">
      <!-- 对话头部 -->
      <div class="chat-header">
        <h1>AI学习助手</h1>
        <p class="chat-description">
          基于先进大语言模型打造的智能辅导工具，能够解答前端学习中的各类问题，提供代码分析、学习建议和项目指导。
        </p>
      </div>

      <!-- 对话容器 -->
      <div class="chat-container" v-if="!showHistoryDialogs">
        <div class="chat-messages" ref="chatMessagesRef">
          <!-- 欢迎消息 -->
          <div class="message ai-message">
            <div class="message-avatar robot-avatar">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="message-content">
              <p>你好！我是你的AI学习助手，有任何前端开发相关的问题都可以问我。我可以：</p>
              <ul>
                <li>解答HTML、CSS、JavaScript等前端技术问题</li>
                <li>分析和优化你的代码</li>
                <li>提供学习路径和资源推荐</li>
                <li>帮助解决项目开发中遇到的问题</li>
              </ul>
              <p>请在下方输入你的问题，我会尽力提供帮助！</p>
            </div>
          </div>

          <!-- 动态消息列表 -->
          <div 
            v-for="(msg, index) in messages" 
            :key="index" 
            :class="['message', msg.isUser ? 'user-message' : 'ai-message']"
          >
            <template v-if="msg.isUser">
              <div class="message-content">
                {{ msg.content }}
              </div>
              <div class="message-avatar user-avatar">
                <el-avatar 
                  :size="36" 
                  :src="authStore.userInfo?.avatar" 
                  v-if="authStore.userInfo?.avatar"
                >
                  {{ authStore.userInfo?.username?.substring(0, 1) || '我' }}
                </el-avatar>
                <span v-else>{{ authStore.userInfo?.username?.substring(0, 1) || '我' }}</span>
              </div>
            </template>
            <template v-else>
              <div class="message-avatar robot-avatar">
                <el-icon><Monitor /></el-icon>
              </div>
              <div class="message-content" v-html="formatMessage(msg.content)"></div>
            </template>
          </div>

          <!-- 加载状态 -->
          <div class="message ai-message" v-if="isLoading">
            <div class="message-avatar robot-avatar">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="message-content">
              <div class="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="chat-input-container">
          <el-input
            v-model="userInput"
            type="textarea"
            :rows="2"
            placeholder="请输入你的问题..."
            :disabled="isLoading"
            @keyup.enter.native="handleEnterKey"
            ref="inputRef"
          />
          <div class="input-actions">
            <div class="input-tools">
              <el-tooltip content="示例问题" placement="top">
                <el-button circle @click="showExamples">
                  <el-icon><QuestionFilled /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="功能介绍" placement="top">
                <el-button circle @click="showFeatures">
                  <el-icon><InfoFilled /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="清空对话" placement="top">
                <el-button circle @click="confirmClearChat" :disabled="messages.length === 0">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
            <el-button 
              type="primary" 
              :disabled="!userInput.trim() || isLoading" 
              @click="sendMessage"
              :loading="isLoading"
            >
              发送
            </el-button>
          </div>
        </div>
      </div>

      <!-- 历史对话列表 -->
      <div class="history-container" v-if="showHistoryDialogs">
        <div class="history-list">
          <div v-if="historyDialogs.length === 0" class="empty-history">
            <el-empty description="暂无历史对话记录" />
          </div>
          <div 
            v-else
            v-for="(dialog, index) in historyDialogs" 
            :key="index"
            class="history-item"
            @click="showHistoryDialog(dialog)"
          >
            <div class="history-item-header">
              <div class="history-item-title">
                {{ dialog.title || formatDialogTitle(dialog) }}
              </div>
              <div class="history-item-time">
                {{ formatTime(dialog.timestamp) }}
              </div>
            </div>
            <div class="history-item-preview">
              {{ dialog.preview || dialog.messages[0]?.content.substring(0, 50) + '...' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, computed } from 'vue';
import { 
  Service, 
  QuestionFilled, 
  InfoFilled, 
  Delete, 
  ChatDotRound, 
  Collection, 
  Document, 
  Setting,
  Monitor
} from '@element-plus/icons-vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { useAuthStore } from '@/store/auth';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import MarkdownIt from 'markdown-it';
import { sendMessageToKimi } from '@/utils/api/kimiApi';
import { getWeaknessAnalysis, getLearningRecommendations } from '@/api/ai'; // 导入薄弱点分析API

const authStore = useAuthStore();
const chatMessagesRef = ref(null);
const inputRef = ref(null);
const userInput = ref('');
const isLoading = ref(false);
const messages = ref([]);
// 存储对话历史，用于API调用
const chatHistory = ref([]);
// 控制是否显示历史对话列表
const showHistoryDialogs = ref(false);
// 历史对话列表
const historyDialogs = ref([]);

// Markdown解析器
const md = new MarkdownIt({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (__) {}
    }
    return ''; // 使用默认的转义
  }
});

// 格式化消息内容，支持Markdown和代码高亮
const formatMessage = (content) => {
  if (!content) return '';
  return md.render(content);
};

// 显示当前对话
const showCurrentDialog = () => {
  showHistoryDialogs.value = false;
};

// 加载历史对话
const loadHistoryDialogs = () => {
  showHistoryDialogs.value = true;
  
  try {
    // 从localStorage加载历史对话
    const savedDialogs = localStorage.getItem('ai_chat_history');
    if (savedDialogs) {
      historyDialogs.value = JSON.parse(savedDialogs);
    } else {
      historyDialogs.value = [];
    }
    
    // 如果当前有未保存的对话，且有消息内容，添加到历史对话中
    if (messages.value.length > 0) {
      const currentDialog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        messages: [...messages.value],
        title: messages.value[0]?.content.substring(0, 20) + '...',
        preview: messages.value[0]?.content.substring(0, 50) + '...'
      };
      
      // 检查是否已存在相同ID的对话
      const existingIndex = historyDialogs.value.findIndex(d => d.id === currentDialog.id);
      if (existingIndex === -1) {
        historyDialogs.value.unshift(currentDialog);
        
        // 保存到localStorage
        localStorage.setItem('ai_chat_history', JSON.stringify(historyDialogs.value));
      }
    }
  } catch (error) {
    console.error('加载历史对话失败:', error);
    ElMessage.error('加载历史对话失败');
    historyDialogs.value = [];
  }
};

// 显示历史对话
const showHistoryDialog = (dialog) => {
  // 提示用户是否切换到历史对话
  ElMessageBox.confirm(
    '切换到历史对话将会清空当前对话内容，是否继续？',
    '切换对话',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 清空当前对话
    messages.value = [...dialog.messages];
    chatHistory.value = dialog.messages.map(msg => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.content
    }));
    
    // 切换到当前对话视图
    showHistoryDialogs.value = false;
    
    // 滚动到底部
    nextTick(() => {
      scrollToBottom();
    });
  }).catch(() => {
    // 用户取消切换
  });
};

// 格式化对话标题
const formatDialogTitle = (dialog) => {
  if (dialog.messages && dialog.messages.length > 0) {
    const firstMessage = dialog.messages[0];
    return firstMessage.content.substring(0, 20) + '...';
  }
  return '对话 ' + new Date(dialog.timestamp).toLocaleDateString();
};

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 发送消息
const sendMessage = async () => {
  if (!userInput.value.trim()) return;
  
  // 阻止连续发送
  if (isLoading.value) return;
  
  isLoading.value = true;
  
  // 添加用户消息到聊天记录
  const userMessage = userInput.value.trim();
  messages.value.push({
    content: userMessage,
    isUser: true,
    timestamp: new Date()
  });
  
  // 更新聊天记录
  chatHistory.value.push({
    role: 'user',
    content: userMessage
  });
  
  // 清空输入框
  userInput.value = '';
  
  // 滚动到底部
  await nextTick();
  scrollToBottom();
  
  try {
    // 特殊指令处理
    if (userMessage.toLowerCase().includes('清空对话') || userMessage.toLowerCase().includes('清除对话')) {
      clearChat();
      messages.value.push({
        content: '对话已清空，您可以开始新的对话。',
        isUser: false,
        timestamp: new Date()
      });
      isLoading.value = false;
      
      // 保存对话到localStorage
      saveCurrentDialog();
      
      // 滚动到底部
      nextTick(() => {
        scrollToBottom();
      });
      return;
    }
    
    // 处理薄弱点分析请求
    if (isWeaknessAnalysisQuestion(userMessage) || userMessage.includes('帮我解决') || userMessage.includes('ai助手无法分析薄弱点')) {
      await handleWeaknessAnalysisQuestion();
      isLoading.value = false;
      
      // 保存对话到localStorage
      saveCurrentDialog();
      
      // 滚动到底部
      nextTick(() => {
        scrollToBottom();
      });
      return;
    }
    
    // 处理其他请求
    // 尝试调用API获取回复
    let response;
    
    try {
      // 尝试使用API服务
      response = await sendMessageToKimi(userMessage, chatHistory.value);
    } catch (apiError) {
      console.warn('API调用失败，使用本地模拟回复:', apiError);
      // 使用本地模拟回复
      response = generateMockResponse(userMessage);
    }
    
    // 添加回复到消息列表
    messages.value.push({
      content: response,
      isUser: false,
      timestamp: new Date()
    });
    
    // 更新对话历史
    chatHistory.value.push({
      role: 'assistant',
      content: response
    });
    
    isLoading.value = false;
    
    // 保存对话到localStorage
    saveCurrentDialog();
    
    // 滚动到底部
    nextTick(() => {
      scrollToBottom();
    });
  } catch (error) {
    console.error('消息处理失败:', error);
    
    // 回退到模拟回复
    const fallbackResponse = generateMockResponse(userMessage);
    messages.value.push({
      content: fallbackResponse,
      isUser: false,
      timestamp: new Date()
    });
    
    // 更新对话历史
    chatHistory.value.push({
      role: 'assistant',
      content: fallbackResponse
    });
    
    isLoading.value = false;
    
    // 保存对话到localStorage
    saveCurrentDialog();
    
    // 滚动到底部
    nextTick(() => {
      scrollToBottom();
    });
  }
};

// 保存当前对话到localStorage
const saveCurrentDialog = () => {
  if (messages.value.length === 0) return;
  
  try {
    // 从localStorage加载历史对话
    let savedDialogs = [];
    const savedDialogsStr = localStorage.getItem('ai_chat_history');
    if (savedDialogsStr) {
      savedDialogs = JSON.parse(savedDialogsStr);
    }
    
    // 创建当前对话对象
    const currentDialog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      messages: [...messages.value],
      title: messages.value[0]?.content.substring(0, 20) + '...',
      preview: messages.value[0]?.content.substring(0, 50) + '...'
    };
    
    // 添加到历史对话列表
    savedDialogs.unshift(currentDialog);
    
    // 最多保存20条历史对话
    if (savedDialogs.length > 20) {
      savedDialogs = savedDialogs.slice(0, 20);
    }
    
    // 保存到localStorage
    localStorage.setItem('ai_chat_history', JSON.stringify(savedDialogs));
  } catch (error) {
    console.error('保存对话失败:', error);
  }
};

// 判断是否为薄弱点分析问题
const isWeaknessAnalysisQuestion = (message) => {
  const weaknessKeywords = [
    '薄弱点', '弱点', '不足', '需要提高', '需要加强', '学习建议',
    '哪里不好', '哪里差', '学习推荐', '推荐学习', '学习方向',
    '应该学什么', '应该加强', '应该提高', '学习计划', '学习路径',
    '知识漏洞', '知识盲点', '学习问题', '学习困难', '分析薄弱',
    '分析弱点', '分析我的薄弱点', '帮我分析', '帮我解决'
  ];
  
  // 转换为小写进行匹配
  const lowerMessage = message.toLowerCase();
  
  // 检查是否包含薄弱点相关关键词
  return weaknessKeywords.some(keyword => lowerMessage.includes(keyword));
};

// 处理薄弱点分析问题
const handleWeaknessAnalysisQuestion = async () => {
  try {
    // 添加加载提示消息
    messages.value.push({
      content: '正在分析您的学习数据，这可能需要一点时间...',
      isUser: false,
      timestamp: new Date()
    });
    
    // 1. 尝试从本地生成分析结果
    let localAnalysisResult = await generateLocalWeaknessAnalysis();
    
    // 2. 尝试从服务器获取分析结果
    let serverAnalysisResult = null;
    try {
      // 获取薄弱点分析
      console.log('开始调用薄弱点分析API...');
      console.log('当前用户信息:', authStore.user);
      
      // 获取用户ID，使用多种方式尝试
      let userId = null;
      
      // 方式1: 从authStore获取
      if (authStore.user?._id) {
        userId = authStore.user._id;
      } else if (authStore.user?.id) {
        userId = authStore.user.id;
      }
      
      // 方式2: 如果无法获取用户ID，尝试使用默认ID或不传递ID参数
      // 后端已修改为在没有用户ID时自动使用可用的历史记录文件
      
      console.log('使用的用户ID:', userId || '未指定，将由后端自动选择');
      
      const weaknessResponse = await getWeaknessAnalysis({ 
        timeFrame: 'all',
        includeMistakes: true,
        userId: userId // 可能为null，由后端处理
      });
      
      if (weaknessResponse.data && weaknessResponse.data.success) {
        const weaknessData = weaknessResponse.data.data;
        
        // 获取学习建议
        const recommendationsResponse = await getLearningRecommendations({ 
          timeFrame: 'all',
          userId: userId // 可能为null，由后端处理
        });
        
        if (recommendationsResponse.data && recommendationsResponse.data.success) {
          const recommendationsData = recommendationsResponse.data.data;
          
          // 生成薄弱点分析回复
          if (weaknessData.summary && weaknessData.summary.totalExercises === 0 && weaknessData.summary.totalMistakes === 0) {
            serverAnalysisResult = null; // 没有数据，使用本地分析
          } else if (weaknessData.weakKnowledgePoints.length === 0 && weaknessData.weakExerciseTypes.length === 0) {
            serverAnalysisResult = `
## 服务器数据分析结果

根据您完成的${weaknessData.summary.totalExercises}道练习题，目前没有发现明显的薄弱点，您的学习状况良好！

${recommendationsData.overallRecommendation || ''}

### 继续提高的建议

1. 尝试挑战更高难度的练习题
2. 拓展学习新的知识领域
3. 参与实战项目，将所学知识应用到实践中
`;
          } else {
            // 有薄弱点，生成详细分析
            const totalExercises = weaknessData.summary ? 
              `${weaknessData.summary.totalExercises}道练习题` :
              `您的练习记录`;
              
            serverAnalysisResult = `
## 服务器数据分析结果

根据${totalExercises}，我为您分析出以下学习薄弱点：

### 薄弱知识点
${weaknessData.weakKnowledgePoints.length > 0 
  ? weaknessData.weakKnowledgePoints.map((wp, index) => 
      `${index + 1}. **${wp.knowledgePoint}**：正确率${wp.correctRate}%，建议再练习${wp.recommendedPractices}次`
    ).join('\n')
  : '暂未发现明显的薄弱知识点'}

### 薄弱题型
${weaknessData.weakExerciseTypes.length > 0
  ? weaknessData.weakExerciseTypes.map((wt, index) =>
      `${index + 1}. **${getExerciseTypeName(wt.exerciseType)}**：正确率${wt.correctRate}%，建议再练习${wt.recommendedPractices}次`
    ).join('\n')
  : '暂未发现明显的薄弱题型'}

### 学习建议

${recommendationsData.overallRecommendation || '根据您的学习情况，建议针对薄弱点进行有针对性的练习。'}

${recommendationsData.knowledgePointRecommendations && recommendationsData.knowledgePointRecommendations.length > 0
  ? '#### 知识点学习建议\n' + recommendationsData.knowledgePointRecommendations.map((rec, index) =>
      `${index + 1}. ${rec.recommendation}`
    ).join('\n')
  : ''}

${recommendationsData.exerciseTypeRecommendations && recommendationsData.exerciseTypeRecommendations.length > 0
  ? '#### 题型练习建议\n' + recommendationsData.exerciseTypeRecommendations.map((rec, index) =>
      `${index + 1}. ${rec.recommendation}`
    ).join('\n')
  : ''}
`;
          }
        }
      }
    } catch (error) {
      console.error('获取服务器薄弱点分析失败:', error);
      serverAnalysisResult = `## 服务器数据分析

抱歉，无法获取您在服务器上的练习记录进行分析。这可能是因为您尚未登录或者服务器上没有您的练习数据。

建议您：
1. 确保已登录账号
2. 完成一些练习题
3. 稍后再尝试分析`;
    }
    
    // 3. 生成综合分析结果
    let finalResponse = '';
    
    if (serverAnalysisResult && localAnalysisResult) {
      // 同时有本地和服务器数据，进行综合分析
      finalResponse = `# 综合学习薄弱点分析

我已同时分析了您本地存储的练习数据和服务器上的练习记录，为您提供更全面的学习情况分析。

${localAnalysisResult}

---

${serverAnalysisResult}

## 综合建议

以上是基于本地数据和服务器数据的分析结果，可能存在一些差异。建议您重点关注在两种分析中都出现的薄弱点，针对性地进行练习。`;
    } else if (serverAnalysisResult) {
      // 只有服务器数据
      finalResponse = `# 学习薄弱点分析

${serverAnalysisResult}

> 注：此分析仅基于服务器数据，未包含本地未同步的练习记录。`;
    } else {
      // 只有本地数据
      finalResponse = localAnalysisResult;
    }
    
    // 删除加载提示消息
    messages.value.pop();
    
    // 添加最终分析结果
    messages.value.push({
      content: finalResponse,
      isUser: false,
      timestamp: new Date()
    });
    
    // 更新对话历史
    chatHistory.value.push({
      role: 'assistant',
      content: finalResponse
    });
    
  } catch (error) {
    console.error('处理薄弱点分析问题失败:', error);
    
    // 提供一个友好的错误回复
    const errorResponse = `抱歉，在分析您的学习薄弱点时遇到了问题。这可能是因为数据不足或系统错误。建议您完成更多练习题，或稍后再试。

如果您已经完成了练习题，可以尝试：
1. 前往"个人中心"页面
2. 点击"同步数据"按钮
3. 然后回到AI助手再次尝试分析`;
    
    // 如果存在加载提示消息，删除它
    if (messages.value[messages.value.length - 1].content.includes("正在分析您的学习数据")) {
      messages.value.pop();
    }
    
    messages.value.push({
      content: errorResponse,
      isUser: false,
      timestamp: new Date()
    });
    
    chatHistory.value.push({
      role: 'assistant',
      content: errorResponse
    });
  }
};

// 从本地数据生成薄弱点分析
const generateLocalWeaknessAnalysis = async () => {
  try {
    // 通过API获取薄弱点分析
    const response = await fetch('/api/ai/weakness-analysis', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      }
    });
    
    if (!response.ok) {
      return "我无法获取您的学习数据。请确保您已登录并完成了一些练习题，这样我才能为您提供学习薄弱点分析。";
    }
    
    const analysisData = await response.json();
    
    if (!analysisData.success || !analysisData.data) {
      return "我没有找到足够的练习记录来分析您的学习薄弱点。请先完成一些练习题，这样我才能为您提供准确的分析和建议。";
    }
    
    // 如果API返回了analysis字段，直接使用
    if (analysisData.data.analysis) {
      return analysisData.data.analysis;
    }
    
    // 否则，检查是否有薄弱知识点或薄弱题型数据
    const weaknessData = analysisData.data;
    
    if (weaknessData.weakKnowledgePoints?.length === 0 && weaknessData.weakExerciseTypes?.length === 0) {
      return `## 本地数据分析结果

根据您完成的${weaknessData.summary?.totalExercises || 0}道练习题，目前没有发现明显的薄弱点，您的学习状况良好！

### 继续提高的建议

1. 尝试挑战更高难度的练习题
2. 拓展学习新的知识领域
3. 参与实战项目，将所学知识应用到实践中`;
    } else if (weaknessData.weakExerciseTypes?.length > 0) {
      // 有薄弱题型，生成分析
      const totalExercises = weaknessData.summary?.totalExercises || 0;
      
      return `## 本地数据分析结果

根据您完成的${totalExercises}道练习题，我为您分析出以下学习薄弱点：

${weaknessData.weakKnowledgePoints?.length > 0 ? 
  `### 薄弱知识点
${weaknessData.weakKnowledgePoints.map((wp, index) => 
  `${index + 1}. **${wp.knowledgePoint}**：正确率${wp.correctRate}%，建议再练习${wp.recommendedPractices}次`
).join('\n')}` : 
  '### 薄弱知识点\n暂未发现明显的薄弱知识点'}

### 薄弱题型
${weaknessData.weakExerciseTypes.map((wt, index) =>
  `${index + 1}. **${getExerciseTypeName(wt.exerciseType)}**：正确率${wt.correctRate}%，建议再练习${wt.recommendedPractices}次`
).join('\n')}

### 学习建议

建议您针对薄弱题型进行专项训练，提高解题能力。`;
    } else {
      return "暂时无法生成薄弱点分析，请稍后再试。";
    }
  } catch (error) {
    console.error('获取薄弱点分析失败:', error);
    return "抱歉，在分析您的学习薄弱点时遇到了问题。建议您完成更多练习题后再试。";
  }
};

// 获取题型的中文名称
const getExerciseTypeName = (exerciseType) => {
  const typeNames = {
    'single-choice': '单选题',
    'multiple-choice': '多选题',
    'true-false': '判断题',
    'short-answer': '简答题',
    'code-completion': '代码补全题',
    'interview': '面试题'
  };
  
  return typeNames[exerciseType] || exerciseType;
};

// 处理Enter键发送消息（Shift+Enter换行）
const handleEnterKey = (e) => {
  if (e.shiftKey) return; // Shift+Enter不发送
  e.preventDefault();
  if (!isLoading.value && userInput.value.trim()) {
    sendMessage();
  }
};

// 滚动到底部
const scrollToBottom = () => {
  if (chatMessagesRef.value) {
    chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
  }
};

// 显示示例问题
const showExamples = () => {
  ElMessageBox.alert(
    `<div class="example-questions">
      <p><strong>技术问题示例：</strong></p>
      <ul>
        <li>JavaScript中的闭包是什么？</li>
        <li>如何实现响应式布局？</li>
        <li>Vue和React的主要区别是什么？</li>
        <li>CSS Grid和Flexbox有什么不同？</li>
      </ul>
      <p><strong>代码分析示例：</strong></p>
      <ul>
        <li>这段代码有什么问题：[粘贴你的代码]</li>
        <li>如何优化这个函数：[粘贴你的函数]</li>
      </ul>
      <p><strong>学习指导示例：</strong></p>
      <ul>
        <li>我是前端新手，应该如何学习？</li>
        <li>推荐一些学习React的资源</li>
        <li>如何提高JavaScript编程能力？</li>
      </ul>
    </div>`,
    '示例问题',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '我知道了'
    }
  );
};

// 显示功能介绍
const showFeatures = () => {
  ElMessageBox.alert(
    `<div class="feature-introduction">
      <p><strong>AI学习助手功能：</strong></p>
      <ul>
        <li><strong>智能答疑解惑</strong>：解答HTML、CSS、JavaScript等前端技术问题</li>
        <li><strong>代码分析优化</strong>：分析代码问题，提供优化建议</li>
        <li><strong>个性化学习规划</strong>：根据你的水平提供学习路径和资源推荐</li>
        <li><strong>项目实战指导</strong>：提供技术选型、架构设计和问题排查方法</li>
      </ul>
      <p><strong>使用技巧：</strong></p>
      <ul>
        <li>提问时尽量具体，包含关键上下文信息</li>
        <li>代码问题请提供完整的错误信息和相关代码</li>
        <li>使用Shift+Enter可以在输入框中换行</li>
      </ul>
    </div>`,
    'AI助手功能介绍',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '我知道了'
    }
  );
};

// 确认清空对话
const confirmClearChat = () => {
  if (messages.value.length === 0) return;
  
  ElMessageBox.confirm(
    '确定要清空所有对话记录吗？此操作不可恢复。',
    '清空对话',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    messages.value = [];
    chatHistory.value = [];
    ElMessage.success('对话已清空');
  }).catch(() => {});
};

// 模拟AI回复，实际项目中替换为API调用
const generateMockResponse = (question) => {
  // 简单的关键词匹配，实际项目中替换为API调用
  question = question.toLowerCase();
  
  if (question.includes('闭包')) {
    return `
## JavaScript中的闭包

闭包是JavaScript中一个非常重要的概念，它是指**函数及其词法环境的组合**。

简单来说，闭包允许函数访问并操作函数外部的变量。当函数被创建时，它会保留创建它时的环境。

### 闭包的例子

\`\`\`javascript
function createCounter() {
  let count = 0;  // 这个变量被闭包"捕获"
  
  return function() {
    count += 1;   // 内部函数可以访问外部函数的变量
    return count;
  };
}

const counter = createCounter();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3
\`\`\`

在这个例子中，\`createCounter\`返回的函数形成了一个闭包，它"记住"了\`count\`变量的环境。

### 闭包的应用场景

1. **数据封装和私有变量**
2. **函数工厂**
3. **回调函数**
4. **模块化设计**

### 注意事项

闭包会保留对外部变量的引用，可能导致内存占用增加。在不需要时，最好将引用设为null以便垃圾回收。
`;
  } else if (question.includes('响应式') || question.includes('自适应')) {
    return `
## 响应式布局实现方法

响应式布局是指网页能够自动适应不同设备屏幕尺寸的设计方法。以下是几种常用的实现方式：

### 1. 媒体查询 (Media Queries)

\`\`\`css
/* 移动设备 */
@media (max-width: 767px) {
  .container {
    width: 100%;
  }
}

/* 平板设备 */
@media (min-width: 768px) and (max-width: 1023px) {
  .container {
    width: 750px;
  }
}

/* 桌面设备 */
@media (min-width: 1024px) {
  .container {
    width: 970px;
  }
}
\`\`\`

### 2. 弹性布局 (Flexbox)

\`\`\`css
.container {
  display: flex;
  flex-wrap: wrap;
}

.item {
  flex: 1 1 300px; /* 增长、收缩、基础宽度 */
}
\`\`\`

### 3. 网格布局 (CSS Grid)

\`\`\`css
.container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
\`\`\`

### 4. 流体网格 (Fluid Grid)

\`\`\`css
.container {
  width: 100%;
  max-width: 1200px;
}

.column {
  float: left;
  width: 33.33%;
  padding: 15px;
  box-sizing: border-box;
}

@media (max-width: 767px) {
  .column {
    width: 100%;
  }
}
\`\`\`

### 5. 响应式图片

\`\`\`html
<img 
  srcset="small.jpg 500w, medium.jpg 1000w, large.jpg 1500w"
  sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw"
  src="fallback.jpg"
  alt="响应式图片示例"
>
\`\`\`

### 最佳实践

- 使用相对单位（%, em, rem, vw, vh）而不是绝对单位（px）
- 采用移动优先的设计策略
- 测试不同设备和屏幕尺寸
- 结合使用以上技术，而不是仅依赖一种方法
`;
  } else if (question.includes('vue') && question.includes('react')) {
    return `
## Vue和React的主要区别

Vue和React都是流行的前端框架，它们有一些关键区别：

### 1. 核心思想

- **Vue**: 更注重渐进式采用，可以逐步集成到项目中
- **React**: 更函数式的方法，强调数据的不可变性

### 2. 模板与渲染

- **Vue**: 
  - 使用基于HTML的模板语法
  - 也支持JSX
  - 双向绑定（v-model）

\`\`\`vue
<template>
  <div>
    <p>{{ message }}</p>
    <input v-model="message">
  </div>
</template>
\`\`\`

- **React**: 
  - 主要使用JSX
  - 单向数据流

\`\`\`jsx
function Example() {
  const [message, setMessage] = React.useState('');
  
  return (
    <div>
      <p>{message}</p>
      <input 
        value={message} 
        onChange={(e) => setMessage(e.target.value)} 
      />
    </div>
  );
}
\`\`\`

### 3. 组件状态管理

- **Vue**: 
  - 响应式系统
  - 使用data属性定义状态
  - Composition API (Vue 3)

- **React**: 
  - useState和useReducer钩子
  - 状态更新是显式的

### 4. 性能优化

- **Vue**: 
  - 自动依赖跟踪
  - 精确更新

- **React**: 
  - 虚拟DOM比较
  - 手动优化（React.memo, useMemo, useCallback）

### 5. 学习曲线

- **Vue**: 通常被认为更容易上手
- **React**: 可能需要更多JavaScript基础知识

### 6. 生态系统

- **Vue**: 
  - Vue Router
  - Vuex/Pinia
  - Nuxt.js

- **React**: 
  - React Router
  - Redux/MobX/Recoil
  - Next.js

### 选择建议

选择哪个框架取决于项目需求、团队经验和个人偏好。Vue可能更适合快速开发和小型团队，而React在大型应用和团队中可能有优势。
`;
  } else if (question.includes('前端') && question.includes('学习')) {
    return `
## 前端学习路径建议

作为前端新手，以下是一个结构化的学习路径：

### 1. 基础阶段 (1-2个月)

- **HTML基础**
  - 文档结构
  - 常用标签
  - 语义化HTML

- **CSS基础**
  - 选择器
  - 盒模型
  - 布局基础(Flexbox, Grid)
  - 响应式设计

- **JavaScript基础**
  - 变量、数据类型
  - 函数和作用域
  - 对象和数组
  - DOM操作
  - 事件处理

### 2. 进阶阶段 (2-3个月)

- **JavaScript进阶**
  - ES6+特性
  - 异步编程 (Promise, async/await)
  - 闭包和原型
  - 模块化

- **前端工具**
  - Git版本控制
  - npm包管理
  - Webpack/Vite等构建工具

- **CSS进阶**
  - CSS预处理器 (Sass/Less)
  - CSS架构 (BEM, OOCSS)
  - CSS动画

### 3. 框架学习 (2-3个月)

选择一个主要框架深入学习:

- **Vue.js**
  - 组件
  - Vue Router
  - Vuex/Pinia
  - 生命周期

- 或 **React**
  - 组件和Props
  - Hooks
  - React Router
  - 状态管理 (Redux/Context)

### 4. 实战提升 (持续)

- **项目实践**
  - 个人项目
  - 开源贡献
  - 克隆热门网站

- **性能优化**
  - 加载优化
  - 渲染优化
  - 代码分割

- **测试**
  - 单元测试
  - E2E测试

### 学习资源推荐

1. **文档**:
   - MDN Web Docs
   - Vue.js/React官方文档

2. **课程平台**:
   - 我们平台的前端课程
   - freeCodeCamp
   - Codecademy

3. **实践网站**:
   - Frontend Mentor
   - CodePen

4. **书籍**:
   - 《JavaScript高级程序设计》
   - 《你不知道的JavaScript》

### 学习建议

- 理论结合实践，边学边做
- 建立学习计划和目标
- 加入学习社区，与他人交流
- 定期复习和巩固知识点
- 保持好奇心和学习热情

记住，前端技术更新快，持续学习是关键！
`;
  } else {
    return `感谢您的提问！

这是一个很好的问题。基于我的理解，我可以提供以下信息：

${question.length < 20 ? 
  "您的问题比较简短，如果能提供更多上下文或详细信息，我可以给您更准确的回答。" : 
  ""}

关于您提到的问题，以下是一些关键点：

1. 在前端开发中，这是一个常见的场景
2. 解决这类问题通常需要考虑多个因素
3. 最佳实践建议结合项目具体情况来选择合适的方法

如果您能提供更具体的代码示例或详细描述您遇到的具体情况，我可以提供更有针对性的帮助。

您还有什么其他问题吗？`;
  }
};

// 自动聚焦输入框
onMounted(() => {
  if (inputRef.value && inputRef.value.focus) {
    inputRef.value.focus();
  }
  
  // 设置初始高度
  if (chatMessagesRef.value) {
    chatMessagesRef.value.style.height = 'calc(70vh - 180px)';
  }
});
</script>

<style scoped>
/* 整体布局 */
.kimi-layout {
  display: flex;
  height: 100vh;
  width: 100%;
  background-color: #f9f9f9;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 左侧导航栏 */
.kimi-sidebar {
  width: 240px;
  background-color: #fff;
  border-right: 1px solid #eaeaea;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.sidebar-header .logo {
  color: #1890ff;
  font-size: 18px;
  margin: 0;
}

.sidebar-menu {
  flex: 1;
  padding: 20px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
}

.menu-item:hover {
  background-color: rgba(24, 144, 255, 0.05);
  color: #1890ff;
}

.menu-item.active {
  background-color: rgba(24, 144, 255, 0.1);
  color: #1890ff;
  font-weight: 500;
}

.menu-item .el-icon {
  margin-right: 12px;
  font-size: 18px;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-info .avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #1890ff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-weight: bold;
}

.user-info .username {
  color: #333;
  font-size: 14px;
}

/* 主内容区 */
.kimi-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.chat-header {
  padding: 20px 30px;
  border-bottom: 1px solid #f0f0f0;
  background-color: white;
}

.chat-header h1 {
  font-size: 24px;
  color: #1890ff;
  margin: 0 0 10px;
}

.chat-description {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px 30px;
}

.message {
  display: flex;
  margin-bottom: 24px;
  animation: fadeIn 0.3s ease;
}

/* 用户消息样式 */
.user-message {
  flex-direction: row-reverse;
  justify-content: flex-start;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 12px;
}

.user-message .message-avatar {
  margin-right: 0;
  margin-left: 12px;
}

.user-avatar {
  background: #e6f7ff;
  color: #1890ff;
  font-weight: bold;
}

.ai-message .message-avatar {
  background: rgba(24, 144, 255, 0.1);
  color: #1890ff;
}

.robot-avatar {
  background: #1890ff !important;
  color: white !important;
}

.ai-message .message-avatar .el-icon {
  font-size: 18px;
}

.message-content {
  background: #fff;
  border-radius: 12px;
  padding: 14px 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  max-width: calc(100% - 60px);
  overflow-wrap: break-word;
}

.user-message .message-content {
  background: #e6f7ff;
  text-align: right;
}

/* 加载动画 */
.loading-dots {
  display: flex;
  align-items: center;
  height: 20px;
}

.loading-dots span {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #1890ff;
  margin: 0 3px;
  animation: dot-flashing 1s infinite alternate;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dot-flashing {
  0% { opacity: 0.2; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1); }
}

.chat-input-container {
  padding: 20px 30px;
  border-top: 1px solid #f0f0f0;
  background-color: #fff;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.input-tools {
  display: flex;
  gap: 8px;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .kimi-sidebar {
    width: 60px;
  }
  
  .sidebar-header .logo,
  .menu-item span,
  .user-info .username {
    display: none;
  }
  
  .menu-item {
    justify-content: center;
    padding: 12px 0;
  }
  
  .menu-item .el-icon {
    margin-right: 0;
  }
  
  .user-info {
    justify-content: center;
  }
  
  .user-info .avatar {
    margin-right: 0;
  }
  
  .chat-header h1 {
    font-size: 20px;
  }
  
  .chat-description {
    font-size: 12px;
  }
}

/* 覆盖Element Plus样式 */
:deep(.el-textarea__inner) {
  resize: none;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  border-radius: 12px;
  padding: 12px 16px;
}

:deep(.el-button) {
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

:deep(.el-avatar) {
  background-color: #1890ff;
  color: white;
  font-weight: bold;
}

/* Markdown样式 */
:deep(.message-content) {
  line-height: 1.6;
  font-size: 15px;
  color: #333;
  max-width: 85%;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

:deep(.message-content p) {
  margin: 10px 0;
}

:deep(.message-content h2) {
  font-size: 20px;
  margin: 20px 0 15px;
  color: #1890ff;
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 10px;
  font-weight: 600;
}

:deep(.message-content h3) {
  font-size: 18px;
  margin: 18px 0 12px;
  color: #333;
  font-weight: 600;
}

:deep(.message-content h4) {
  font-size: 16px;
  margin: 15px 0 10px;
  color: #444;
  font-weight: 600;
}

:deep(.message-content ul, .message-content ol) {
  padding-left: 24px;
  margin: 12px 0;
}

:deep(.message-content li) {
  margin-bottom: 8px;
}

:deep(.message-content pre) {
  background: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
  margin: 14px 0;
  border: 1px solid #eaeaea;
}

:deep(.message-content code) {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  background: #f6f8fa;
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 14px;
  color: #e83e8c;
  border: 1px solid #eaeaea;
}

:deep(.message-content pre code) {
  padding: 0;
  background: transparent;
  border: none;
  color: #333;
  font-size: 13.5px;
}

:deep(.message-content strong) {
  font-weight: 600;
  color: #222;
}

:deep(.message-content blockquote) {
  margin: 16px 0;
  padding: 8px 16px;
  border-left: 4px solid #1890ff;
  background: #f9f9f9;
  color: #666;
}

:deep(.message-content table) {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
  overflow-x: auto;
  display: block;
}

:deep(.message-content th, .message-content td) {
  border: 1px solid #eaeaea;
  padding: 8px 12px;
  text-align: left;
}

:deep(.message-content th) {
  background-color: #f6f8fa;
  font-weight: 600;
}

:deep(.message-content a) {
  color: #1890ff;
  text-decoration: none;
}

:deep(.message-content a:hover) {
  text-decoration: underline;
}

:deep(.message-content img) {
  max-width: 100%;
  border-radius: 6px;
  margin: 12px 0;
}

/* 弹窗样式 */
:deep(.example-questions), :deep(.feature-introduction) {
  line-height: 1.6;
}

:deep(.example-questions ul), :deep(.feature-introduction ul) {
  padding-left: 20px;
}

:deep(.example-questions li), :deep(.feature-introduction li) {
  margin-bottom: 8px;
}

/* 历史对话列表样式 */
.history-container {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-history {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.history-item {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
}

.history-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.history-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.history-item-title {
  font-weight: 500;
  font-size: 16px;
  color: #333;
}

.history-item-time {
  font-size: 12px;
  color: #999;
}

.history-item-preview {
  font-size: 14px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style> 
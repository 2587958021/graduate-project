<template>
  <div class="bilibili-player-container">
    <div v-if="loading" class="player-loading">
      <div class="loading-spinner">
        <el-icon class="is-loading">
          <Loading />
        </el-icon>
      </div>
      <div class="loading-text">视频加载中...</div>
    </div>

    <iframe v-if="!error" class="player-iframe" :src="videoSrc" scrolling="no" border="0" frameborder="no"
      framespacing="0" referrerpolicy="no-referrer" allow="autoplay; fullscreen; picture-in-picture"
      allowfullscreen="true" @load="handleIframeLoad">
    </iframe>

    <div v-if="error" class="player-error">
      <el-icon class="error-icon">
        <CircleClose />
      </el-icon>
      <div class="error-text">{{ errorMessage }}</div>
      <el-button type="primary" size="small" @click="reloadVideo">重试</el-button>
    </div>

    <div class="player-actions">
      <el-button type="primary" size="small" @click="reloadVideo" class="reload-btn">
        <el-icon>
          <Refresh />
        </el-icon>
        刷新视频
      </el-button>
      <a :href="biliLink" target="_blank" class="bili-link">
        <el-button type="info" size="small">
          <el-icon>
            <VideoPlay />
          </el-icon>
          哔哩哔哩观看
        </el-button>
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { Loading, CircleClose, Refresh, VideoPlay } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { enhanceVideoIframe, fixEmbedCode } from '../utils/bilibiliFixes';

const props = defineProps({
  bvid: {
    type: String,
    required: false,
    default: ''
  },
  page: {
    type: Number,
    default: 1
  },
  videoUrl: {
    type: String,
    default: ''
  }
});

// 状态变量
const loading = ref(true);
const error = ref(false);
const errorMessage = ref('视频加载失败');

// 生成B站视频URL
const videoSrc = computed(() => {
  // 首先使用提供的videoUrl（新课程模型）
  if (props.videoUrl) return props.videoUrl;

  // 如果没有videoUrl但有bvid，则生成URL（兼容旧数据）
  if (props.bvid) {
    return `https://player.bilibili.com/player.html?bvid=${props.bvid}&page=${props.page}&high_quality=1&danmaku=0`;
  }

  // 没有任何视频源
  return '';
});

// 计算B站视频链接
const biliLink = computed(() => {
  if (props.bvid) {
    return `https://www.bilibili.com/video/${props.bvid}${props.page > 1 ? '?p=' + props.page : ''}`;
  }

  // 从videoUrl中提取bvid
  const bvidMatch = props.videoUrl && props.videoUrl.match(/bvid=([^&]+)/i);
  const pageMatch = props.videoUrl && props.videoUrl.match(/[&?]p=(\d+)/i);

  if (bvidMatch) {
    const extractedBvid = bvidMatch[1];
    const extractedPage = pageMatch ? parseInt(pageMatch[1], 10) : 1;
    return `https://www.bilibili.com/video/${extractedBvid}${extractedPage > 1 ? '?p=' + extractedPage : ''}`;
  }

  return '#';
});

// 处理iframe加载完成事件
const handleIframeLoad = () => {
  console.log('B站视频iframe已加载完成');
  loading.value = false;

  // 增强iframe属性
  try {
    const iframe = document.querySelector('.player-iframe');
    if (iframe) {
      enhanceVideoIframe(iframe);
    } else {
      console.warn('找不到iframe元素，无法应用增强');
    }
  } catch (error) {
    console.error('增强iframe时发生错误:', error.message);
  }
};

// 加载视频
const loadVideo = () => {
  if (!videoSrc.value) {
    error.value = true;
    errorMessage.value = '无效的视频链接';
    loading.value = false;
    return;
  }

  console.log('开始加载B站视频:', videoSrc.value);
  loading.value = true;
  error.value = false;

  // 设置一个超时检查，如果5秒后还在加载，就提示可能有问题
  setTimeout(() => {
    if (loading.value) {
      console.warn('视频加载时间过长，可能存在问题');
      ElMessage.warning({
        message: '视频加载较慢，请稍等或尝试刷新',
        duration: 3000
      });
    }
  }, 5000);

  // 检查DOM元素是否存在
  setTimeout(() => {
    const iframe = document.querySelector('.player-iframe');
    if (!iframe && !error.value) {
      console.warn('未能找到iframe元素，可能加载失败');
    }
  }, 1000);
};

// 重新加载视频
const reloadVideo = () => {
  ElMessage.info('正在重新加载视频...');
  loadVideo();
};

// 监听属性变化
watch(() => [props.videoUrl, props.bvid, props.page], () => {
  loadVideo();
});

// 组件挂载
onMounted(() => {
  console.log('BilibiliPlayer组件已挂载');
  loadVideo();
});
</script>

<style scoped>
.bilibili-player-container {
  position: relative;
  width: 100%;
  height: 0;
  padding-top: 62.5%;
  /* 16:10 比例 */
  background-color: #000;
  overflow: hidden;
  border-radius: 8px;
}

.player-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.player-loading,
.player-error {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  z-index: 10;
}

.loading-spinner,
.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-icon {
  color: #f56c6c;
}

.loading-text,
.error-text {
  font-size: 16px;
  margin-bottom: 16px;
}

.player-actions {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  gap: 8px;
  z-index: 5;
  opacity: 0.6;
  transition: opacity 0.3s;
}

.player-actions:hover {
  opacity: 1;
}

.bili-link {
  text-decoration: none;
}
</style>
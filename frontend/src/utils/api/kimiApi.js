import axios from 'axios';

// 创建API实例
const kimiApi = axios.create({
  baseURL: 'https://api.moonshot.cn/v1',
  headers: {
    'Content-Type': 'application/json',
  }
});

// 设置请求拦截器，添加认证信息
kimiApi.interceptors.request.use(config => {
  // 从环境变量或安全存储获取API密钥
  // 注意：实际生产环境中，不应在前端存储API密钥，而应通过后端代理
  // 此处使用硬编码的API密钥，仅用于开发测试
  const apiKey = import.meta.env.VITE_KIMI_API_KEY || 'sk-PcKzZbaZXLceKMYVLxWWHcDlyZbt0Ilyu07FXwDpz8F7u4ZK';
  
  if (apiKey) {
    config.headers['Authorization'] = `Bearer ${apiKey}`;
  } else {
    console.warn('未找到API密钥，请检查环境变量配置');
  }
  
  return config;
});

/**
 * 发送消息到Kimi AI并获取回复
 * @param {string} message - 用户消息
 * @param {Array} history - 历史对话记录
 * @returns {Promise} - 返回AI回复
 */
export const sendMessageToKimi = async (message, history = []) => {
  try {
    console.log('正在发送请求到Kimi API...');
    
    const response = await kimiApi.post('/chat/completions', {
      model: 'moonshot-v1-8k',
      messages: [
        { role: 'system', content: '你是一个专业的前端开发学习助手，擅长解答HTML、CSS、JavaScript、Vue、React等前端技术问题，并能提供代码示例和学习建议。请使用简洁清晰的语言和Markdown格式回答问题。' },
        ...history.filter(msg => msg.role !== 'system'), // 确保不重复系统消息
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    console.log('Kimi API响应成功:', response.status);
    
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    } else {
      console.error('API响应格式异常:', response.data);
      throw new Error('API返回格式异常');
    }
  } catch (error) {
    // 详细记录错误信息
    if (error.response) {
      // 服务器返回了错误状态码
      console.error('Kimi API错误响应:', error.response.status, error.response.data);
      throw new Error(`API错误: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('Kimi API无响应:', error.request);
      throw new Error('API无响应，请检查网络连接');
    } else {
      // 请求配置出错
      console.error('Kimi API请求错误:', error.message);
      throw error;
    }
  }
};

// 添加响应拦截器，处理常见错误
kimiApi.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      console.error('Kimi API认证失败: API密钥无效或已过期');
    } else if (error.response && error.response.status === 429) {
      console.error('Kimi API请求频率限制: 请求过于频繁');
    }
    return Promise.reject(error);
  }
);

export default kimiApi; 
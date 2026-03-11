/**
 * 演示脚本 - 设置测试用的认证令牌
 * 可以在浏览器控制台中复制粘贴执行
 */

// 创建一个测试用的JWT令牌 (注意: 这不是真实有效的JWT，仅用于演示)
const createTestToken = () => {
  // 头部 (使用Base64编码的JSON)
  const header = btoa(JSON.stringify({
    alg: 'HS256',
    typ: 'JWT'
  }));
  
  // 载荷 (使用Base64编码的JSON)
  const payload = btoa(JSON.stringify({
    userId: '123456789',
    username: 'demo_user',
    exp: Math.floor(Date.now() / 1000) + 3600 * 24 // 24小时后过期
  }));
  
  // 签名 (模拟的签名字符串)
  const signature = btoa('demo_signature');
  
  // 拼接成JWT格式：header.payload.signature
  return `${header}.${payload}.${signature}`;
};

// 设置令牌到localStorage
export const setDemoToken = () => {
  const token = createTestToken();
  localStorage.setItem('token', token);
  console.log('✅ 演示令牌已设置!');
  console.log('现在你可以测试AI助手功能了');
  
  // 打印API密钥设置提示
  console.log('');
  console.log('💡 提示: 别忘了也要设置智谱AI API密钥');
  console.log('可以使用以下命令设置API密钥:');
  console.log('localStorage.setItem("zhipuai_api_key", "你的智谱AI API密钥")');
  
  return '演示令牌已设置';
};

// 当文件被直接执行时调用此函数
if (typeof window !== 'undefined') {
  // 仅在浏览器环境中执行
  try {
setDemoToken();
  } catch (e) {
    console.error('设置演示令牌失败:', e);
  }
}

/**
 * 设置智谱AI演示API密钥（用于测试）
 * 此脚本可以复制到浏览器控制台执行
 */

// 设置演示API密钥
export const setDemoApiKey = () => {
  // 这里需要替换为有效的API密钥
  // 格式为: API_KEY.API_SECRET
  const apiKey = '2db8cd3ca0e54060b5d610ac416e9ae3.Qb5J4ShxV707UtpL';
  
  // 将API密钥保存到localStorage
  localStorage.setItem('zhipuai_api_key', apiKey);
  
  console.log('%c✅ 演示API密钥已设置！', 'color: #67C23A; font-weight: bold;');
  console.log('请刷新页面以应用新的API密钥');
  
  return '演示API密钥已设置，请刷新页面';
};

// 当文件被直接执行时调用此函数
if (typeof window !== 'undefined') {
  // 仅在浏览器环境中执行
  try {
setDemoApiKey();
  } catch (e) {
    console.error('设置演示API密钥失败:', e);
  }
}

// 导出一个包含所有函数的对象作为默认导出
export default {
  setDemoToken,
  setDemoApiKey
}; 
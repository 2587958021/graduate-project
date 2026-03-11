/**
 * B站API工具函数
 * 用于从B站获取视频信息
 */
const axios = require('axios');

/**
 * 从B站视频链接或BV号提取BV号
 * @param {string} url - B站视频链接或BV号
 * @returns {string|null} - 提取的BV号，如果无法提取则返回null
 */
function extractBvid(url) {
  if (!url) return null;
  
  // 如果已经是BV号格式（以BV开头的字符串）
  if (/^BV\w+$/.test(url)) {
    return url;
  }
  
  // 从URL中提取BV号
  const bvMatch = url.match(/\/(?:video\/)(BV\w+)/i) || url.match(/(BV\w+)/i);
  return bvMatch ? bvMatch[1] : null;
}

/**
 * 从B站视频链接或BV号提取P号(分P信息)
 * @param {string} url - B站视频链接
 * @returns {number} - 提取的P号，默认为1
 */
function extractPage(url) {
  if (!url) return 1;
  
  // 尝试匹配?p=123或&p=123格式
  const pageMatch = url.match(/[?&]p=(\d+)/i);
  return pageMatch ? parseInt(pageMatch[1], 10) : 1;
}

/**
 * 获取B站视频信息
 * @param {string} bvid - 视频的BV号
 * @returns {Promise<Object>} - 视频信息
 */
async function getVideoInfo(bvid) {
  try {
    if (!bvid) {
      throw new Error('未提供有效的BV号');
    }
    
    // 调用B站API获取视频基本信息
    const response = await axios.get(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.bilibili.com'
      }
    });
    
    if (response.data.code !== 0) {
      throw new Error(response.data.message || '获取视频信息失败');
    }
    
    const videoData = response.data.data;
    
    // 格式化返回数据
    return {
      bvid: videoData.bvid,
      title: videoData.title,
      description: videoData.desc,
      coverUrl: videoData.pic,
      author: videoData.owner.name,
      duration: videoData.duration,
      pages: videoData.pages ? videoData.pages.map(page => ({
        page: page.page,
        title: page.part,
        duration: page.duration
      })) : [],
      categories: videoData.tname ? [videoData.tname] : [],
      publishedAt: new Date(videoData.pubdate * 1000).toISOString(),
      tags: videoData.tag ? videoData.tag.split(',') : []
    };
  } catch (error) {
    console.error('获取B站视频信息失败:', error);
    throw new Error(`获取视频信息失败: ${error.message}`);
  }
}

module.exports = {
  extractBvid,
  extractPage,
  getVideoInfo
}; 
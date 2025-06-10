const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB in bytes

// 下载云存储图片到本地临时文件
const downloadCloudImage = async (cloudPath) => {
  if (!cloudPath || !cloudPath.startsWith('cloud://')) {
    // 如果不是云路径，直接返回原路径（假定它已经是本地路径）
    return cloudPath;
  }
  try {
    const { statusCode, tempFilePath } = await wx.cloud.downloadFile({
      fileID: cloudPath
    });
    if (statusCode === 200) {
      return tempFilePath;
    } else {
      throw new Error(`Download failed with status code ${statusCode}`);
    }
  } catch (error) {
    // 重新抛出错误，包含原始 fileID 和错误信息，便于上层捕获
    throw new Error(`下载云图片失败 for fileID: ${cloudPath}. Reason: ${error.errMsg || error.message}`);
  }
};

// 压缩图片
const compressImage = async (imagePath) => {
  try {
    const { tempFilePath } = await wx.compressImage({
      src: imagePath,
      quality: 80,
      compressedWidth: 750 // 适合大多数手机屏幕宽度
    });
    return tempFilePath;
  } catch (error) {
    throw new Error(`图片压缩失败: ${error.errMsg}`);
  }
};

// 检查图片大小
const checkImageSize = async (imagePath) => {
  try {
    const fileInfo = await wx.getFileInfo({
      filePath: imagePath
    });
    return fileInfo.size <= MAX_IMAGE_SIZE;
  } catch (error) {
    console.error('获取图片信息失败：', error);
    return false;
  }
};

// 加载轮播图片
const loadSwiperImages = async (imagePaths) => {
  const processedImages = [];
  
  for (const path of imagePaths) {
    try {
      // 1. 下载图片
      const localPath = await downloadCloudImage(path);
      
      // 2. 压缩图片
      const processedPath = await compressImage(localPath);
      
      // 3. 检查大小 (可选，但推荐)
      const isValidSize = await checkImageSize(processedPath);
      if (!isValidSize) {
        // 如果文件过大，也当作失败处理并跳过
        console.warn(`图片 ${path} 压缩后仍然过大，已跳过。`);
        continue; 
      }
      
      processedImages.push(processedPath);
    } catch (error) {
      // 捕获单个图片处理过程中的任何错误（下载、压缩等）
      // 在控制台记录错误，然后继续处理下一张图片
      console.error(`处理图片 ${path} 时出错，已跳过。错误详情:`, error.message);
    }
  }
  
  return processedImages;
};

module.exports = {
  loadSwiperImages,
  compressImage,
  checkImageSize,
  downloadCloudImage
}; 
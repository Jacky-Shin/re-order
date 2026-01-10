import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

/**
 * 图片存储服务
 * 在独立应用中使用本地文件系统存储图片
 */
class ImageStorageService {
  private imageDir = 'images';

  /**
   * 保存图片（Base64格式）
   * 在移动端使用文件系统，Web端使用localStorage
   */
  async saveImage(imageData: string, filename: string): Promise<string> {
    if (Capacitor.getPlatform() === 'web') {
      // Web环境：使用localStorage（开发测试用）
      const key = `image_${filename}`;
      localStorage.setItem(key, imageData);
      return `/local-images/${filename}`;
    }

    // 移动端：使用文件系统
    try {
      // 确保目录存在
      try {
        await Filesystem.mkdir({
          path: this.imageDir,
          directory: Directory.Data,
          recursive: true,
        });
      } catch (e) {
        // 目录可能已存在，忽略错误
      }

      // 保存文件
      await Filesystem.writeFile({
        path: `${this.imageDir}/${filename}`,
        data: imageData,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });

      // 返回文件路径（用于在应用中显示）
      return `file:///${this.imageDir}/${filename}`;
    } catch (error) {
      console.error('保存图片失败:', error);
      throw error;
    }
  }

  /**
   * 读取图片
   */
  async getImage(filename: string): Promise<string | null> {
    if (Capacitor.getPlatform() === 'web') {
      const key = `image_${filename}`;
      return localStorage.getItem(key);
    }

    try {
      const result = await Filesystem.readFile({
        path: `${this.imageDir}/${filename}`,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      return result.data as string;
    } catch (error) {
      console.error('读取图片失败:', error);
      return null;
    }
  }

  /**
   * 删除图片
   */
  async deleteImage(filename: string): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      const key = `image_${filename}`;
      localStorage.removeItem(key);
      return;
    }

    try {
      await Filesystem.deleteFile({
        path: `${this.imageDir}/${filename}`,
        directory: Directory.Data,
      });
    } catch (error) {
      console.error('删除图片失败:', error);
    }
  }

  /**
   * 将File对象转换为Base64
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // 如果是Data URL，提取Base64部分
        if (result.startsWith('data:')) {
          resolve(result);
        } else {
          resolve(result);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export const imageStorageService = new ImageStorageService();

/**
 * 图片存储服务
 * 在Web环境中使用Base64存储（存储在Firebase/localStorage中）
 */
class ImageStorageService {
  /**
   * 保存图片（Base64格式）
   * Web环境：直接返回Base64数据，存储在数据库中
   */
  async saveImage(imageData: string, _filename?: string): Promise<string> {
    // Web环境：直接返回Base64数据
    // 图片会存储在Firebase或localStorage中
    return imageData;
  }

  /**
   * 读取图片
   * Web环境：filename就是Base64数据或URL
   */
  async getImage(filename: string): Promise<string | null> {
    // Web环境：filename就是Base64数据或URL
    return filename;
  }

  /**
   * 删除图片
   * Web环境：图片存储在数据库中，删除由数据库处理
   */
  async deleteImage(_filename: string): Promise<void> {
    // Web环境：图片存储在数据库中，删除由数据库处理
  }

  /**
   * 将File对象转换为Base64
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // 返回完整的Data URL（包含data:image/...;base64,前缀）
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export const imageStorageService = new ImageStorageService();

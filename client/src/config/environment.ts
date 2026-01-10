/**
 * 环境配置
 * 检测当前运行环境，决定使用HTTP API还是本地API
 */

export const isCapacitor = () => {
  // 检查是否在Capacitor环境中
  if (typeof window !== 'undefined') {
    // @ts-ignore
    return window.Capacitor !== undefined;
  }
  return false;
};

export const isStandalone = () => {
  // 检查是否在独立应用模式（通过URL参数或环境变量控制）
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('standalone') === 'true' || localStorage.getItem('use_standalone') === 'true';
};

export const useLocalApi = () => {
  // 如果是在Capacitor环境中，或者明确指定使用独立模式，则使用本地API
  return isCapacitor() || isStandalone();
};

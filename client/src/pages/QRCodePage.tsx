import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function QRCodePage() {
  const [tableNumber, setTableNumber] = useState('');
  const [baseUrl, setBaseUrl] = useState(() => {
    // 获取当前页面的基础URL
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol;
      const host = window.location.host;
      const url = `${protocol}//${host}`;
      console.log('🔍 检测到的基础URL:', url);
      // 确保URL不包含路径
      return url;
    }
    return 'http://localhost:3000';
  });

  // 确保URL格式正确，移除末尾斜杠
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const qrUrl = tableNumber 
    ? `${cleanBaseUrl}/menu?table=${encodeURIComponent(tableNumber)}`
    : `${cleanBaseUrl}/menu`;
  
  console.log('📱 生成的二维码URL:', qrUrl);
  
  const handleTableNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTableNumber(value);
    // 实时更新二维码URL
  };

  const handleDownload = () => {
    const svg = document.getElementById('qrcode-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `starbucks-qrcode-${tableNumber || 'default'}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-sb-dark-green mb-2">二维码生成器</h1>
          <p className="text-gray-600">为您的餐桌生成点餐二维码</p>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">设置</h2>
          
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                基础URL
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => {
                  const newUrl = e.target.value.replace(/\/$/, ''); // 移除末尾斜杠
                  setBaseUrl(newUrl);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sb-green focus:border-transparent"
                placeholder="https://your-domain.vercel.app"
              />
              <p className="text-xs text-gray-500 mt-1">
                当前自动检测: {baseUrl} | 如需修改，请手动输入正确的域名
              </p>
              <p className="text-xs text-blue-600 mt-1">
                💡 提示：二维码URL将指向: {qrUrl}
              </p>
            </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              桌号（可选）
            </label>
            <input
              type="text"
              value={tableNumber}
              onChange={handleTableNumberChange}
              placeholder="例如：A1, 1号桌"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sb-green focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              输入桌号后，扫码会自动关联到该桌号
            </p>
          </div>
        </div>

        {/* QR Code Display */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 print:shadow-none">
          <div className="flex flex-col items-center">
            <div className="mb-4">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                <QRCodeSVG
                  id="qrcode-svg"
                  value={qrUrl}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>
            
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-sb-dark-green mb-2">星巴克扫码点餐</h3>
              {tableNumber && (
                <div className="my-2 px-4 py-2 bg-sb-light-green rounded-lg inline-block">
                  <p className="text-sm text-gray-600 mb-1">桌位</p>
                  <p className="text-xl font-bold text-sb-green">{tableNumber}</p>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-2 break-all">{qrUrl}</p>
            </div>

            <div className="flex gap-3 flex-wrap justify-center">
              <button
                onClick={handleDownload}
                className="px-6 py-2 bg-sb-green text-white rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
              >
                下载二维码
              </button>
              <button
                onClick={handlePrint}
                className="px-6 py-2 border-2 border-sb-green text-sb-green rounded-lg font-semibold hover:bg-sb-light-green transition-colors"
              >
                打印二维码
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">使用说明</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">1.</span>
              <span>输入桌号（可选），然后生成二维码</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2.</span>
              <span>下载或打印二维码，放置在对应餐桌上</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3.</span>
              <span>顾客使用手机扫描二维码即可进入点餐页面</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">4.</span>
              <span>部署到服务器后，请将基础URL修改为实际域名</span>
            </li>
          </ul>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:shadow-none,
          .print\\:shadow-none * {
            visibility: visible;
          }
          .print\\:shadow-none {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

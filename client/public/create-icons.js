// 使用Node.js和canvas库生成图标
// 需要先安装: npm install canvas
// 运行: node create-icons.js

const fs = require('fs');
const path = require('path');

// 简单的Base64编码的星巴克风格图标
// 由于无法直接生成图片，我们创建一个HTML文件来生成图标

const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>Generate Starbucks Icons</title>
</head>
<body>
    <h1>Generating Icons...</h1>
    <canvas id="canvas512" width="512" height="512" style="display:none;"></canvas>
    <canvas id="canvas192" width="192" height="192" style="display:none;"></canvas>
    <script>
        function drawStarbucksIcon(ctx, size) {
            const center = size / 2;
            const radius = size * 0.47;
            const innerRadius = size * 0.16;
            
            // 背景圆形 - 星巴克绿色
            ctx.fillStyle = '#00704A';
            ctx.beginPath();
            ctx.arc(center, center, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // 中心白色圆形
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(center, center, innerRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // 星巴克标志简化版 - 双尾美人鱼
            ctx.fillStyle = '#00704A';
            ctx.beginPath();
            const scale = size / 512;
            const offset = center;
            
            // 绘制简化的星巴克标志
            ctx.moveTo(offset - 60 * scale, offset - 20 * scale);
            ctx.quadraticCurveTo(offset - 40 * scale, offset - 40 * scale, offset - 20 * scale, offset - 30 * scale);
            ctx.quadraticCurveTo(offset, offset - 20 * scale, offset + 20 * scale, offset - 30 * scale);
            ctx.quadraticCurveTo(offset + 40 * scale, offset - 40 * scale, offset + 60 * scale, offset - 20 * scale);
            ctx.quadraticCurveTo(offset + 50 * scale, offset, offset + 40 * scale, offset + 20 * scale);
            ctx.quadraticCurveTo(offset + 20 * scale, offset + 40 * scale, offset, offset + 30 * scale);
            ctx.quadraticCurveTo(offset - 20 * scale, offset + 40 * scale, offset - 40 * scale, offset + 20 * scale);
            ctx.quadraticCurveTo(offset - 50 * scale, offset, offset - 60 * scale, offset - 20 * scale);
            ctx.closePath();
            ctx.fill();
            
            // 皇冠
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.moveTo(offset - 30 * scale, offset - 50 * scale);
            ctx.lineTo(offset - 20 * scale, offset - 60 * scale);
            ctx.lineTo(offset, offset - 70 * scale);
            ctx.lineTo(offset + 20 * scale, offset - 60 * scale);
            ctx.lineTo(offset + 30 * scale, offset - 50 * scale);
            ctx.lineTo(offset + 25 * scale, offset - 45 * scale);
            ctx.lineTo(offset + 15 * scale, offset - 50 * scale);
            ctx.lineTo(offset, offset - 55 * scale);
            ctx.lineTo(offset - 15 * scale, offset - 50 * scale);
            ctx.lineTo(offset - 25 * scale, offset - 45 * scale);
            ctx.closePath();
            ctx.fill();
        }
        
        function downloadCanvas(canvas, filename) {
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
        
        // 生成512x512图标
        const canvas512 = document.getElementById('canvas512');
        const ctx512 = canvas512.getContext('2d');
        drawStarbucksIcon(ctx512, 512);
        downloadCanvas(canvas512, 'icon-512.png');
        
        // 生成192x192图标
        const canvas192 = document.getElementById('canvas192');
        const ctx192 = canvas192.getContext('2d');
        drawStarbucksIcon(ctx192, 192);
        downloadCanvas(canvas192, 'icon-192.png');
        
        console.log('Icons generated!');
    </script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'generate-icons.html'), htmlContent);
console.log('Created generate-icons.html - Open this file in a browser to generate icons');

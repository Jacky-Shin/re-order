/**
 * 并发订单测试脚本
 * 模拟多个用户同时下单，测试系统的高并发处理能力
 * 
 * 测试内容：
 * 1. 订单号是否重复
 * 2. 取单号是否重复
 * 3. 订单编码是否重复
 * 4. 订单是否都能成功创建
 * 5. 响应时间和错误率
 */

import axios from 'axios';
import { performance } from 'perf_hooks';

// 配置
const CONFIG = {
  // 并发用户数
  CONCURRENT_USERS: parseInt(process.env.CONCURRENT_USERS || '30'),
  // API基础URL（如果是本地模式，需要启动服务器）
  BASE_URL: process.env.API_URL || 'http://localhost:5000',
  // 测试超时时间（毫秒）
  TIMEOUT: 30000,
};

// 测试结果统计
const results = {
  total: 0,
  success: 0,
  failed: 0,
  errors: [],
  orderNumbers: new Set(),
  pickupNumbers: new Set(),
  orderCodes: new Set(),
  responseTimes: [],
  duplicates: {
    orderNumbers: [],
    pickupNumbers: [],
    orderCodes: [],
  },
};

// 模拟购物车商品
const mockCartItem = {
  id: `test_item_${Date.now()}`,
  menuItemId: 'test_menu_item_1',
  name: '测试商品',
  price: 25.50,
  quantity: 1,
  image: 'https://via.placeholder.com/100',
};

/**
 * 模拟单个用户下单
 */
async function simulateOrder(userId) {
  const startTime = performance.now();
  
  try {
    const response = await axios.post(
      `${CONFIG.BASE_URL}/api/orders`,
      {
        items: [mockCartItem],
        customerName: `测试用户${userId}`,
        phone: `1380000${String(userId).padStart(4, '0')}`,
        tableNumber: `T${userId}`,
      },
      {
        timeout: CONFIG.TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    results.responseTimes.push(responseTime);
    results.total++;
    results.success++;

    const order = response.data;
    
    // 检查订单号重复
    if (results.orderNumbers.has(order.orderNumber)) {
      results.duplicates.orderNumbers.push({
        userId,
        orderNumber: order.orderNumber,
        orderId: order.id,
      });
    } else {
      results.orderNumbers.add(order.orderNumber);
    }

    // 检查取单号重复
    if (order.pickupNumber !== undefined) {
      const pickupKey = `${order.pickupDate}_${order.pickupNumber}`;
      if (results.pickupNumbers.has(pickupKey)) {
        results.duplicates.pickupNumbers.push({
          userId,
          pickupNumber: order.pickupNumber,
          pickupDate: order.pickupDate,
          orderId: order.id,
        });
      } else {
        results.pickupNumbers.add(pickupKey);
      }
    }

    // 检查订单编码重复
    if (order.orderCode) {
      if (results.orderCodes.has(order.orderCode)) {
        results.duplicates.orderCodes.push({
          userId,
          orderCode: order.orderCode,
          orderId: order.id,
        });
      } else {
        results.orderCodes.add(order.orderCode);
      }
    }

    return {
      success: true,
      userId,
      order,
      responseTime,
    };
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    results.total++;
    results.failed++;
    results.responseTimes.push(responseTime);
    
    const errorInfo = {
      userId,
      error: error.message || String(error),
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      code: error.code, // 如 ECONNREFUSED
      responseTime,
    };
    
    results.errors.push(errorInfo);
    
    return {
      success: false,
      userId,
      error: errorInfo,
    };
  }
}

/**
 * 运行并发测试
 */
async function runConcurrentTest() {
  console.log('🚀 开始并发订单测试...\n');
  console.log(`配置信息:`);
  console.log(`- 并发用户数: ${CONFIG.CONCURRENT_USERS}`);
  console.log(`- API地址: ${CONFIG.BASE_URL}`);
  console.log(`- 超时时间: ${CONFIG.TIMEOUT}ms\n`);

  const startTime = performance.now();
  
  // 创建所有并发请求
  const promises = [];
  for (let i = 1; i <= CONFIG.CONCURRENT_USERS; i++) {
    promises.push(simulateOrder(i));
  }

  // 等待所有请求完成
  console.log(`⏳ 正在执行 ${CONFIG.CONCURRENT_USERS} 个并发请求...`);
  const responses = await Promise.allSettled(promises);
  
  const endTime = performance.now();
  const totalTime = endTime - startTime;

  // 统计结果
  const successful = responses.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = responses.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

  // 计算统计数据
  const avgResponseTime = results.responseTimes.length > 0
    ? results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length
    : 0;
  const minResponseTime = results.responseTimes.length > 0
    ? Math.min(...results.responseTimes)
    : 0;
  const maxResponseTime = results.responseTimes.length > 0
    ? Math.max(...results.responseTimes)
    : 0;

  // 输出测试结果
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试结果汇总');
  console.log('='.repeat(60));
  console.log(`总请求数: ${results.total}`);
  console.log(`成功: ${results.success} (${((results.success / results.total) * 100).toFixed(2)}%)`);
  console.log(`失败: ${results.failed} (${((results.failed / results.total) * 100).toFixed(2)}%)`);
  console.log(`总耗时: ${totalTime.toFixed(2)}ms`);
  console.log(`平均响应时间: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`最快响应: ${minResponseTime.toFixed(2)}ms`);
  console.log(`最慢响应: ${maxResponseTime.toFixed(2)}ms`);
  console.log(`QPS (每秒请求数): ${((results.total / totalTime) * 1000).toFixed(2)}`);

  console.log('\n' + '-'.repeat(60));
  console.log('🔍 数据完整性检查');
  console.log('-'.repeat(60));
  console.log(`唯一订单号数量: ${results.orderNumbers.size} / ${results.success}`);
  console.log(`唯一取单号数量: ${results.pickupNumbers.size} / ${results.success}`);
  console.log(`唯一订单编码数量: ${results.orderCodes.size} / ${results.success}`);

  // 检查重复问题
  if (results.duplicates.orderNumbers.length > 0) {
    console.log('\n❌ 发现订单号重复!');
    console.log(`重复数量: ${results.duplicates.orderNumbers.length}`);
    results.duplicates.orderNumbers.slice(0, 5).forEach(dup => {
      console.log(`  - 用户${dup.userId}: 订单号 ${dup.orderNumber} (订单ID: ${dup.orderId})`);
    });
  } else {
    console.log('\n✅ 订单号无重复');
  }

  if (results.duplicates.pickupNumbers.length > 0) {
    console.log('\n❌ 发现取单号重复!');
    console.log(`重复数量: ${results.duplicates.pickupNumbers.length}`);
    results.duplicates.pickupNumbers.slice(0, 5).forEach(dup => {
      console.log(`  - 用户${dup.userId}: 取单号 ${dup.pickupNumber} (日期: ${dup.pickupDate}, 订单ID: ${dup.orderId})`);
    });
  } else {
    console.log('\n✅ 取单号无重复');
  }

  if (results.duplicates.orderCodes.length > 0) {
    console.log('\n❌ 发现订单编码重复!');
    console.log(`重复数量: ${results.duplicates.orderCodes.length}`);
    results.duplicates.orderCodes.slice(0, 5).forEach(dup => {
      console.log(`  - 用户${dup.userId}: 订单编码 ${dup.orderCode} (订单ID: ${dup.orderId})`);
    });
  } else {
    console.log('\n✅ 订单编码无重复');
  }

  // 显示错误信息
  if (results.errors.length > 0) {
    console.log('\n' + '-'.repeat(60));
    console.log('❌ 错误详情');
    console.log('-'.repeat(60));
    results.errors.slice(0, 10).forEach((error, index) => {
      console.log(`\n错误 ${index + 1}:`);
      console.log(`  用户ID: ${error.userId}`);
      console.log(`  错误信息: ${error.error}`);
      if (error.code) {
        console.log(`  错误代码: ${error.code}`);
        if (error.code === 'ECONNREFUSED') {
          console.log(`  ⚠️  无法连接到服务器，请确保服务器已启动 (${CONFIG.BASE_URL})`);
        }
      }
      if (error.status) {
        console.log(`  HTTP状态: ${error.status} ${error.statusText || ''}`);
      }
      if (error.data) {
        console.log(`  响应数据: ${JSON.stringify(error.data)}`);
      }
      console.log(`  响应时间: ${error.responseTime.toFixed(2)}ms`);
    });
    if (results.errors.length > 10) {
      console.log(`\n... 还有 ${results.errors.length - 10} 个错误未显示`);
    }
  }

  // 性能评估
  console.log('\n' + '='.repeat(60));
  console.log('📈 性能评估');
  console.log('='.repeat(60));
  
  if (results.success === results.total && 
      results.duplicates.orderNumbers.length === 0 &&
      results.duplicates.pickupNumbers.length === 0 &&
      results.duplicates.orderCodes.length === 0) {
    console.log('✅ 系统通过了并发测试！');
    console.log(`   - 所有 ${CONFIG.CONCURRENT_USERS} 个并发请求都成功完成`);
    console.log(`   - 没有发现数据重复问题`);
    console.log(`   - 平均响应时间: ${avgResponseTime.toFixed(2)}ms`);
  } else {
    console.log('⚠️  系统在并发测试中发现了一些问题：');
    if (results.failed > 0) {
      console.log(`   - ${results.failed} 个请求失败`);
    }
    if (results.duplicates.orderNumbers.length > 0) {
      console.log(`   - 发现 ${results.duplicates.orderNumbers.length} 个重复的订单号`);
    }
    if (results.duplicates.pickupNumbers.length > 0) {
      console.log(`   - 发现 ${results.duplicates.pickupNumbers.length} 个重复的取单号`);
    }
    if (results.duplicates.orderCodes.length > 0) {
      console.log(`   - 发现 ${results.duplicates.orderCodes.length} 个重复的订单编码`);
    }
    console.log('\n💡 建议：');
    console.log('   1. 检查订单号生成逻辑是否使用了原子操作');
    console.log('   2. 考虑使用数据库事务或锁机制');
    console.log('   3. 对于文件系统操作，考虑使用文件锁或队列');
    console.log('   4. 检查服务器资源是否充足（CPU、内存、数据库连接数）');
  }

  console.log('\n' + '='.repeat(60));
}

// 运行测试
runConcurrentTest().catch(error => {
  console.error('\n❌ 测试执行失败:', error);
  process.exit(1);
});

export { runConcurrentTest, simulateOrder };


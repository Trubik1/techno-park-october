import http from 'http';

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:8000';

const ENDPOINTS = [
  { name: 'Frontend page', url: BASE_URL + '/', type: 'frontend' },
  { name: 'API quizzes', url: API_URL + '/api/quizzes/?public=true', type: 'api' },
];

const CONCURRENCY_LEVELS = [1, 5, 10, 25, 50, 100, 200, 500];
const REQUESTS_PER_TEST = 100;

function fetchUrl(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode, time: Date.now() - start, size: data.length });
      });
    }).on('error', (err) => {
      resolve({ ok: false, status: 0, time: Date.now() - start, size: 0, error: err.message });
    });
  });
}

async function runConcurrencyTest(endpoint, concurrency, totalRequests) {
  const results = [];
  const batches = Math.ceil(totalRequests / concurrency);

  for (let b = 0; b < batches; b++) {
    const batch = [];
    const count = Math.min(concurrency, totalRequests - b * concurrency);
    for (let i = 0; i < count; i++) {
      batch.push(fetchUrl(endpoint.url));
    }
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
  }

  const times = results.map(r => r.time);
  const successCount = results.filter(r => r.ok).length;
  const failCount = results.filter(r => !r.ok).length;

  times.sort((a, b) => a - b);

  return {
    endpoint: endpoint.name,
    concurrency,
    totalRequests: results.length,
    success: successCount,
    failed: failCount,
    successRate: ((successCount / results.length) * 100).toFixed(1),
    avgTime: (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1),
    minTime: times[0],
    maxTime: times[times.length - 1],
    medianTime: times[Math.floor(times.length / 2)],
    p95Time: times[Math.floor(times.length * 0.95)],
    p99Time: times[Math.floor(times.length * 0.99)],
  };
}

async function main() {
  console.log('=== ClassQuiz Load Test ===\n');
  console.log(`Testing ${CONCURRENCY_LEVELS.length} concurrency levels × ${ENDPOINTS.length} endpoints = ${CONCURRENCY_LEVELS.length * ENDPOINTS.length} tests`);
  console.log(`${REQUESTS_PER_TEST} requests per test\n`);

  const allResults = [];

  for (const endpoint of ENDPOINTS) {
    console.log(`\n--- ${endpoint.name} ---`);
    for (const concurrency of CONCURRENCY_LEVELS) {
      process.stdout.write(`  Concurrency ${concurrency.toString().padStart(3)}: `);
      try {
        const result = await runConcurrencyTest(endpoint, concurrency, REQUESTS_PER_TEST);
        allResults.push(result);
        process.stdout.write(`OK ${result.successRate}% | avg ${result.avgTime}ms | p95 ${result.p95Time}ms | p99 ${result.p99Time}ms\n`);
      } catch (err) {
        process.stdout.write(`ERROR: ${err.message}\n`);
      }
    }
  }

  const lines = [];
  lines.push('=== ClassQuiz Load Test Report ===');
  lines.push(`Date: ${new Date().toISOString()}`);
  lines.push(`Environment: Docker (Windows)`);
  lines.push('');
  lines.push('');
  lines.push('Results:');
  lines.push(''.padEnd(110, '-'));
  lines.push(`| ${'Endpoint'.padEnd(22)} | ${'Concurrency'.padEnd(10)} | ${'Requests'.padEnd(8)} | ${'OK %'.padEnd(6)} | ${'Avg(ms)'.padEnd(8)} | ${'Min(ms)'.padEnd(8)} | ${'P95(ms)'.padEnd(8)} | ${'P99(ms)'.padEnd(8)} | ${'Max(ms)'.padEnd(8)} |`);
  lines.push(''.padEnd(110, '-'));

  for (const r of allResults) {
    lines.push(`| ${r.endpoint.padEnd(22)} | ${String(r.concurrency).padEnd(10)} | ${String(r.totalRequests).padEnd(8)} | ${String(r.successRate).padEnd(6)} | ${String(r.avgTime).padEnd(8)} | ${String(r.minTime).padEnd(8)} | ${String(r.p95Time).padEnd(8)} | ${String(r.p99Time).padEnd(8)} | ${String(r.maxTime).padEnd(8)} |`);
  }
  lines.push(''.padEnd(110, '-'));

  const failedTests = allResults.filter(r => parseFloat(r.successRate) < 100);
  const avgResponse = allResults.filter(r => r.concurrency <= 50).reduce((s, r) => s + parseFloat(r.avgTime), 0) / allResults.filter(r => r.concurrency <= 50).length;

  lines.push('');
  lines.push('');
  lines.push('Summary:');
  lines.push(`  Total tests: ${allResults.length}`);
  lines.push(`  Tests with 100% success: ${allResults.filter(r => parseFloat(r.successRate) === 100).length}`);
  lines.push(`  Tests with failures: ${failedTests.length > 0 ? failedTests.map(r => `${r.endpoint}@${r.concurrency} (${r.successRate}%)`).join(', ') : 'none'}`);
  lines.push(`  Average response time (≤50 concurrent): ${avgResponse.toFixed(1)}ms`);
  lines.push(`  Max concurrency with 100% success: ${Math.max(...allResults.filter(r => parseFloat(r.successRate) === 100).map(r => r.concurrency))}`);

  const report = lines.join('\n');
  console.log('\n' + report);

  const fs = await import('fs');
  fs.writeFileSync('D:\\techno-park-october\\LOAD_TEST_REPORT.md', report, 'utf-8');
  console.log('\nReport saved to LOAD_TEST_REPORT.md');
}

main().catch(console.error);

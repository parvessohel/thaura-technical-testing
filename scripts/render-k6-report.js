const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');

const root = path.resolve(__dirname, '..');
const summaryPath = path.resolve(process.argv[2] || path.join(root, 'reports', 'k6-minimum-summary.json'));
const outputPath = path.resolve(process.argv[3] || path.join(root, 'reports', 'k6-minimum-report.html'));
const templatePath = path.join(root, 'templates', 'k6-report.njk');
const routes = ['/', '/pricing', '/api-platform', '/faq'];

function metric(summary, name) {
    return summary.metrics?.[name] || {};
}

function value(summary, name, field, fallback = 0) {
    const result = metric(summary, name)[field];
    return result === undefined ? fallback : result;
}

function formatNumber(number, suffix = '') {
    return `${Number(number).toFixed(2)}${suffix}`;
}

function formatBytes(bytes) {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${Number(bytes).toFixed(0)} B`;
}

if (!fs.existsSync(summaryPath)) {
    throw new Error(`Missing k6 summary file: ${summaryPath}`);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const failureRate = value(summary, 'http_req_failed', 'rate');
const p95 = value(summary, 'http_req_duration', 'p(95)');
const checksRate = value(summary, 'checks', 'value');
const requestCount = value(summary, 'http_reqs', 'count');
const failedStatus = failureRate < 0.05 ? 'PASS' : 'FAIL';
const durationStatus = p95 < 3000 ? 'PASS' : 'FAIL';
const checksStatus = checksRate === 1 ? 'PASS' : 'FAIL';
const result = failedStatus === 'PASS' && durationStatus === 'PASS' && checksStatus === 'PASS' ? 'PASS' : 'FAIL';

const report = {
    title: 'Thaura.ai Minimum k6 Load Test',
    generatedAt: new Date().toISOString(),
    baseUrl: process.env.THAURA_BASE_URL || 'https://thaura.ai',
    vus: process.env.K6_VUS || '2',
    duration: process.env.K6_DURATION || '20s',
    endpoints: routes.map(route => `${process.env.THAURA_BASE_URL || 'https://thaura.ai'}${route}`),
    result,
    resultClass: result === 'PASS' ? 'pass' : 'fail',
    requests: requestCount,
    failureRate: `${(failureRate * 100).toFixed(2)}%`,
    p95: `${formatNumber(p95, ' ms')}`,
    checks: [
        { name: 'HTTP request failure rate', value: `${(failureRate * 100).toFixed(2)}%`, threshold: '< 5%', status: failedStatus, class: failedStatus === 'PASS' ? 'pass' : 'fail' },
        { name: 'HTTP request duration p95', value: formatNumber(p95, ' ms'), threshold: '< 3000 ms', status: durationStatus, class: durationStatus === 'PASS' ? 'pass' : 'fail' },
        { name: 'Checks succeeded', value: `${(checksRate * 100).toFixed(2)}%`, threshold: '100%', status: checksStatus, class: checksStatus === 'PASS' ? 'pass' : 'fail' }
    ],
    average: formatNumber(value(summary, 'http_req_duration', 'avg'), ' ms'),
    median: formatNumber(value(summary, 'http_req_duration', 'med'), ' ms'),
    minimum: formatNumber(value(summary, 'http_req_duration', 'min'), ' ms'),
    maximum: formatNumber(value(summary, 'http_req_duration', 'max'), ' ms'),
    dataReceived: formatBytes(value(summary, 'data_received', 'count')),
    dataSent: formatBytes(value(summary, 'data_sent', 'count'))
};

nunjucks.configure(path.dirname(templatePath), { autoescape: true });
const html = nunjucks.render(path.basename(templatePath), report);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, html, 'utf8');
console.log(`Rendered ${outputPath}`);

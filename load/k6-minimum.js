import http from 'k6/http';
import { check, sleep } from 'k6';

const baseUrl = __ENV.THAURA_BASE_URL || 'https://thaura.ai';
const pages = ['/', '/pricing', '/api-platform', '/faq'];

export const options = {
    vus: Number(__ENV.K6_VUS || 2),
    duration: __ENV.K6_DURATION || '20s',
    thresholds: {
        http_req_failed: ['rate<0.05'],
        http_req_duration: ['p(95)<3000']
    }
};

export default function () {
    const route = pages[(__VU + __ITER) % pages.length];
    const response = http.get(`${baseUrl}${route}`, {
        tags: { route }
    });

    check(response, {
        [`${route} returns 200`]: result => result.status === 200,
        [`${route} returns HTML`]: result => String(result.headers['Content-Type'] || '').includes('text/html')
    });

    sleep(1);
}

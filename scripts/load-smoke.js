const pages = ['/', '/pricing', '/api-platform', '/faq'];
const baseUrl = process.env.THAURA_BASE_URL || 'https://thaura.ai';
const concurrency = Number(process.env.LOAD_CONCURRENCY || 5);
const iterations = Number(process.env.LOAD_ITERATIONS || 2);

async function requestPage(path) {
    const startedAt = performance.now();
    try {
        const response = await fetch(`${baseUrl}${path}`, { redirect: 'follow' });
        return {
            path,
            status: response.status,
            durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
            ok: response.ok
        };
    } catch (error) {
        return {
            path,
            status: null,
            durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
            ok: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

async function main() {
    const requests = [];
    for (let iteration = 0; iteration < iterations; iteration += 1) {
        for (const path of pages) {
            requests.push({ path, iteration });
        }
    }

    const results = [];
    for (let index = 0; index < requests.length; index += concurrency) {
        const batch = requests.slice(index, index + concurrency);
        results.push(...await Promise.all(batch.map(request => requestPage(request.path))));
    }

    const failures = results.filter(result => !result.ok);
    const durations = results.map(result => result.durationMs).sort((a, b) => a - b);
    const percentile = (value) => durations[Math.min(durations.length - 1, Math.floor(durations.length * value))];

    console.log(JSON.stringify({
        baseUrl,
        pages,
        concurrency,
        iterations,
        totalRequests: results.length,
        failures,
        latencyMs: {
            min: durations[0],
            median: percentile(0.5),
            p95: percentile(0.95),
            max: durations[durations.length - 1]
        },
        results
    }, null, 2));

    if (failures.length > 0) {
        process.exitCode = 1;
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});

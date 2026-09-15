const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'reports', 'TASK-01-TASK-02-BUG-REPORT.xlsx');

const columns = [
    'Bug ID',
    'Task',
    'Severity',
    'Area',
    'URL',
    'Steps',
    'Expected',
    'Actual',
    'Evidence',
    'Status',
    'Recommendation'
];

const findings = [
    {
        'Bug ID': 'T02-F-001', 'Task': 'Task 02', 'Severity': 'Medium', 'Area': 'Pricing calculation', 'URL': 'https://thaura.ai/pricing',
        'Steps': 'Open Pricing, select Annual, observe $12/month, $144/year, and Save 20%; calculate $12 x 12.',
        'Expected': 'Monthly price, annual price, and saving percentage are mathematically consistent.',
        'Actual': '$12 x 12 = $144, so the displayed annual price represents 0% saving, not 20%.',
        'Evidence': 'tests/pricing-consistency.spec.ts; reports/TASK-02-BUG-REPORT.md', 'Status': 'Confirmed defect',
        'Recommendation': 'Centralize pricing values and correct either the monthly base price or annual discount label.'
    },
    {
        'Bug ID': 'T02-F-002', 'Task': 'Task 02', 'Severity': 'Medium', 'Area': 'Pricing consistency', 'URL': 'https://thaura.ai/pricing; https://thaura.ai/faq',
        'Steps': 'Compare the Pro price on Pricing with the expanded pricing answer in FAQ.',
        'Expected': 'All public pages show the same current price.',
        'Actual': 'Pricing shows $12/month while FAQ references $15/month.',
        'Evidence': 'tests/pricing-consistency.spec.ts; tests/faq-pricing.spec.ts', 'Status': 'Confirmed inconsistency',
        'Recommendation': 'Use one shared pricing source for Pricing, FAQ, checkout, and marketing content.'
    },
    {
        'Bug ID': 'T02-F-003', 'Task': 'Task 02', 'Severity': 'Low', 'Area': 'Contact input limits', 'URL': 'https://thaura.ai/contact',
        'Steps': 'Inspect name, email, subject, and message fields; submit long Unicode/RTL/script-like input.',
        'Expected': 'Documented length limits are enforced and unusual input is safely handled.',
        'Actual': 'Fields exposed no client-side maxlength; unusual input returned without server error or reflected script.',
        'Evidence': 'tests/contact-inspection.spec.ts; tests/contact-input-security.spec.ts', 'Status': 'Observation; server limit not independently verified',
        'Recommendation': 'Define and test explicit server-side and client-side field limits.'
    },
    {
        'Bug ID': 'T02-F-004', 'Task': 'Task 02', 'Severity': 'Medium', 'Area': 'Firefox compatibility', 'URL': 'https://thaura.ai/',
        'Steps': 'Run the compatibility project for Firefox desktop and wait for page hydration.',
        'Expected': 'Homepage renders usable content in Firefox.',
        'Actual': 'Firefox returned 200 but remained on the loading spinner with no rendered body content.',
        'Evidence': 'tests/compatibility.spec.ts; reports/TASK-02-BUG-REPORT.md', 'Status': 'Confirmed compatibility failure',
        'Recommendation': 'Investigate Firefox-specific hydration, JavaScript, or resource-loading behavior.'
    },
    {
        'Bug ID': 'T02-F-005', 'Task': 'Task 02', 'Severity': 'Medium', 'Area': 'Contact delivery', 'URL': 'https://backend.thaura.ai/api/communications/send',
        'Steps': 'Submit a uniquely marked valid Contact form message and search the controlled inbox.',
        'Expected': 'Submitted data is received by the configured recipient.',
        'Actual': 'API/UI submission returned success, but recipient delivery could not be independently verified.',
        'Evidence': 'tests/contact-submission.spec.ts; TESTING-TODO.md', 'Status': 'Blocked: recipient mailbox unavailable',
        'Recommendation': 'Identify or configure a controlled recipient mailbox and repeat marker-based delivery verification.'
    },
    {
        'Bug ID': 'T02-F-006', 'Task': 'Task 02', 'Severity': 'Informational', 'Area': 'Lighthouse API audit', 'URL': 'https://thaura.ai/api',
        'Steps': 'Run the configured Lighthouse API audit anonymously.',
        'Expected': 'Key-page Lighthouse metrics are captured.',
        'Actual': 'The route returned 401, so performance metrics were unavailable; /api-platform is the public documentation page.',
        'Evidence': 'reports/lighthouse-api.json; README.md', 'Status': 'Blocked by protected route',
        'Recommendation': 'Keep the 401 as evidence or audit /api-platform separately for public documentation performance.'
    },
    {
        'Bug ID': 'T02-F-007', 'Task': 'Task 02', 'Severity': 'Informational', 'Area': 'Performance metrics', 'URL': 'https://thaura.ai/',
        'Steps': 'Review stored Lighthouse lab metrics.',
        'Expected': 'Requested Core Web Vitals are reported where supported.',
        'Actual': 'FCP, LCP, CLS, TBT, Speed Index, and root response time were available; INP/FID was unavailable in lab evidence.',
        'Evidence': 'reports/lighthouse-home.json; reports/TASK-02-BUG-REPORT.md', 'Status': 'Deferred: metric unavailable',
        'Recommendation': 'Use field/RUM data if INP is required; do not infer INP/FID from other metrics.'
    },
    {
        'Bug ID': 'T01-F-001', 'Task': 'Task 01', 'Severity': 'Medium', 'Area': 'Free-tier quota window', 'URL': 'https://thaura.ai/',
        'Steps': 'Open a Free account after quota exhaustion and inspect the limit message.',
        'Expected': 'The documented 5-message/2-hour behavior is confirmed.',
        'Actual': 'The product displayed 5 messages every 5 hours; a fresh #5/#6 boundary run was unavailable.',
        'Evidence': 'tests/task01/free-tier-quota.spec.ts; reports/task01/TASK-01-REPORT.md', 'Status': 'Partial; state-dependent verification deferred',
        'Recommendation': 'Repeat with a genuinely fresh quota bucket and reconcile the product window with the assignment wording.'
    },
    {
        'Bug ID': 'T01-F-002', 'Task': 'Task 01', 'Severity': 'Medium', 'Area': 'Upload data integrity', 'URL': 'https://thaura.ai/',
        'Steps': 'Select PDF, CSV, image, corrupted, empty, oversized, and password-protected fixtures; request analysis.',
        'Expected': 'Parsed content is accurate and invalid files return clear errors without silent failure.',
        'Actual': 'Upload control accepted safe fixtures, but assistant-side parsing and full invalid-file processing were not completed.',
        'Evidence': 'tests/task01/upload-integrity.spec.ts; reports/task01/TASK-01-REPORT.md', 'Status': 'Partial; processing verification deferred',
        'Recommendation': 'Repeat with available message quota and controlled fixtures, then validate extracted values and errors.'
    },
    {
        'Bug ID': 'T01-F-003', 'Task': 'Task 01', 'Severity': 'Medium', 'Area': 'Memory and Incognito', 'URL': 'https://thaura.ai/',
        'Steps': 'Store a fact in normal mode, retrieve it in a new chat, then compare Incognito history and memory.',
        'Expected': 'Normal memory persists; Incognito content does not persist or leak into memory.',
        'Actual': 'Controls were verified, but a successful memory-setting conversation was unavailable for end-to-end verification.',
        'Evidence': 'tests/task01/memory-incognito.spec.ts; reports/task01/TASK-01-REPORT.md', 'Status': 'Partial; state-dependent verification deferred',
        'Recommendation': 'Repeat with a fresh usable conversation state; document server-backup deletion as client-side unverifiable.'
    },
    {
        'Bug ID': 'T01-F-004', 'Task': 'Task 01', 'Severity': 'Medium', 'Area': 'Developer API funded behavior', 'URL': 'https://backend.thaura.ai/v1/chat/completions',
        'Steps': 'Send minimal authenticated inference request with the dedicated API key.',
        'Expected': 'Funded key returns documented streaming/non-streaming response and usage schema.',
        'Actual': 'Key was recognized but returned documented 402 Insufficient balance; funded inference was unavailable.',
        'Evidence': 'tests/task01/developer-api-authenticated.spec.ts; reports/task01/TASK-01-REPORT.md', 'Status': 'Partial; zero-balance verification boundary',
        'Recommendation': 'Repeat with an approved funded test key and minimal token budget.'
    },
    {
        'Bug ID': 'T01-F-005', 'Task': 'Task 01', 'Severity': 'Informational', 'Area': 'Settings/Account/Billing inputs', 'URL': 'https://thaura.ai/',
        'Steps': 'Open authenticated account controls and inspect Settings/Account/Billing forms.',
        'Expected': 'Exposed fields are covered by negative and boundary tests.',
        'Actual': 'No editable Settings/Account/Billing surface was exposed in the current UI probe.',
        'Evidence': 'tests/task01/negative-boundary.spec.ts; reports/task01/TASK-01-REPORT.md', 'Status': 'Deferred: surface not exposed',
        'Recommendation': 'Locate the product routes or enable the relevant surface, then add field-level boundary tests.'
    }
];

const workbook = XLSX.utils.book_new();
const sheet = XLSX.utils.json_to_sheet(findings, { header: columns });
sheet['!cols'] = columns.map(column => ({ wch: Math.min(48, Math.max(14, column.length + 4)) }));
sheet['!autofilter'] = { ref: `A1:K${findings.length + 1}` };
XLSX.utils.book_append_sheet(workbook, sheet, 'Bug Register');

const summaryRows = [
    { Metric: 'Total findings', Value: findings.length },
    { Metric: 'Task 01 findings', Value: findings.filter(row => row.Task === 'Task 01').length },
    { Metric: 'Task 02 findings', Value: findings.filter(row => row.Task === 'Task 02').length },
    { Metric: 'Confirmed defects/inconsistencies', Value: findings.filter(row => /Confirmed/.test(row.Status)).length },
    { Metric: 'Partial/deferred/blocked', Value: findings.filter(row => /Partial|Blocked|Deferred|Observation/.test(row.Status)).length }
];
const summary = XLSX.utils.json_to_sheet(summaryRows);
summary['!cols'] = [{ wch: 38 }, { wch: 18 }];
XLSX.utils.book_append_sheet(workbook, summary, 'Summary');

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
XLSX.writeFile(workbook, outputPath);
console.log(`Generated ${outputPath} with ${findings.length} findings`);

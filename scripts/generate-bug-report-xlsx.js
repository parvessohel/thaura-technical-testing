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
    'Request/Response or Console Evidence',
    'Status',
    'Recommendation'
];

const evidenceDetails = {
    'T02-F-001': 'Pricing extraction: monthlyPrice=12, annualPrice=144, statedSaving=20; calculatedSaving=0.',
    'T02-F-002': 'Pricing page text contains $12/month; FAQ pricing answer contains $15.',
    'T02-F-003': 'Contact POST returned 200; fields reported maxLength=-1; no reflected script text observed.',
    'T02-F-004': 'Firefox navigation returned HTTP 200; intermittent on 2026-09-17 retest: 2 passes and 1 failure across 3 runs with empty body content on failure.',
    'T02-F-005': 'POST /api/communications/send returned 200; reply from info@thaura.ai quoted the exact submitted Name/Email/Subject/Message, confirming delivery.',
    'T02-F-006': 'Lighthouse document request for /api returned 401 ERRORED_DOCUMENT_REQUEST.',
    'T02-F-007': 'Lighthouse captured FCP/LCP/CLS/TBT/Speed Index/root response time; INP/FID was unavailable.',
    'T02-F-008': 'Submission at 2026-09-14 18:15:55 received a reply at 2026-09-16 14:31, approximately 44 hours later, versus the page\'s stated 24-hour commitment.',
    'T01-F-001': 'Free account UI displayed: Out of messages; 5 messages every 5 hours; reset countdown approximately 5 hours.',
    'T01-F-002': 'Upload UI rendered PDF/CSV/SVG attachment chips; parsing request was not completed due to state-dependent limit.',
    'T01-F-003': 'Memory panel opened; empty state observed; Incognito control visible and activatable.',
    'T01-F-004': 'POST /v1/chat/completions with accepted API key returned 402 Insufficient balance; invalid model returned 400.',
    'T01-F-005': 'Authenticated UI probe exposed account menu but no editable Settings/Account/Billing form controls.'
};

const findings = [
    {
        'Bug ID': 'T02-F-001', 'Task': 'Task 02', 'Severity': 'Medium', 'Area': 'Pricing calculation', 'URL': 'https://thaura.ai/pricing',
        'Steps': 'Open Pricing, select Annual, observe $12/month, $144/year, and Save 20%; calculate $12 x 12.',
        'Expected': 'Monthly price, annual price, and saving percentage are mathematically consistent.',
        'Actual': '$12 x 12 = $144, so the displayed annual price represents 0% saving, not 20%.',
        'Evidence': 'tests/task02/pricing-consistency.spec.ts; reports/task02/TASK-02-BUG-REPORT.md', 'Status': 'Confirmed defect',
        'Recommendation': 'Centralize pricing values and correct either the monthly base price or annual discount label.'
    },
    {
        'Bug ID': 'T02-F-002', 'Task': 'Task 02', 'Severity': 'Medium', 'Area': 'Pricing consistency', 'URL': 'https://thaura.ai/pricing; https://thaura.ai/faq',
        'Steps': 'Compare the Pro price on Pricing with the expanded pricing answer in FAQ.',
        'Expected': 'All public pages show the same current price.',
        'Actual': 'Pricing shows $12/month while FAQ references $15/month.',
        'Evidence': 'tests/task02/pricing-consistency.spec.ts; tests/task02/faq-pricing.spec.ts', 'Status': 'Confirmed inconsistency',
        'Recommendation': 'Use one shared pricing source for Pricing, FAQ, checkout, and marketing content.'
    },
    {
        'Bug ID': 'T02-F-003', 'Task': 'Task 02', 'Severity': 'Low', 'Area': 'Contact input limits', 'URL': 'https://thaura.ai/contact',
        'Steps': 'Inspect name, email, subject, and message fields; submit long Unicode/RTL/script-like input.',
        'Expected': 'Documented length limits are enforced and unusual input is safely handled.',
        'Actual': 'Fields exposed no client-side maxlength; unusual input returned without server error or reflected script.',
        'Evidence': 'tests/task02/contact-inspection.spec.ts; tests/task02/contact-input-security.spec.ts', 'Status': 'Observation; server limit not independently verified',
        'Recommendation': 'Define and test explicit server-side and client-side field limits.'
    },
    {
        'Bug ID': 'T02-F-004', 'Task': 'Task 02', 'Severity': 'Medium', 'Area': 'Firefox compatibility', 'URL': 'https://thaura.ai/',
        'Steps': 'Run the compatibility project for Firefox desktop, repeated across multiple runs, and wait for page hydration.',
        'Expected': 'Homepage reliably renders usable content in Firefox on every run.',
        'Actual': 'Intermittent: 2026-09-17 retest showed 2 passes and 1 failure across 3 runs; on failure, Firefox returned 200 but remained on the loading spinner with no rendered body content.',
        'Evidence': 'tests/task02/compatibility.spec.ts; reports/task02/TASK-02-BUG-REPORT.md', 'Status': 'Confirmed intermittent compatibility issue',
        'Recommendation': 'Investigate Firefox-specific hydration/timing race condition; not a hard incompatibility since it does not fail every run.'
    },
    {
        'Bug ID': 'T02-F-005', 'Task': 'Task 02', 'Severity': 'Informational', 'Area': 'Contact delivery', 'URL': 'https://backend.thaura.ai/api/communications/send',
        'Steps': 'Submit a valid Contact form message and check for delivery confirmation via reply.',
        'Expected': 'Submitted data is received by the configured recipient.',
        'Actual': 'API/UI submission returned success; a manual submission received a reply from info@thaura.ai quoting the exact submitted Name, Email, Subject, and Message, confirming end-to-end delivery.',
        'Evidence': 'tests/task02/contact-submission.spec.ts; TESTING-TODO.md; reply email from info@thaura.ai dated 2026-09-16', 'Status': 'Confirmed: delivery verified',
        'Recommendation': 'No further action; delivery is confirmed. Consider a controlled mailbox for repeatable automated verification.'
    },
    {
        'Bug ID': 'T02-F-008', 'Task': 'Task 02', 'Severity': 'Low', 'Area': 'Contact response SLA', 'URL': 'https://thaura.ai/contact',
        'Steps': 'Submit a valid Contact form message, note the timestamp, and measure time until a reply arrives.',
        'Expected': 'A reply arrives within the page\'s stated 24-hour commitment.',
        'Actual': 'A reply arrived approximately 44 hours after submission, exceeding the stated 24-hour commitment.',
        'Evidence': 'Reply email from info@thaura.ai dated 2026-09-16 14:31 responding to a submission dated 2026-09-14 18:15:55', 'Status': 'Observation: single instance, not a confirmed pattern',
        'Recommendation': 'Resource the Contact inbox to meet the stated SLA, or update the displayed SLA text to match actual response times.'
    },
    {
        'Bug ID': 'T02-F-006', 'Task': 'Task 02', 'Severity': 'Informational', 'Area': 'Lighthouse API audit', 'URL': 'https://thaura.ai/api',
        'Steps': 'Run the configured Lighthouse API audit anonymously.',
        'Expected': 'Key-page Lighthouse metrics are captured.',
        'Actual': 'The route returned 401, so performance metrics were unavailable; /api-platform is the public documentation page.',
        'Evidence': 'reports/task02/lighthouse-api.json; README.md', 'Status': 'Blocked by protected route',
        'Recommendation': 'Keep the 401 as evidence or audit /api-platform separately for public documentation performance.'
    },
    {
        'Bug ID': 'T02-F-007', 'Task': 'Task 02', 'Severity': 'Informational', 'Area': 'Performance metrics', 'URL': 'https://thaura.ai/',
        'Steps': 'Review stored Lighthouse lab metrics.',
        'Expected': 'Requested Core Web Vitals are reported where supported.',
        'Actual': 'FCP, LCP, CLS, TBT, Speed Index, and root response time were available; INP/FID was unavailable in lab evidence.',
        'Evidence': 'reports/task02/lighthouse-home.json; reports/task02/TASK-02-BUG-REPORT.md', 'Status': 'Deferred: metric unavailable',
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

for (const finding of findings) {
    finding['Request/Response or Console Evidence'] = evidenceDetails[finding['Bug ID']];
}

const workbook = XLSX.utils.book_new();
const sheet = XLSX.utils.json_to_sheet(findings, { header: columns });
sheet['!cols'] = columns.map(column => ({ wch: Math.min(48, Math.max(14, column.length + 4)) }));
sheet['!autofilter'] = { ref: `A1:L${findings.length + 1}` };
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

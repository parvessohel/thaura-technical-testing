# Task 03: AI & Testing Reflection

## 1. How AI will impact software testing over the next 2–3 years

AI will make test creation and maintenance much faster, especially for exploratory coverage, test-data generation, locator discovery, API contract checks, and failure analysis. Test engineers will be able to describe a workflow in plain language and quickly produce an initial automated test, then focus their time on deciding what should be tested and whether the evidence is trustworthy.

I do not think AI will remove the need for test engineers. The difficult part of testing is not only writing code; it is understanding risk, choosing useful boundaries, interpreting ambiguous results, and deciding whether a test actually proves the requirement. AI-generated tests can also be overconfident, duplicate each other, or validate the wrong behavior. Human review will remain essential for test strategy, data integrity, security, and release decisions.

I expect the strongest teams to use AI as an engineering assistant combined with strong evidence practices: reproducible tests, controlled data, clear assertions, traceable reports, and explicit blocked or unverified states.

## 2. How I use AI in testing

Yes, I use AI directly in testing work. In this assessment it helped me:

- Turn the written requirements into a test-coverage matrix.
- Identify the nearest code and test surface before making changes.
- Build Playwright tests for public pages and authenticated workflows.
- Automate Gmail OTP retrieval and reusable browser-state creation.
- Inspect live UI controls and network requests to discover actual API behavior.
- Generate safe synthetic fixtures for upload testing.
- Diagnose flaky or brittle assertions and improve them after real test failures.
- Compare pricing and technical claims across pages.
- Generate Lighthouse, k6, Markdown, HTML, and Excel reporting artifacts.
- Separate confirmed defects from limitations caused by unavailable state, balance, or recipient access.

I still review the implementation and the test output manually. For example, when a test reported a failure, I checked whether it was a product defect, a stale selector, an expired session, or a test-design problem before changing the code.

## 3. AI tools I use

The main tool I use is GitHub Copilot in VS Code. I use it for repository exploration, implementation, test design, debugging, report writing, and command-line workflow support.

I also use the normal developer tools around it:

- Playwright for browser automation.
- Lighthouse for performance and quality audits.
- k6 for controlled load checks.
- Gmail API/OAuth for automated OTP retrieval.
- Node.js scripts for report generation and evidence processing.
- Git for branches, commits, and reproducible review history.

The AI is useful because it works directly alongside these tools and can help connect browser evidence, source files, test results, and documentation in one workflow.

## 4. The AI tool I find most helpful for testing

GitHub Copilot in VS Code is currently the most useful tool for my testing work because it stays close to the repository and the execution environment. It can inspect the existing test structure, make a focused change, run the relevant test, interpret the failure, and help update the report without losing the relationship between code and evidence.

The most useful part is not simply generating test code. It is the feedback loop:

1. Translate a requirement into a testable behavior.
2. Inspect the real application and existing code.
3. Implement a small automated check.
4. Run it against the live system.
5. Investigate failures instead of assuming the first explanation is correct.
6. Record the result, limitation, or defect in a reproducible report.

That workflow helped this project identify real issues such as inconsistent pricing, the Firefox loading problem, and the difference between a successful contact-form submission response and independently verified email delivery.

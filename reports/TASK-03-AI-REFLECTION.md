# Task 03: AI & Testing Reflection

## 1. How AI will impact software testing over the next 2–3 years

AI will make testing faster and more efficient, especially for repetitive work like writing smoke tests, generating Playwright flows, creating API checks, and building edge-case scenarios. It will also help testers move quickly when they need to inspect logs, review failed runs, or understand a large codebase.

I do not think AI will replace testers. It will change what testers spend their time on. More of the low-level mechanical work will be automated, while human testers will focus more on risk, coverage, clarity, and evidence. The best teams will use AI as a strong assistant, not as a shortcut to skip judgment.

## 2. Do I personally use AI? Does it help me in testing?

Yes. I use AI regularly in my testing work, and it helps me a lot. In practice, I use it to:

- generate Playwright scripts for browser validation
- draft or refine k6 scripts for load/performance checks
- create test cases and assertions from requirements
- understand failure output and narrow root causes faster
- review logs, trends, and report data more quickly
- summarize findings and generate documentation for test results
- speed up repetitive tasks like script creation and validation logic

I still review everything manually. I validate generated scripts against real behavior, run them, and check whether they are actually testing the right thing. AI helps me work faster, but I do not trust it blindly.

## 3. Which AI tools do I currently use?

The main tool I use is GitHub Copilot in VS Code. I also use the broader testing stack around it, including:

- Playwright for browser automation
- k6 for performance/load testing
- Lighthouse for quality and performance checks
- custom agent workflows with MCP server support to generate performance test flows from Swagger/OpenAPI specs
- Node.js scripts for report generation and analysis
- VS Code for coding, debugging, and AI-assisted development

## 4. Which AI tool do I find most helpful for testing, and why?

GitHub Copilot in VS Code is the most helpful for me because it sits directly in my workflow. It helps me move from a requirement to a working script quickly, and it is especially useful when I am debugging failed tests or turning raw output into useful analysis.

In my hands-on work, it has been valuable for generating Playwright scripts, creating validation logic, and using custom agents with MCP-based Swagger workflow generation to turn API contracts into performance test flows much faster. I still keep final responsibility for quality and correctness, but the tool helps me work faster and think more clearly.

Overall, I see AI as a powerful testing assistant. It helps me be more productive, but good testing still depends on human judgment, verification, and real evidence.

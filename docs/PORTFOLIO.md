# LinkedIn and portfolio material

## Project title

KYZ — Watch Explorer | Full-stack watch discovery and comparison

## Project description

Reworked my university watch website into a responsive discovery application using React, TypeScript, Node.js, Express and SQLite. Features include searchable and filterable watch references, persistent browser shortlists, shareable comparisons, a catalogue advisor and a protected catalogue editor.

The engineering work focuses on input validation, server-side secret handling, strict budget matching, database persistence, accessibility and automated verification. Collection insights demonstrate SQL aggregation and data presentation using explicitly labelled sample and synthetic data. Docker and GitHub Actions provide a reproducible build and verification workflow. Optional OpenAI integration supports general educational explanations with a built-in fallback.

## LinkedIn post draft

I’ve been revisiting one of my university projects: KYZ, a luxury-watch website.

I wanted to take it further and work through the engineering behind a complete application. The updated KYZ Watch Explorer now includes saved shortlists, side-by-side comparisons, a persistent catalogue, a protected editor and a watch advisor that respects brand and budget constraints.

The most useful part was improving the foundations: moving credentials out of the browser, fixing recommendation edge cases, making the mobile interface more accessible, and adding automated API and browser tests.

I also added collection analytics, with sample prices and synthetic histories clearly identified, plus a Docker setup and a GitHub Actions verification workflow.

Built with React, TypeScript, Node.js, Express and SQLite, with optional server-side OpenAI integration. I used AI-assisted implementation and review, and documented the decisions and trade-offs as part of the project.

#SoftwareEngineering #React #TypeScript #NodeJS #DevOps #DataAnalytics #PortfolioProject

Before posting, add the actual public repository/demo links after they exist. Do not claim a public deployment or successful hosted CI run until those steps have occurred.

## A practical 2-minute demo

1. Introduce the original university project and show the new homepage.
2. Filter the collection to Rolex below $25,000; show that only valid matches remain.
3. Save a watch, refresh and open the shortlist.
4. Compare two references and open the shareable comparison URL.
5. Ask the advisor for Rolex under $100: show the honest no-match response. Then ask for Rolex under $25k.
6. Open a specification dialog, view the example chart, and use Escape to close it.
7. Show collection statistics, their sample-data labels and CSV export.
8. Explain the API/database boundary and show the test summary. Demonstrate editor access privately, with the access key off-screen.

## Be ready to explain

- Why SQLite was chosen and how persistence and safe seeding work.
- Why filtering must happen before ranking recommendations.
- The difference between a bounded rule-based advisor, AI API integration and a trained ML model.
- Why synthetic data cannot demonstrate forecasting accuracy.
- Which browser behaviours are local storage versus server persistence.
- How private editor access, validation, request limits and deployment fit together.
- What you would change for multiple users, a real dataset or larger scale.

## Skills this project can substantiate

**Software engineering:** React/TypeScript UI, HTTP API, database design, validation, state, error handling and regression tests.

**AI integration:** Server-side model requests, bounded prompts, timeouts, controlled fallbacks and deterministic recommendation constraints. A live provider call needs your configured credentials; tests use fixtures. This is not evidence of training a model.

**DevOps:** Reproducible build, production server, health endpoint, container configuration, persistent volume, CI configuration and dependency maintenance. Hosted operation and cloud metrics require a subsequent deployment.

**Data analysis:** Numeric data modelling, SQL summaries, median/mean, labelled visualisation and CSV export. Analysis uses demonstration data, not real-market conclusions.

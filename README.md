# IT Operations Dashboard

An interactive IT helpdesk dashboard built as a portfolio project while studying for the Google IT Support Professional Certificate. It demonstrates networking fundamentals, identity provisioning workflows, security concepts, and CompTIA A+ study material — all in one place, built entirely with vanilla HTML, CSS, and JavaScript (no frameworks).

**[Live demo](https://hunterbambam-design.github.io/Test-IT-dashboard-V2.1/)** — replace this with your GitHub Pages link once it's enabled (see below).

## What's in it

- **Diagnostics & Subnet Calculator** — simulated ping/traceroute, plus a real IPv4 subnet calculator and RAID capacity/fault-tolerance calculator
- **Helpdesk Ticket Operations** — keyword-based ticket triage with an interactive kanban board (New → In Progress → Resolved)
- **Common Issue Decision Tree** — a step-by-step Tier 1 troubleshooting wizard
- **Multi-Platform Provisioner** — generates sample AD, Entra ID, or Linux account-creation scripts
- **Batch User CSV Generator** — downloads a real AD/Microsoft 365-formatted bulk-import CSV
- **Interactive CLI Reference** — searchable Windows/Linux command list
- **Password Strength & Entropy Analyzer** — real entropy math and crack-time estimation, nothing stored or transmitted
- **Phishing Email Header Analyzer** — real regex-based parsing of SPF/DKIM/DMARC results and originating IP from pasted email headers
- **Firewall Alert Monitor** — a static sample alert demonstrating the UI pattern
- **CompTIA A+ Exam Engine** — flashcards, a scored practice quiz, and an interactive OSI model diagram
- **Activity Log** — every action is tracked locally and can be exported as JSON

## Why it's built this way

This is a demo, not production software, and it's honest about that everywhere in the UI. A few things worth knowing:

- Everything runs entirely in the browser — no backend, no real accounts, no network calls anywhere
- All data lives in `localStorage` and stays on your device; nothing is ever sent anywhere
- Generated scripts and CSVs are realistic templates for demonstration, not meant to be run against real systems
- The Subnet Calculator, RAID Calculator, and Phishing Header Analyzer do genuine math/parsing on whatever you type in — they're not simulated output like some of the other tools

See the in-app "Project Info" panel (top of the dashboard) for the full changelog and known limitations.

## Built with

Vanilla HTML, CSS, and JavaScript. No frameworks, no build step, no dependencies.

## Running it locally

Clone the repo and open `index.html` in any browser — that's it, no install step required.

```bash
git clone https://github.com/YOUR-USERNAME/it-operations-dashboard.git
cd it-operations-dashboard
open index.html
```

# IT Operations Dashboard

🚀 **[Click Here to Open the Live Demo](https://github.io)**

A zero-setup, browser-based sandbox for practicing entry-level helpdesk and IT support work — ticket triage, network math, identity provisioning, and phishing analysis — without touching real infrastructure.

## Problem Statement

Entry-level helpdesk professionals need hands-on reps across multiple platforms — Active Directory, network diagnostics, phishing header analysis — before they're trusted anywhere near production systems. Most training resources are either purely theoretical (slides, flashcards) or require a live lab environment that's expensive and risky to set up. This dashboard closes that gap: every tool runs entirely in the browser, so a learner can practice real workflows with zero installation and zero risk to real systems.

## Core Modules

- **Helpdesk Ticket Operations** — Keyword-based triage engine that auto-routes tickets to the correct queue and priority level, plus a live kanban board for moving tickets through New → In Progress → Resolved.
- **Core Networking Suite** — Real IPv4 subnet calculator, RAID array capacity/fault-tolerance calculator, an HTTP status code reference, and a regex-based phishing email header analyzer that checks SPF/DKIM/DMARC and flags domain mismatches.
- **Provisioning Tools** — Generates sample user attributes and matching script syntax for Active Directory, Microsoft Entra ID, and Linux account creation.
- **A+ Exam Engine** — Interactive flashcard stack across six CompTIA A+ topic areas, a randomized 5-question scored practice quiz pulled from an 18-question bank, and a clickable OSI 7-layer diagram.

## Engineering Reflection: Why It's All Client-Side

Every piece of state — quiz scores, ticket board, provisioning history, activity log, theme — lives in the browser's `localStorage`. That's a deliberate tradeoff, not an oversight: it means anyone can open the page and start using every tool immediately, with no backend, no database, and no account to set up.

That same tradeoff is exactly what makes this unsuitable as-is for a real corporate environment. A production version would need:

- Server-side validation on every input, since client-side checks can be bypassed entirely.
- Real authentication before any identity or provisioning data is touched.
- Rate limiting on anything resembling the phishing/security tools to prevent abuse.
- Server-side logging instead of a browser's local storage, which any user can clear or edit.

This project is intentionally a demo, and it's upfront about that boundary rather than pretending otherwise.

## Tech Stack

Vanilla JavaScript, semantic HTML5, and hand-written CSS using custom properties for dark/light theming. No frameworks, no build step, no backend.

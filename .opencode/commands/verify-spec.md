---
description: Verify and update acceptance criteria for a spec using spec-acceptance-verifier
agent: spec-acceptance-verifier
---

Verify, correct, and update the acceptance criteria in the specification file: $ARGUMENTS

Follow the spec-acceptance-verifier workflow:
- Read the spec and related implementation/reference files.
- Verify each criterion against the current codebase, checks, and UI evidence when applicable.
- Use Context7 for Next.js recommendations when relevant.
- Use Playwright MCP for screen-related criteria when the app/UI must be verified.
- Update the spec with accurate checkbox states (`[x]`/`[ ]`) and minimal necessary corrections.
- If all acceptance criteria are verified as true, set the spec status to `Implementado`.

Report what was verified, evidence (files, commands, Context7 guidance, Playwright artifacts/comparisons), and any criteria that remain unverified with reasons.

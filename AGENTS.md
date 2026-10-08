# Agent Instructions

- Follow existing project patterns; reuse components, utilities, hooks, types, and API patterns.
- Make only minimal changes required for the task. Do not refactor unrelated code or alter existing behavior.
- Keep components focused and files small; separate UI, logic, API calls, types, and constants appropriately.
- Prefer Tailwind utilities; never use arbitrary Tailwind values.
- Remove dead code and unused imports. Add comments only for non-obvious logic.
- Handle loading and errors using existing project patterns.
- Avoid unnecessary re-renders, API calls, and computations.
- Never expose secrets or sensitive data anywhere client-accessible, including browser storage, HTML, responses, logs, source maps, or Git.
- Never hardcode, mock, or add fallback portfolio content. All user-facing content must come from the CMS/backend.
- Before writing Next.js code, read the relevant documentation in `node_modules/next/dist/docs/`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

Import Formatting: Keep imports consistently formatted and organized in every newly generated file.
No Arbitrary Classes: Do not use arbitrary Tailwind values such as w-[123px]; use existing Tailwind utilities or project-defined values.
Keep Files Small: If a file becomes too long or complex, split it into smaller, focused files/components.
Reuse Components: Use existing common components wherever possible, especially for UI elements such as buttons, inputs, modals, toasts, and dropdowns.
Avoid Duplication: Reuse existing logic and utilities instead of duplicating functionality.
Minimal Changes: Make only the changes necessary for the requested feature or fix and avoid affecting existing flows.
Remove Dead Code: Remove unused imports, variables, functions, components, commented-out code, and other dead code when making changes.
Meaningful Comments: Add only concise, meaningful comments that explain non-obvious logic; keep comments natural and human-readable
Separate Concerns:Keep common logic, types, and constants in separate, dedicated files.
Component Responsibility: Keep components focused on one responsibility; move complex logic into hooks or utilities.
API Separation: Keep API calls and request/response handling separate from UI components.
Error Handling: Handle API errors and loading states consistently using existing project patterns.
Responsive UI: Ensure new UI works across supported screen sizes without breaking existing layouts.
Performance: Avoid unnecessary re-renders, API calls, and expensive computations; use memoization only when it provides a real benefit.
No Static Code

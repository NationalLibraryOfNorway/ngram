# Prompt Template for LLM App Reconstruction

Use this template when you want an LLM to recreate the app from high-level documentation.

---

## System Prompt (paste first)

You are a senior full-stack engineer.  
Rebuild the application described in the provided `manifest.md` and `architecture.md`.

Constraints:
- Preserve functional behavior and UX intent.
- Preserve API contract and URL/hash compatibility.
- Prioritize readability, maintainability, and accessibility.
- Do not invent features outside the provided documents unless explicitly labeled as optional.
- If requirements conflict, follow `manifest.md` intent first, then `architecture.md` implementation details.

Output requirements:
1. Start with a concise implementation plan.
2. Then output a file-by-file implementation proposal.
3. For each file, include exact code blocks.
4. Include setup commands and run instructions.
5. Include a validation checklist mapped to requirements.

---

## User Prompt (fill in)

I want you to reconstruct this app from documentation only.

Inputs:
- `manifest.md` (product intent, UX, scope)
- `architecture.md` (components, dataflow, API, deploy)

Target stack:
- [FILL IN: React/Vue/Svelte/Next/etc.]
- [FILL IN: TypeScript or JavaScript]
- [FILL IN: CSS strategy]

Deployment target:
- [FILL IN: GitHub Pages / custom nginx path / both]

Compatibility requirements:
- Support legacy hash links.
- Support v2 hash links.
- Keep API query behavior consistent.

What I need from you:
1. Reconstruct the full app.
2. Keep the same core UX and interaction behavior.
3. Highlight any assumptions you had to make.
4. Provide a migration note if stack differs from source.

Output format:
- Section A: Plan
- Section B: Files and code
- Section C: Commands to run
- Section D: Verification matrix
- Section E: Known tradeoffs

---

## Optional Strict Mode Add-on

If you want less creativity and more exact reconstruction, append:

"Strict mode:
- No extra features.
- No architectural changes unless required by target stack.
- Keep naming, behavior, and defaults as close as possible to the source docs.
- Explicitly mark every deviation."

---

## Verification Prompt (second pass)

After code generation, run this follow-up prompt:

"Compare your implementation against `manifest.md` and `architecture.md`.
Return:
1) fully satisfied requirements,
2) partially satisfied requirements,
3) unmet requirements,
4) exact fixes needed.
Do not rewrite full files; provide minimal diffs only."


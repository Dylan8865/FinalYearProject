# Framework: Reverse-Engineering Functional Requirements with AI

A structured, multi-pass approach for extracting accurate, traceable functional requirements from existing code (source or disassembled).

---

## Overview

| Pass | Purpose | Input | Output |
|---|---|---|---|
| 0 | Setup | Codebase map | Feature groupings, not folder groupings |
| 1 | Per-module inventory | One feature's code at a time | Lightweight behavior list + dependency flags |
| 2 | Cross-file synthesis | Inventories + flagged dependency snippets | Final numbered FR list |
| 3 | Verification | Final FR list + original code | Source citations + confidence labels |

---

## 0. Pre-Work: Map Before You Prompt

Before writing any prompt, build a rough manual map of which files belong to which **feature** (not which folder). Code is organized by layer (`routes/`, `models/`, `components/`); requirements are organized by feature (registration, enrollment, battle system). Group files accordingly before feeding anything to the AI.

Maintain a **running ledger** (markdown or CSV) that persists across sessions:

```
FR-ID | Description | Source Files | Status | Depends On
```

Feed this ledger back to the AI each session so it doesn't renumber or duplicate IDs.

---

## 1. The "Role and Context" Prompt

Sets the AI's role and gives it the system-level picture.

> "Act as a Senior Business Analyst. I am reverse-engineering the functional requirements for the [PROJECT NAME] platform. I will provide you with snippets of the completed codebase, one feature at a time. Your task is to analyze the logic, inputs, outputs, and constraints, and translate them into formal functional requirements. Do not summarize superficially — trace the actual logic."

---

## 2. The "Per-Module Inventory" Prompt (Pass 1)

Use this **before** asking for formal requirements. It produces a lightweight, checkable map of what's in a module and what it depends on — this is what prevents the AI from silently guessing at cross-file logic.

> "Here is [module/feature name] code. Don't write full functional requirements yet. Just list:
> 1. Every distinct behavior/rule you see in this code
> 2. Which files/functions implement each one
> 3. Any reference to something outside this file (an import, an API call, a shared config, a shared module) that you'd need to see to fully understand the rule — label these `[UNRESOLVED: needs <file>]` rather than guessing their behavior
>
> Give each item a temporary local ID.
>
> [Paste Code Here]"

**Why this step exists:** it separates mechanical inventory (cheap, reliable) from reasoning/synthesis (where AI is more failure-prone), and it surfaces cross-file dependencies explicitly instead of letting the AI invent behavior for code it hasn't seen.

---

## 3. The "Cross-File Synthesis" Prompt (Pass 2)

Once you have inventories from Pass 1 for all relevant modules, feed the **inventories** (not the raw code again) plus any specific snippets that were flagged as unresolved dependencies.

> "Here are inventories from [N] modules that together implement [feature]. Merge duplicate or overlapping behaviors, resolve the `[UNRESOLVED]` items using the additional snippets provided, and produce the final requirements list. For any two items you're merging, briefly note why they're the same rule vs. two related-but-distinct rules (e.g., frontend validation vs. backend/DB constraint are often both real and should stay separate)."

---

## 4. The "Formatting" Prompt

**Traditional / IEEE-style:**
> "Format the requirements as a numbered list of 'System Shall' statements (FR-01, FR-02...). Group them by category (Authentication, Validation, Database Operations, etc.)."

**Agile:**
> "Format as User Stories: 'As a [user], I want to [action] so that [benefit].' Include Acceptance Criteria based on the if/else logic and validations found in the code."

---

## 5. The "Verification" Prompt (Pass 3 — do not skip this)

This is what turns "plausible-sounding AI output" into something you can actually audit.

> "For each requirement in the list, cite the specific function, file, and approximate line range that justifies it. If you are inferring a requirement rather than reading it directly from logic (e.g., from a variable name, comment, or pattern), label it `[Inferred]` instead of `[Confirmed]`. List any code paths where behavior is ambiguous, inconsistent across files, or where you had to guess."

Every requirement in your final ledger should carry:
- **Source files** (specific, not "somewhere in the auth module")
- **Status**: `Confirmed from code` / `Inferred` / `Needs cross-check`
- **Depends on**: other FR-IDs it interacts with

---

## Pro-Tips (Consolidated)

- **Feed chunks by feature, not by folder or whole-repo.** Context windows technically hold more, but comprehension degrades — the AI summarizes superficially instead of tracing logic carefully.
- **Ask for hidden rules explicitly.** Business logic in `if/else` branches, DB constraints, or middleware is exactly what generic summarization misses: *"List any edge cases or business rules enforced by database constraints or backend middleware."*
- **Ask for negative space.** What's deliberately unhandled or out of scope is often as valuable as what's implemented: *"Flag anything this code does NOT validate or handle, and note if that looks intentional or like a gap."*
- **Never trust a merge/dedup decision blindly.** If two inventories both mention "email uniqueness check" from different files, verify yourself — one may be frontend UX, the other a real DB constraint, and both deserve separate FR-IDs.
- **Persist the ledger across sessions.** Re-feed it each time so IDs stay stable and nothing gets silently renumbered or duplicated.

---

## Minimal Ledger Template

```markdown
| FR-ID | Requirement | Source Files | Status | Depends On |
|-------|-------------|--------------|--------|------------|
| AUTH-01 | The system shall lock the account after 5 failed login attempts. | backend/routes/auth.py (L45-60); backend/models/user.py (L12) | Confirmed | RATE-02 |
```
# Instruction: Split Functional Requirements by Team Member

## Task for AI

You have access to two project reports:
- `RSW2S3G2_YongChaoJuin_Project_1_Report.docx`
- `RSW2S3G2_BenjaminYeeJunYi_Project_1_Report.docx`

Read both reports and identify which parts of the codebase / features each person implemented (look for sections like "My Contribution," "Individual Work," "Module Responsibility," code snippets attributed to each author, or commit/file references tied to each name).

Using that information, go through the functional requirements list below and assign each FR-ID to whichever person's report shows they implemented the corresponding logic. If a requirement is implemented jointly or you cannot determine ownership from the reports, mark it `Unclear — needs manual check` instead of guessing.

Output the result as a markdown file with two tables — one for Yong Chao Juin, one for Benjamin Yee Jun Yi — plus a third table for anything unclear.

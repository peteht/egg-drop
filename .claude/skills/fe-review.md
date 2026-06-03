---
name: fe-review
description: Review React/TypeScript front-end code before it ships, with emphasis on catching code that looks correct but is subtly wrong. Use whenever reviewing a PR, evaluating AI-generated code, or before merging any change to a React, React Native, Next.js, or TypeScript codebase, even when the code appears to work and tests pass.
---

# Front-End Code Review

Find the gap between code that looks right and code that is right. Plausible code with no rough edges is where silent wrong assumptions live, so treat fluency as a warning sign, not reassurance.

## Order

Context before diff. The expensive bugs are locally correct but wrong for this system.
1. State the change's intent in one sentence. If you can't, it's under-specified, and that's the first finding.
2. Check it against existing patterns in this codebase. Inventing a new pattern where a convention exists is a finding even if it works.
3. Then read the diff.

## Priorities, highest first

- **Data assumptions.** Where do the values driving this logic come from, and are they guaranteed to be what the code assumes? Null/absent fields, empty arrays, strings-as-numbers, colliding IDs. For money, counts, and limits, scrutinize boundaries and rounding. Logic built around a figure that "seemed right" is the bug.
- **Unhappy paths.** Network failure, timeout, empty/partial response, rejected promises. Swallowed errors. Missing loading/empty states on async UI.
- **State and effects.** Stale closures from missing effect deps; loops from over-broad deps; state stored when it should be derived; fetching in a render path.
- **Types that lie.** Each `any`, `as`, and `!` needs a reason. A type claiming a field is required when the API can omit it is worse than no type.
- **Performance, only in hot paths.** Unvirtualized large lists; a whole library pulled in for one function. Don't bikeshed micro-optimizations.

## AI-generated code

Tests passing means the tests passed, not that the code is correct, so check whether they exercise the logic or just the happy path. For any domain-specific rule, assume the model didn't know the domain and verify against the actual source, not against what's plausible.

## Call

Sort every finding and lead with the verdict:
- **Blocking** (correctness, security, data integrity, production-breaking gap): fix before merge.
- **Should fix** (pattern divergence, weak types, missing tests on touched code): fix now unless there's a stated reason.
- **Note** (style, ideas): optional.

Don't pad with notes to look thorough. For each finding: where, why it's wrong, what to do instead.

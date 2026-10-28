# AGENTS.md

Guidance for coding agents working in this repository.

## What this is

A portfolio site rendering as a text-mode terminal on a WebGL2 canvas via
`@micahdb/tscon`. Bun builds and tests it; TypeScript checks it; oxlint
lints it. Scripts live in `package.json`.

## Code style

**Naming.** `PascalCase` for classes and type names, with
`SCREAMING_SNAKE_CASE` for enum members and module constants. `camelCase`
for functions and methods. `snake_case` for local variables, arguments, and
class fields, including private ones.

**Classes vs functions.** Prefer free functions taking explicit arguments.
A class earns its place when data and methods genuinely belong together and
instantiation makes sense.

**Size and shape.** A function is at least 3 lines of code and at most
about two screens; split past that into named parts. Prefer guard clauses
over nested branches; deep indentation is a sign the function wants
refactoring. Keep the line count as low as the logic allows, and drop
redundant guards the type system or the call sites already guarantee.

**Fields.** Group class fields: `readonly` fields first, then mutables,
with blank lines separating logical groups (the render machinery, the
editor stack, configuration, mutable state). Declare fields in the class
body and assign them in the constructor rather than using parameter
properties, matching `src/components/pager.ts`.

**Imports.** One line each, no blank-line grouping. Order: external
packages, then `@/` site modules, then parent-relative (`../`) paths, then
sibling (`./`) paths -- alphabetically within each group. Use `import type`
for type-only imports and merge duplicate imports of the same module.

**Types.** Name object shapes that appear at more than one use site (see
`src/vi/editor/types.ts`); inline literals are fine for single-use local
shapes.

**Comments.** Not preferred; make code readable through naming and
abstraction first. Add a comment only when it carries information the code
cannot. Multi-line comments are doc comments: `/** */`, capitalized first
word, ` * ` on continuation lines, on classes, methods, and named functions.
Single-line notes use `//`.

**Formatting.** Tab indentation, semicolons, `const` by default. No line
exceeds 100 columns; wrap arguments and hoist named locals to fit. Blank
lines surround every `if`/`for`/`while` block: one before it (before the
comment that introduces it, if any) and one after.

**Source is ASCII.** Identifiers, comments, and operators included. Non-ASCII
characters appear only inside displayed strings and `src/pages/content/`
files; write glyphs in tscon escape syntax rather than embedding them.

## Verifying work

Run, in order, and leave each clean:

1. `bun test src/vi` -- every test passes.
2. `bun run typecheck` -- no errors.
3. `bun run lint` -- no warnings.
4. `bun run build` -- completes.

The line-length and blank-line conventions are not fully lint-enforced;
check them by eye on every file touched.

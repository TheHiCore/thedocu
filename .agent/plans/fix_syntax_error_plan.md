# Implementation Plan - Fix Syntax Error

## Goal
Fix the JSX syntax error in `src/components/certificate/CertificateSidebar.tsx` caused by a missing closing `div` tag.

## Steps
1.  **Edit `src/components/certificate/CertificateSidebar.tsx`**:
    *   Locate the `isEditingEntry` conditional block (around line 332).
    *   Insert a closing `</div>` tag before the closing parenthesis of the conditional expression `)}`.

## Verification
*   The build/dev server should stop reporting the syntax error.
*   The "Editing: [Name]" block should appear correctly at the bottom of the sidebar.

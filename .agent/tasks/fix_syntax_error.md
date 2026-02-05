# Fix Syntax Error in CertificateSidebar

## Context
The user reported a syntax error in `src/components/certificate/CertificateSidebar.tsx` after moving the "Editing: [Name]" block. The error "Unexpected token" and "Expected '</'" indicates unbalanced JSX tags.

## Issues Identified
1. The `isEditingEntry` conditional block opens a wrapper `div` (line 333) and an inner `div` (line 334), but only one `div` is closed (line 362) before the block ends (line 363).
2. This unbalanced tag causes the subsequent closing tags (`</motion.div>`) to be mismatched.

## Plan
1.  Read `src/components/certificate/CertificateSidebar.tsx` to confirm the line numbers.
2.  Add the missing `</div>` tag before the closing `)}` of the `isEditingEntry` block.
3.  Verify the fix (syntax check).

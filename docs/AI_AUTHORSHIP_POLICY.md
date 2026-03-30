# AI Authorship Risk Policy

This document defines institutional guardrails for the AI authorship risk feature.

## Purpose

- Provide faculty with triage support for manual review.
- Surface explainable signals that may warrant a follow-up conversation.
- Reduce time spent scanning all submissions manually.

## Non-Purpose

- The score is not proof of misconduct.
- The score is not an automatic disciplinary trigger.
- The score must not be used as sole evidence in grading penalties.

## Required Workflow

1. Faculty reviews top-risk submissions in context.
2. Faculty inspects reasons and concrete evidence snippets.
3. Faculty performs student follow-up (oral/written explanation, code walkthrough, or revision questions).
4. Any academic integrity action requires independent corroborating evidence.

## Operational Constraints

- Conservative thresholds are used by default to reduce false positives.
- Risk output is probabilistic and may be wrong.
- Similarity context may contribute a small weight in this version and must be disclosed in UI.
- Model/version metadata and timestamp must be retained in report output for auditability.

## Appeal and Record-Keeping

- For each flagged case, retain:
  - report id and generation timestamp,
  - feature version and configuration,
  - top signals and evidence snippets reviewed,
  - faculty decision and rationale.
- Provide students a chance to explain authorship and implementation decisions.

## Faculty-Facing Language (recommended)

"This AI authorship score is a triage aid. It may include a small similarity-context component and must not be used alone to make misconduct decisions. Manual review and student follow-up are required."

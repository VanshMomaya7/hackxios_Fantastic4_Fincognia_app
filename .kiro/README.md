# Kiro Decision Documentation System

## Purpose

Kiro serves as the authoritative decision layer and accountability framework for this AI-powered financial companion system. This folder contains the structured reasoning, constraints, thresholds, and failure modes that govern how the system makes financial decisions for irregular-income users in India.

## What Kiro Documents

**Agent Decision Logic**: The reasoning frameworks, risk thresholds, and decision trees that power each AI agent (Money Weather, Policy Agent, Tax Agent).

**System Constraints**: Hard limits, regulatory compliance requirements, and safety boundaries that prevent harmful financial advice or actions.

**Risk Management**: Failure modes, edge cases, and mitigation strategies for each component of the financial system.

**Accountability Trails**: Decision provenance, audit requirements, and transparency mechanisms that ensure users understand how and why recommendations are made.

**Integration Points**: How different agents coordinate, share context, and maintain consistency across the financial ecosystem.

## How to Read This Folder

### For Technical Reviewers

Start with `/specs/` to understand the formal requirements and design decisions for each agent. Review `/steering/` for implementation guidelines and decision frameworks.

### For Compliance Auditors

Focus on `/specs/*/requirements.md` files for regulatory compliance requirements and `/steering/risk-management.md` for safety constraints and failure handling.

### For Product Managers

Review user stories in requirements documents and decision rationale in design documents to understand how business objectives translate to agent behavior.

### For AI Safety Reviewers

Examine correctness properties in design documents and risk mitigation strategies in steering files to evaluate system safety and reliability.

## Structure Overview

- **`/specs/`**: Formal specifications for each agent and system component
- **`/steering/`**: Cross-cutting decision frameworks and implementation guidelines
- **`/settings/`**: Configuration and integration parameters

## Key Principles

**Transparency**: Every automated decision must be explainable and auditable.

**Safety First**: Conservative thresholds and explicit failure modes prevent financial harm.

**Regulatory Compliance**: All agent behavior aligns with Indian financial regulations and data protection requirements.

**User Agency**: Agents provide recommendations and context; users retain final decision authority.

**Continuous Learning**: Decision frameworks evolve based on user outcomes and regulatory changes.

## Accountability Framework

This documentation serves as the source of truth for:

- Why specific thresholds and limits were chosen
- How agents handle edge cases and failures
- What data is used for each type of decision
- How user privacy and financial safety are protected
- When human oversight is required vs. automated action

The implementation code executes these decisions, but Kiro documents the reasoning behind them.

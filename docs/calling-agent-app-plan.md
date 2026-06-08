# Calling Agent App Plan

## Goal

Build an app where a user can describe an outcome, attach relevant context, authorize an AI phone agent, and receive a verified result: confirmation number, transcript, summary, next deadline, and follow-up task.

Initial workflows:

- Marriott charge dispute: call customer support, explain the charge issue, request reversal or escalation, and capture the case number.
- Chicago service complaint: report rodent activity and feeding conditions to the proper city channel, capture the service request number, and track follow-up.
- Neighbor participation: collect each neighbor's name, address, issue description, and explicit consent before placing a separate call or filing a separate report on their behalf.

## Non-Negotiable Guardrails

- The agent must disclose that it is an AI assistant acting with authorization.
- The agent must not impersonate the user, clone a voice, or imply it is physically present.
- Each person represented by the agent must consent before any call or filing is made.
- The app should prefer official web/API forms when available, using phone calls when a call is the only or best escalation channel.
- The app must store evidence of consent, call metadata, transcript, and final outcome.
- Calls involving payment cards, identity verification, hotel accounts, health issues, or legal claims should have human approval before sending sensitive information.
- Recording must be configurable by jurisdiction and disabled unless the call flow can satisfy the applicable consent requirements.

## MVP

1. User creates a case.
2. User uploads context: emails, folios, receipts, photos, addresses, dates, names, and desired resolution.
3. App turns the case into a structured call brief:
   - objective
   - facts the agent may state
   - facts the agent must not guess
   - allowed negotiation range
   - escalation instructions
   - identity and consent language
4. User approves the call brief.
5. Voice agent places one call.
6. Agent handles menus, waits on hold, speaks to support staff, and escalates when needed.
7. App returns the result:
   - outcome
   - confirmation or case number
   - representative name if provided
   - promised follow-up date
   - transcript/summary
   - recommended next action

## Architecture

- Web app: case intake, consent capture, document upload, call review, and results dashboard.
- API server: case state, authorization checks, call orchestration, audit logs.
- Database: users, cases, parties, consent records, call attempts, transcripts, outcomes, uploaded evidence.
- Voice provider: outbound calling, DTMF, call status webhooks, recording controls.
- AI voice agent: real-time speech conversation, tool calls, call strategy, transcript generation.
- Retrieval layer: summarizes uploaded documents and exposes only approved facts to the phone agent.
- Human-in-the-loop queue: requires approval before sensitive disclosures, settlement acceptance, or repeated outbound campaigns.

## Neighbor Consent Flow

Each neighbor should get a share link that collects:

- full name
- address or service location
- phone/email for verification
- issue description
- permission for the AI assistant to call or submit a complaint on their behalf
- exact disclosure language they authorize
- timestamp, IP/device metadata, and version of consent text

The app should place one individualized call or submission per consenting person. It should avoid scripted bulk blasting and should not create duplicate reports when the official channel treats repeated submissions as duplicates.

## First Implementation Steps

1. Create a separate app workspace for the calling agent rather than mixing it into the current BartenderGPT domain.
2. Build the case intake and approval UI.
3. Add database tables for cases, parties, consent, call attempts, transcripts, and outcomes.
4. Integrate a voice provider in sandbox mode.
5. Implement a supervised first call flow for the Marriott dispute.
6. Add Chicago 311/service-request workflow after verifying the best official submission channel.
7. Add neighbor consent links only after the single-user call loop is reliable.


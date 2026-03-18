# Bacchus Custom GPT Setup

## Goal

Use a dedicated `Bacchus` Custom GPT in ChatGPT to:

- accept uploaded bottle photos or screenshots
- extract wine and liquor bottle candidates
- confirm which detected bottles to add
- write approved bottles into Bacchus inventory
- answer follow-up inventory, wine pairing, and cocktail questions

## Action import URL

Once the API is deployed, import the Bacchus GPT Actions schema from:

`https://YOUR-BACCHUS-DOMAIN/api/v1/chatgpt/openapi.json`

For local testing, the endpoint is:

`http://localhost:3000/api/v1/chatgpt/openapi.json`

## Helpful endpoints

- OpenAPI schema: `/api/v1/chatgpt/openapi.json`
- Starter GPT instructions: `/api/v1/chatgpt/instructions`

## Starter GPT Instructions

Use this as the first draft for the Custom GPT instructions:

```text
You are Bacchus, a household wine and liquor cellar assistant.

When the user uploads bottle photos or screenshots and asks to add them:
1. Call extractIntakeFromUploads.
2. Present the extracted bottles as a numbered list.
3. Ask which bottles to add, skip, or correct.
4. If the user corrects a bottle or rejects one, call reviewIntakeCandidate.
5. Only call approveIntakeCandidates after the user clearly confirms which bottles to add.

For inventory questions, use searchInventory.
For wine pairing, use suggestWinesForMeal.
For cocktail ideas, use suggestCocktails.
For aging guidance, use getDrinkNowCandidates.

Be concise, but always show the numbered bottle list before approving inventory changes.
```

## Expected user flow

1. User opens the Bacchus GPT.
2. User uploads several photos from Binny's and says, `Add these bottles to my bar inventory.`
3. Bacchus calls `extractIntakeFromUploads`.
4. Bacchus responds with something like:

```text
I found 3 bottles:
1. Campari
2. Cynar Amaro
3. Aperol

Which ones should I add?
```

5. User replies, `Add 1 and 2. Skip 3.`
6. Bacchus calls `reviewIntakeCandidate` for bottle 3 and `approveIntakeCandidates` for 1 and 2.
7. Bacchus confirms the created inventory records.

## Current limitation

The intake action currently relies on temporary `download_link` URLs supplied by ChatGPT for uploaded files. Those links are short-lived, so extraction should happen immediately after the upload turn.

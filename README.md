# QVAC Elevator Pitch Builder

Enter what your product is, who it's for, and what problem it solves — an on-device AI writes a short 30-second-style elevator pitch paragraph. No cloud call, no API key.

## Run

```bash
npm install
npm start
```

Then open http://localhost:31012

Requires Node.js >= 22.17 (see `engines` in `package.json`).

## QVAC SDK version

`@qvac/sdk` ^0.19.0 (see `package.json`).

## How it works

Built on [Tether's QVAC SDK](https://www.npmjs.com/package/@qvac/sdk) — all inference runs on-device, no cloud call, no API key.

1. `loadModel({ modelSrc: LLAMA_3_2_1B_INST_Q4_0 })` loads the model once at startup, before the HTTP server starts accepting requests.
2. Each `POST /api/pitch` request calls `completion()` with a one-shot example baked into the chat history (a real user/assistant turn, not just prose instructions) and streams the reply token-by-token via `run.tokenStream`.
3. `unloadModel({ modelId })` releases the model on `SIGINT`/`SIGTERM`.

The response is passed through `generate()` in `src/pitch.js`, which strips filler preambles/quotes, checks the pitch is a plausible length (10-700 characters) and free of refusal phrases, and specifically checks for the one-shot example's own subject matter ("expense report") leaking into an unrelated pitch. If the result looks unusable, a deterministic fallback built directly from the three input fields (no model involved) is returned instead.

### Example

Input:

- What it is: a browser extension that auto-fills expense reports from email receipts
- Who it's for: small business owners who file their own expenses
- Problem it solves: manually copying numbers from receipts into spreadsheets every month

Output:

> Every month, small business owners lose hours copying numbers off receipts into spreadsheets. Our browser extension fixes that: it reads your email receipts and auto-fills your expense report for you, so filing expenses takes minutes instead of hours — no manual entry, no spreadsheets, no headache.

This exact input/output pair is also the one-shot example baked into the prompt (see `EXAMPLE_INPUT`/`EXAMPLE_OUTPUT` in `src/pitch.js`).

## License

MIT

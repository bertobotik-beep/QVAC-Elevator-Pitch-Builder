// QVAC Elevator Pitch Builder — core logic.
// completion() writes one short pitch paragraph strictly from the three
// facts the user gives (what/who/problem). The one-shot example is real
// multi-turn history (not prose in the system prompt) so the small model
// is much less likely to parrot it verbatim regardless of the real input.

import { completion } from "@qvac/sdk";

function looksUnusable(text) {
  if (!text || text.trim().length < 10) return true;
  if (text.length > 700) return true;
  const bad = [
    "i cannot", "i can't", "as an ai", "i'm not able", "i do not have", "i don't have",
    "not enough information", "please provide more", "please try again",
    "i'd be happy to help", "i'll be happy to help", "could you provide",
    "can you provide", "i need more", "please give me more",
  ];
  const lower = text.toLowerCase();
  return bad.some((phrase) => lower.includes(phrase));
}

function clean(text) {
  return text
    .trim()
    .replace(/^.*?\b(?:here'?s|here is)\b[^:\n]*:\s*\n*/i, "")
    .trim()
    .replace(/^\*+|\*+$/g, "")
    .trim()
    .replace(/^["']/, "")
    .replace(/["']$/, "")
    .trim();
}

const EXAMPLE_INPUT = {
  what: "a browser extension that auto-fills expense reports from email receipts",
  who: "small business owners who file their own expenses",
  problem: "manually copying numbers from receipts into spreadsheets every month",
};
const EXAMPLE_OUTPUT =
  "Every month, small business owners lose hours copying numbers off receipts into spreadsheets. " +
  "Our browser extension fixes that: it reads your email receipts and auto-fills your expense report " +
  "for you, so filing expenses takes minutes instead of hours — no manual entry, no spreadsheets, " +
  "no headache.";

function fallback({ what, who, problem }) {
  return `${what} is built for ${who}. It solves ${problem} — quickly, simply, and without the usual hassle.`;
}

export async function generate(modelId, { what, who, problem }) {
  const run = completion({
    modelId,
    history: [
      {
        role: "system",
        content:
          "You write short, energetic elevator pitch paragraphs (60-90 words, about " +
          "30 seconds when spoken aloud) for a product, based only on three facts the " +
          "user gives: what it is, who it's for, and what problem it solves. Only use " +
          "those facts — never invent features, users, or claims not mentioned. Reply " +
          "with ONLY the pitch paragraph, no headers, no preamble, no quotation marks.",
      },
      {
        role: "user",
        content: `What it is: ${EXAMPLE_INPUT.what}\nWho it's for: ${EXAMPLE_INPUT.who}\nProblem it solves: ${EXAMPLE_INPUT.problem}`,
      },
      { role: "assistant", content: EXAMPLE_OUTPUT },
      {
        role: "user",
        content: `What it is: ${what}\nWho it's for: ${who}\nProblem it solves: ${problem}`,
      },
    ],
    stream: true,
    completionOpts: { temperature: 0.7, maxTokens: 220 },
  });

  let text = "";
  for await (const token of run.tokenStream) text += token;
  text = clean(text);

  // Guard against the model parroting the one-shot example verbatim.
  if (text.toLowerCase().includes("expense report") && !`${what} ${who} ${problem}`.toLowerCase().includes("expense")) {
    text = "";
  }

  const pitch = looksUnusable(text) ? fallback({ what, who, problem }) : text;
  return { pitch };
}

/**
 * Shared writing rules for CMS copy generators.
 * The public site already has slogan-shaped lines; these rules pull new drafts
 * back toward plain speech.
 */
export const PORTFOLIO_VOICE = [
  "Write in Devanshi's voice. She is a product manager who still writes frontend code. She explains the work the way she would to a colleague.",
  "How it should sound:",
  "- Short sentences. One fact, then the next. Uneven lengths are fine.",
  "- Specific: the brief, the empty state, the ticket, the people using the half-built tool.",
  "- First person is fine. Do not start every sentence with I.",
  "- Plain words. \"I wrote the spec\" instead of \"I elevated the quality floor\".",
  "- Contractions are fine.",
  "- If a draft is there, keep the facts, names, and tools. When a sentence is a slogan, say the same thing in ordinary speech.",
  "Do not write like a portfolio template:",
  "- No antithesis: \"not X, but Y\", \"from X to Y\", \"it's not about X, it's about Y\".",
  "- No em dash used as a punchline.",
  "- No stacks of three abstract nouns.",
  "- No closer that states the moral.",
  "- Banned words: passionate, leverage, elevate, unlock, seamless, robust, landscape, journey, empower, foster, pivotal, holistic, tapestry, resonate, cutting-edge.",
  "- No rhetorical questions.",
  "Plain versions of the same facts:",
  '"I turned messy founder briefs at O2H into a scope we could ship."',
  '"I talked to people using half-built tools, then wrote the empty states and the non-goals into the spec."',
  '"I stayed in the frontend code so the decision did not get lost in a ticket."',
].join("\n");

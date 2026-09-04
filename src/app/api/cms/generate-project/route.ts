import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySessionCookie } from "@/lib/cms-auth";

export const runtime = "nodejs";

const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const FETCH_TIMEOUT_MS = 8_000;
const MAX_HTML_CHARS = 80_000;
const MAX_README_CHARS = 6_000;

type GenerateBody = {
  name?: unknown;
  github?: unknown;
  demo?: unknown;
  existingBlurb?: unknown;
  existingTags?: unknown;
};

type GeneratedFields = {
  blurb: string;
  tags: string[];
};

type SourceContext = {
  label: string;
  text: string;
};

function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function strList(v: unknown, maxItems = 12, maxLen = 200): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim().slice(0, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

function parseGenerated(raw: string): GeneratedFields | null {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;
  const blurb = str(obj.blurb ?? obj.description ?? obj.summary, 600);
  const tags = strList(obj.tags, 10, 40);
  if (!blurb || tags.length === 0) return null;
  return { blurb, tags };
}

async function authed() {
  const token = (await cookies()).get("cms_session")?.value;
  return verifySessionCookie(token);
}

function parseGithubRepo(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url);
    if (!/(^|\.)github\.com$/i.test(u.hostname)) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/i, "");
    if (!owner || !repo) return null;
    return { owner, repo };
  } catch {
    return null;
  }
}

function decodeGithubReadme(contentBase64: string): string {
  try {
    return Buffer.from(contentBase64.replace(/\n/g, ""), "base64")
      .toString("utf8")
      .slice(0, MAX_README_CHARS);
  } catch {
    return "";
  }
}

function stripHtmlNoise(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
}

function metaContent(html: string, names: string[]): string {
  for (const name of names) {
    const re = new RegExp(
      `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>|<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["'][^>]*>`,
      "i",
    );
    const m = html.match(re);
    const value = (m?.[1] || m?.[2] || "").trim();
    if (value) return value.slice(0, 400);
  }
  return "";
}

function extractLivePageSignals(html: string): string {
  const cleaned = stripHtmlNoise(html).slice(0, MAX_HTML_CHARS);
  const title = cleaned.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() || "";
  const description = metaContent(cleaned, ["description", "og:description", "twitter:description"]);
  const ogTitle = metaContent(cleaned, ["og:title", "twitter:title"]);
  const h1 = cleaned.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "";
  const parts = [
    title ? `Title: ${title.slice(0, 200)}` : "",
    ogTitle && ogTitle !== title ? `OG title: ${ogTitle}` : "",
    description ? `Meta description: ${description}` : "",
    h1 && h1 !== title ? `H1: ${h1.slice(0, 200)}` : "",
  ].filter(Boolean);
  return parts.join("\n");
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "portfolio-cms-project-generator/1.0",
        Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
        ...(init?.headers || {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function gatherGithubContext(githubUrl: string): Promise<SourceContext | null> {
  const parsed = parseGithubRepo(githubUrl);
  if (!parsed) {
    return { label: "GitHub URL", text: `URL provided (could not parse as owner/repo): ${githubUrl}` };
  }

  const { owner, repo } = parsed;
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN?.trim() || process.env.GH_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const [repoRes, readmeRes] = await Promise.all([
      fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}`, { headers }),
      fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers }),
    ]);

    if (!repoRes.ok) {
      return {
        label: "GitHub",
        text: `Repo ${owner}/${repo} — API status ${repoRes.status}. Use URL and any other context carefully.`,
      };
    }

    const repoJson = (await repoRes.json()) as {
      description?: string | null;
      language?: string | null;
      topics?: string[];
      homepage?: string | null;
      stargazers_count?: number;
      forks_count?: number;
      license?: { spdx_id?: string } | null;
    };

    const lines = [
      `Repo: ${owner}/${repo}`,
      repoJson.description ? `Description: ${repoJson.description}` : "",
      repoJson.language ? `Primary language: ${repoJson.language}` : "",
      Array.isArray(repoJson.topics) && repoJson.topics.length
        ? `Topics: ${repoJson.topics.join(", ")}`
        : "",
      repoJson.homepage ? `Homepage: ${repoJson.homepage}` : "",
      typeof repoJson.stargazers_count === "number" ? `Stars: ${repoJson.stargazers_count}` : "",
      repoJson.license?.spdx_id ? `License: ${repoJson.license.spdx_id}` : "",
    ].filter(Boolean);

    if (readmeRes.ok) {
      const readmeJson = (await readmeRes.json()) as { content?: string; encoding?: string };
      if (readmeJson.encoding === "base64" && readmeJson.content) {
        const readme = decodeGithubReadme(readmeJson.content);
        if (readme) lines.push(`README excerpt:\n${readme}`);
      }
    }

    return { label: "GitHub", text: lines.join("\n") };
  } catch (err) {
    console.error("GitHub context fetch failed", err);
    return {
      label: "GitHub",
      text: `URL: ${githubUrl} (fetch failed; generate carefully from the URL and name only)`,
    };
  }
}

async function gatherLiveContext(demoUrl: string): Promise<SourceContext | null> {
  let normalized = demoUrl;
  try {
    if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;
    const u = new URL(normalized);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  } catch {
    return { label: "Live URL", text: `Invalid URL: ${demoUrl}` };
  }

  try {
    const res = await fetchWithTimeout(normalized);
    if (!res.ok) {
      return {
        label: "Live demo",
        text: `URL: ${normalized} — HTTP ${res.status}. Infer carefully.`,
      };
    }
    const contentType = res.headers.get("content-type") || "";
    if (!/text\/html|application\/xhtml/i.test(contentType) && contentType) {
      return {
        label: "Live demo",
        text: `URL: ${normalized} (content-type ${contentType}; no HTML signals)`,
      };
    }
    const html = (await res.text()).slice(0, MAX_HTML_CHARS);
    const signals = extractLivePageSignals(html);
    return {
      label: "Live demo",
      text: signals
        ? `URL: ${normalized}\n${signals}`
        : `URL: ${normalized} (page fetched; little metadata found)`,
    };
  } catch (err) {
    console.error("Live URL fetch failed", err);
    return {
      label: "Live demo",
      text: `URL: ${normalized} (fetch failed; generate carefully from the URL and name only)`,
    };
  }
}

export async function POST(req: Request) {
  if (!(await authed())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const name = str(body.name, 120);
  const github = str(body.github, 400);
  const demo = str(body.demo, 400);
  const existingBlurb = str(body.existingBlurb, 600);
  const existingTags = strList(body.existingTags);

  if (!github && !demo) {
    return NextResponse.json(
      { error: "Enter a GitHub URL or Live demo URL before generating." },
      { status: 400 },
    );
  }

  const contexts = (
    await Promise.all([
      github ? gatherGithubContext(github) : Promise.resolve(null),
      demo ? gatherLiveContext(demo) : Promise.resolve(null),
    ])
  ).filter((c): c is SourceContext => Boolean(c));

  const prompt = [
    "You write portfolio project copy for a product-minded engineer / product manager.",
    "Voice: sharp, concrete, human; outcome-focused; no buzzword salad; no emojis; no \"I built\" spam.",
    "Match this sample tone:",
    '"A vocabulary studio with quizzes, matching, and a relation graph — because new words lived in scattered notes and nothing remembered how they related."',
    '"A quiet ledger where rows come first and charts only exist if the rows are honest. Months ended with a feeling; now they end with a picture."',
    '"Guests find and book. Organizers create and watch status. Availability is not a later feature — booking is trust."',
    "",
    "Given the project sources below, return ONLY valid JSON with this shape:",
    '{"blurb":"1-2 sentences","tags":["Tag","Tag"]}',
    "",
    "Rules:",
    "- blurb: 1–2 sentences, max ~280 chars. Accurate to the sources. Creative and specific — name the product job, not a generic tech stack dump.",
    "- tags: 3–8 short labels for stack, domain, or product areas (e.g. React, Next.js, Product). Prefer real tech/topics found in sources.",
    "- Prefer truth from GitHub README/description/topics and the live page metadata over guessing.",
    "- Do not invent features that are not supported by the sources.",
    "- If an existing draft is provided, improve/rewrite it — keep truth, sharpen language.",
    "- If sources conflict, trust GitHub README + live meta over empty guesses.",
    "",
    `Project name: ${name || "(not set)"}`,
    `GitHub URL: ${github || "(not set)"}`,
    `Live demo URL: ${demo || "(not set)"}`,
    existingBlurb ? `Existing description: ${existingBlurb}` : "Existing description: (empty)",
    existingTags.length ? `Existing tags: ${existingTags.join(", ")}` : "Existing tags: (empty)",
    "",
    "Fetched source context:",
    contexts.length
      ? contexts.map((c) => `### ${c.label}\n${c.text}`).join("\n\n")
      : "(no remote context available)",
  ].join("\n");

  let geminiRes: Response;
  try {
    geminiRes = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      }),
    });
  } catch (err) {
    console.error("Gemini request failed", err);
    return NextResponse.json({ error: "Could not reach Gemini." }, { status: 502 });
  }

  const geminiJson = (await geminiRes.json().catch(() => null)) as {
    error?: { message?: string };
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  } | null;

  if (!geminiRes.ok) {
    const message = geminiJson?.error?.message || `Gemini error (${geminiRes.status}).`;
    console.error("Gemini API error", geminiRes.status, message);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const text = geminiJson?.candidates?.[0]?.content?.parts
    ?.map((p) => p.text || "")
    .join("")
    .trim();

  if (!text) {
    return NextResponse.json({ error: "Gemini returned an empty response." }, { status: 502 });
  }

  const generated = parseGenerated(text);
  if (!generated) {
    console.error("Could not parse Gemini JSON", text.slice(0, 500));
    return NextResponse.json({ error: "Could not parse AI response. Try again." }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    blurb: generated.blurb,
    tags: generated.tags,
  });
}

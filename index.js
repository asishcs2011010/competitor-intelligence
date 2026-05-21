require("dotenv").config();
const { scrapeAll } = require("./scrapers/website");
const { buildPrompt } = require("./prompts/digest");
const { saveDigest, getLastWeekDigest, getLastWeekHashes, saveHashes } = require("./storage/supabase");
const { sendDigestEmail } = require("./email/send");
const Anthropic = require("@anthropic-ai/sdk");

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function run() {
  console.log("🚀 Starting competitor intelligence run...");

  console.log("📂 Fetching last week's data...");
  const previousDigest = await getLastWeekDigest();
  const previousHashes = await getLastWeekHashes();

  console.log("Previous digest found:", previousDigest ? "YES" : "NO");
  
  console.log("📡 Scraping competitors...");
  const { scrapedData, hashes } = await scrapeAll(previousHashes);

  console.log("🧠 Building prompt...");
  const prompt = buildPrompt(scrapedData, previousDigest);

   console.log("\n===== PROMPT SENT TO LLM =====");
   console.log(prompt);
   console.log("===== END PROMPT =====\n");

  console.log("🤖 Calling Claude...");
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });
  const digest = response.content[0].text;

  console.log("\n===== LLM OUTPUT =====");
  console.log(digest);
  console.log("===== END OUTPUT =====\n");

  console.log("✅ Digest generated.");

  const weekOf = new Date().toISOString().split("T")[0];
  await saveDigest(weekOf, scrapedData, digest);
  await saveHashes(weekOf, hashes);

  console.log("📧 Sending email...");
  await sendDigestEmail(digest);

  console.log("🎉 Done!");
}

run();
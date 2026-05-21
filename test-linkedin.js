const { ApifyClient } = require("apify-client");
require("dotenv").config();

const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

// Test with just ONE competitor first — swap out to test others
const COMPETITOR_LINKEDIN = [
  { name: "Testlio",     url: "https://www.linkedin.com/company/testlio/" },
  { name: "QA Wolf",     url: "https://www.linkedin.com/company/qa-wolf/" },
  { name: "Qualitest",   url: "https://www.linkedin.com/company/qualitest/" },
  { name: "Infosys BPM", url: "https://www.linkedin.com/company/infosys-bpm/" },
  { name: "Cigniti", url: "https://www.linkedin.com/company/coforge-tech/"  },
];

async function testLinkedIn() {
  console.log("🔗 Running LinkedIn scrape test via Apify...\n");

  let run;
  try {
    run = await client.actor("harvestapi/linkedin-company-posts").call({
      targetUrls: COMPETITOR_LINKEDIN.map(c => c.url),
      maxPosts: 3,
      includeReposts: true,
      includeQuotePosts: true,
      scrapeComments: false,
      scrapeReactions: false,
    });
    console.log(`✅ Apify run finished. Dataset ID: ${run.defaultDatasetId}\n`);
  } catch (err) {
    console.error("❌ Apify actor call failed:", err.message);
    process.exit(1);
  }

  let items;
  try {
    const result = await client.dataset(run.defaultDatasetId).listItems();
    items = result.items;
    console.log(`📦 Total items returned: ${items.length}\n`);
  } catch (err) {
    console.error("❌ Failed to fetch dataset:", err.message);
    process.exit(1);
  }

  // ── Debug: show the raw keys on the first item so you know the schema ──
  if (items.length > 0) {
    console.log("🔍 Raw keys on first item:", Object.keys(items[0]));
    console.log("🔍 Sample item (first):\n", JSON.stringify(items[0], null, 2).slice(0, 1500), "\n---\n");
  }

  // ── Per-competitor output ──
  for (const competitor of COMPETITOR_LINKEDIN) {
    const urlLower = competitor.url.toLowerCase();

    const posts = items.filter(item => {
      const targetUrl = (item.query?.targetUrl || "").toLowerCase();
      return targetUrl.includes(urlLower);
    });

    console.log(`\n## ${competitor.name} — LinkedIn (${posts.length} post(s) found)`);

    if (!posts.length) {
      console.log("  ⚠️  No posts matched for this URL. Check the filter logic above.");
      continue;
    }

    for (const post of posts.slice(0, 3)) {
      const text = (post.content || post.text || post.commentary || "No content field found").slice(0, 300);
      const date = post.postedAt?.date || post.postedAt?.text || post.publishedAt || "Unknown date";
      console.log(`  [${date}] ${text}`);
    }
  }

  console.log("\n✅ Test complete.");
}

testLinkedIn();
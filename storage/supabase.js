const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function saveDigest(weekOf, scrapedData, digest) {
  const { error } = await supabase.from("digests").insert([
    {
      week_of: weekOf,
      scraped_data: scrapedData,
      digest: digest,
    },
  ]);
  if (error) console.error("Failed to save digest:", error.message);
  else console.log("Digest saved to Supabase.");
}

async function getLastWeekDigest() {
  const { data, error } = await supabase
    .from("digests")
    .select("digest")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (error) { console.log("No previous digest found."); return null; }
  return data?.digest || null;
}

async function getLastWeekHashes() {
  const { data, error } = await supabase
    .from("digests")
    .select("content_hashes")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (error || !data) return {};
  return data.content_hashes || {};
}

async function saveHashes(weekOf, hashes) {
  const { error } = await supabase
    .from("digests")
    .update({ content_hashes: hashes })
    .eq("week_of", weekOf);
  if (error) console.error("Failed to save hashes:", error.message);
}

async function getLastWeekLinkedInIds() {
  const { data, error } = await supabase
    .from("digests")
    .select("linkedin_post_ids")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (error || !data) return [];
  return data.linkedin_post_ids || [];
}

async function saveLinkedInIds(weekOf, ids) {
  const { error } = await supabase
    .from("digests")
    .update({ linkedin_post_ids: ids })
    .eq("week_of", weekOf);
  if (error) console.error("Failed to save LinkedIn IDs:", error.message);
  else console.log("LinkedIn post IDs saved.");
}

module.exports = {
  saveDigest,
  getLastWeekDigest,
  getLastWeekHashes,
  saveHashes,
  getLastWeekLinkedInIds,
  saveLinkedInIds,
};
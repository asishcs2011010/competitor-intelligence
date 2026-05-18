require("dotenv").config();
const { scrapeAll } = require("./scrapers/website");

async function test() {
  const output = await scrapeAll();
  console.log(output.slice(0, 1000)); // print first 1000 chars
}

test();
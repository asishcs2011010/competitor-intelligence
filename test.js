require("dotenv").config();
const { sendDigestEmail } = require("./email/send");

async function test() {
  await sendDigestEmail("# Test Digest\n\n## Testlio\n\n**What's New**\n- Test bullet point\n\n**Key Signal**\nThis is a test signal.\n\n**Watch Out For**\nNothing for now.");
}

test();
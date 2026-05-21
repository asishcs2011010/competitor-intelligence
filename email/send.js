const { Resend } = require("resend");
require("dotenv").config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendDigestEmail(digestMarkdown) {
  const htmlContent = buildNewsletterHtml(digestMarkdown);
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: ["reddy4asish@gmail.com"],
    subject: `📊 Qapitol Intel Brief — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
    html: htmlContent,
  });
  if (error) console.error("Failed to send email:", error.message);
  else console.log("Email sent successfully:", data);
}

function parseDigest(markdown) {
  const sections = [];
  const lines = markdown.split("\n").map(l => l.replace(/\r/g, ""));
  let current = null;
  let currentField = null;

  const COMPETITOR_NAMES = ["testlio", "qa wolf", "qualitest", "infosys bpm", "cigniti"];

  for (const line of lines) {
    const raw = line.trim();
    const trimmed = raw.replace(/^\*+\s*/, "").replace(/\*+$/, "").trim();

    if (raw.startsWith("#")) {
      const name = raw.replace(/^#+\s*/, "").replace(/[🌐🧠]/g, "").trim();
      const nameLower = name.toLowerCase();

      const matchCount = COMPETITOR_NAMES.filter(c => nameLower.includes(c)).length;
      const isCompetitor = matchCount === 1;
      const isMarket = nameLower.includes("market pulse");

      if (isCompetitor || isMarket) {
        if (current) sections.push(current);
        if (isMarket) {
          current = { type: "market", name, bullets: [] };
        } else {
          current = { type: "competitor", name, whatsNew: [], keySignal: "", watchOut: "" };
        }
        currentField = null;
      }
      continue;
    }

    if (!current) continue;

    if (trimmed.includes("What\u2019s New") || trimmed.includes("What's New")) {
      currentField = "whatsNew";
      continue;
    }
    if (trimmed.includes("Key Signal")) {
      currentField = "keySignal";
      continue;
    }
    if (trimmed.includes("Watch Out")) {
      currentField = "watchOut";
      continue;
    }
    if (trimmed.includes("Top Industry Themes") || trimmed.includes("Market Pulse")) {
      currentField = "marketBullet";
      continue;
    }

    if (!trimmed || trimmed === "---" || trimmed === "***") continue;

    if (raw.startsWith("- ") || raw.startsWith("* ")) {
      const content = raw.slice(2).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").trim();
      if (!content) continue;
      if (current.type === "competitor" && currentField === "whatsNew") {
        current.whatsNew.push(content);
      } else if (current.type === "market" && (currentField === "marketBullet" || currentField === "whatsNew")) {
        current.bullets.push(content);
      }
      continue;
    }

    // Catch plain text in whatsNew (e.g. "No new activity since last week's digest.")
    if (current.type === "competitor" && currentField === "whatsNew" && trimmed) {
      current.whatsNew.push(trimmed);
      continue;
    }

    if (current.type === "competitor") {
      const content = trimmed.replace(/\*\*(.*?)\*\*/g, "<strong style='color:#93c5fd;'>$1</strong>");
      if (currentField === "keySignal") current.keySignal += content + " ";
      else if (currentField === "watchOut") current.watchOut += content + " ";
    }

    if (current.type === "market" && currentField === "marketBullet") {
      const content = trimmed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      if (content) current.bullets.push(content);
    }
  }

  if (current) sections.push(current);
  return sections;
}

function cardInner(c) {
  const hasActivity =
    c.whatsNew.length > 0 &&
    !c.whatsNew[0].toLowerCase().includes("no significant") &&
    !c.whatsNew[0].toLowerCase().includes("no substantive") &&
    !c.whatsNew[0].toLowerCase().includes("no new") &&
    !c.whatsNew[0].toLowerCase().includes("no accessible") &&
    !c.whatsNew[0].toLowerCase().includes("no new activity") &&
    !c.whatsNew[0].toLowerCase().includes("no competitive");

  const headerBg   = hasActivity ? "#1e3a8a" : "#1e293b";
  const borderClr  = hasActivity ? "#2563eb" : "#1e293b";
  const badgeBg    = hasActivity ? "#3b82f6" : "#334155";
  const badgeTxt   = hasActivity ? "#fff"    : "#94a3b8";
  const badgeLabel = hasActivity ? "ACTIVE"  : "QUIET";

  const whatsNewHtml = hasActivity
    ? `<ul style="margin:0 0 14px 0;padding-left:18px;">
        ${c.whatsNew.slice(0, 3).map(b =>
          `<li style="font-size:12px;color:#cbd5e1;line-height:1.65;margin-bottom:5px;">${b}</li>`
        ).join("")}
       </ul>`
    : `<p style="font-size:12px;color:#475569;margin:0 0 14px 0;font-style:italic;">No significant activity this week.</p>`;

  const keySignalHtml = c.keySignal.trim() && !c.keySignal.toLowerCase().includes("no new signals") ? `
    <div style="background:#172554;border-left:3px solid #3b82f6;padding:10px 12px;margin-bottom:8px;border-radius:0 4px 4px 0;">
      <div style="font-size:9px;font-weight:700;color:#60a5fa;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px;">📡 Key Signal</div>
      <div style="font-size:12px;color:#bfdbfe;line-height:1.6;">${c.keySignal.trim()}</div>
    </div>` : "";

  const watchOutHtml = c.watchOut.trim() && !c.watchOut.toLowerCase().includes("no new signals") ? `
    <div style="background:#1c0a00;border-left:3px solid #f97316;padding:10px 12px;border-radius:0 4px 4px 0;">
      <div style="font-size:9px;font-weight:700;color:#fb923c;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px;">⚠️ Watch Out</div>
      <div style="font-size:12px;color:#fed7aa;line-height:1.6;">${c.watchOut.trim()}</div>
    </div>` : "";

  return `
  <div style="background:#0f172a;border:1px solid ${borderClr};border-radius:8px;overflow:hidden;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="background:${headerBg};padding:11px 16px;">
          <span style="font-size:13px;font-weight:800;color:#f1f5f9;text-transform:uppercase;letter-spacing:0.06em;">${c.name}</span>
        </td>
        <td style="background:${headerBg};padding:11px 16px;text-align:right;white-space:nowrap;">
          <span style="font-size:10px;background:${badgeBg};color:${badgeTxt};padding:2px 9px;border-radius:10px;font-weight:700;">${badgeLabel}</span>
        </td>
      </tr>
    </table>
    <div style="padding:14px 16px;">
      <div style="font-size:9px;font-weight:700;color:#3b82f6;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">🆕 What's New</div>
      ${whatsNewHtml}
      ${keySignalHtml}
      ${watchOutHtml}
    </div>
  </div>`;
}

function buildCompetitorRows(competitors) {
  let html = "";
  for (let i = 0; i < competitors.length; i += 2) {
    const left  = competitors[i];
    const right = competitors[i + 1] || null;

    if (!right) {
      html += `
      <tr>
        <td colspan="2" style="padding:8px;vertical-align:top;">
          ${cardInner(left)}
        </td>
      </tr>`;
    } else {
      html += `
      <tr style="height:1px;">
        <td style="width:50%;padding:8px;vertical-align:top;height:100%;">
          <div style="height:100%;">${cardInner(left)}</div>
        </td>
        <td style="width:50%;padding:8px;vertical-align:top;height:100%;">
          <div style="height:100%;">${cardInner(right)}</div>
        </td>
      </tr>`;
    }
  }
  return html;
}

function marketPulseHtml(market) {
  if (!market || !market.bullets.length) return "";

  const items  = market.bullets.slice(0, 3);
  const icons  = ["📈", "🔍", "🤖"];
  const labels = ["Trend 01", "Trend 02", "Trend 03"];

  const rowsHtml = items.map((b, i) => `
    <tr>
      <td style="padding:16px 16px 16px 16px;vertical-align:top;width:44px;">
        <div style="width:44px;height:44px;background:#1e3a8a;border-radius:8px;text-align:center;line-height:44px;font-size:18px;">${icons[i]}</div>
      </td>
      <td style="padding:16px 16px 16px 4px;vertical-align:top;">
        <div style="font-size:9px;font-weight:700;color:#3b82f6;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:5px;">${labels[i]}</div>
        <div style="font-size:12px;color:#cbd5e1;line-height:1.7;">${b}</div>
      </td>
    </tr>
    ${i < items.length - 1
      ? `<tr><td colspan="2" style="padding:0 16px;"><div style="border-top:1px solid #1e293b;"></div></td></tr>`
      : ""}
  `).join("");

  return `
  <div style="padding:0 24px 28px 24px;">
    <div style="border-top:1px solid #1e293b;padding-top:16px;margin-bottom:14px;">
      <span style="font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.12em;">▪ Market Pulse — Industry Themes</span>
    </div>
    <div style="background:#0f172a;border:1px solid #1e3a8a;border-radius:8px;overflow:hidden;">
      <table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>
    </div>
  </div>`;
}

function buildNewsletterHtml(markdown) {
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric"
  });
  const sections    = parseDigest(markdown);
  const competitors = sections.filter(s => s.type === "competitor");
  const market      = sections.find(s => s.type === "market");
  const rows        = buildCompetitorRows(competitors);

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="width:100%;max-width:100%;background:#020617;">
  <div style="background:#020617;padding:28px 32px;border-bottom:1px solid #1e293b;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td>
          <div style="font-size:10px;color:#475569;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:6px;">Qapitol QA · Weekly Intelligence</div>
          <div style="font-size:32px;font-weight:900;color:#f8fafc;letter-spacing:-0.03em;line-height:1.1;">COMPETITOR<br>INTEL BRIEF</div>
        </td>
        <td style="text-align:right;vertical-align:middle;">
          <div style="font-size:12px;color:#64748b;line-height:2;">${date}<br><span style="color:#3b82f6;font-weight:700;font-size:13px;">Automated · Weekly</span></div>
        </td>
      </tr>
    </table>
    <div style="border-top:1px solid #1e293b;margin-top:16px;padding-top:12px;">
      <span style="font-size:11px;color:#475569;">Tracking: </span>
      ${competitors.map(c => `<span style="font-size:11px;color:#94a3b8;margin-right:16px;">▸ ${c.name}</span>`).join("")}
    </div>
  </div>
  <div style="padding:16px 24px 8px 24px;">
    <span style="font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.12em;">▪ Competitor Watch</span>
  </div>
  <div style="padding:0 16px 16px 16px;">
    <table style="width:100%;border-collapse:collapse;">${rows}</table>
  </div>
  ${marketPulseHtml(market)}
  <div style="background:#020617;border-top:1px solid #1e293b;padding:14px 32px;text-align:center;">
    <span style="font-size:11px;color:#334155;">Qapitol Intelligence Agent · Confidential · Do not forward</span>
  </div>
</div>
</body>
</html>`;

  return html.replace(/\n\s*/g, " ").replace(/\s{2,}/g, " ");
}

module.exports = { sendDigestEmail };
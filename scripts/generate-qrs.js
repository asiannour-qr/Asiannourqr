const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const tables = require("../data/tables.json");
const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const outdir = path.join(process.cwd(), "public", "qrs");
fs.mkdirSync(outdir, { recursive: true });
(async () => {
  for (const t of tables) {
    const url = `${base}/t/${t.id}?code=${t.secret}`;
    const file = path.join(outdir, `table-${t.id}.png`);
    await QRCode.toFile(file, url, { width: 512 });
    console.log("QR ->", file, url);
  }
  console.log("OK");
})();

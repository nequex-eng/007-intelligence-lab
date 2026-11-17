import { readFileSync, writeFileSync } from "node:fs";
const encoded = readFileSync(new URL("../assets/og-007.png.b64", import.meta.url), "utf8").trim();
const image = Buffer.from(encoded, "base64");
if (image.length < 1000 || image.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
  throw new Error("OG image source is invalid");
}
writeFileSync(new URL("../public/og-007.png", import.meta.url), image);
console.log(`Built OG image (${image.length} bytes)`);

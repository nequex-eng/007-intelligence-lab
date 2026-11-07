import { indexes, novels } from "../_lib/canon.js";
const json = (data) => new Response(JSON.stringify(data), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const englishOrNull = (value) => typeof value === "string" && value.trim() && !/[\u3400-\u9fff]/.test(value) ? value : null;
export async function onRequest() {
  const books = Object.fromEntries(novels.map(n => [n.novel_id, {
    title: n.title_zh, titleEn: n.title_en || n.novel_id, year: n.publication_year
  }]));
  const locations = indexes.locations.locations.map(place => ({
    id: place.id,
    name: place.name_zh || place.name_en,
    nameEn: place.name_en || null,
    country: place.country,
    countryEn: place.country_en || englishOrNull(place.country) || "Country not specified",
    fictional: Boolean(place.fictional),
    appearances: (place.appearances || []).map(a => ({
      novel: a.novel, novelNo: a.novel_no,
      title: books[a.novel]?.title || a.novel,
      titleEn: books[a.novel]?.titleEn || a.novel,
      year: books[a.novel]?.year || null,
      role: a.role,
      roleEn: a.role_en || englishOrNull(a.role) || "Appearance details not available in English."
    }))
  }));
  return json({ source: "verified-canon", locations, note: "知识库没有为全部地点提供坐标。只有经独立核实的真实地点才可绘制地图；虚构地点只列档案，不伪造坐标。" });
}
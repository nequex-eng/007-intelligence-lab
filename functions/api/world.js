import { indexes, novels } from "../_lib/canon.js";
const json = (data) => new Response(JSON.stringify(data), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
export async function onRequest() {
  const books = Object.fromEntries(novels.map(n => [n.novel_id, { title: n.title_zh, year: n.publication_year }]));
  const locations = indexes.locations.locations.map(place => ({
    id: place.id, name: place.name_zh || place.name_en, nameEn: place.name_en,
    country: place.country, fictional: Boolean(place.fictional),
    appearances: (place.appearances || []).map(a => ({ novel: a.novel, novelNo: a.novel_no, title: books[a.novel]?.title || a.novel, year: books[a.novel]?.year || null, role: a.role }))
  }));
  return json({ source: "verified-canon", locations, note: "知识库没有为全部地点提供坐标。只有经独立核实的真实地点才可绘制地图；虚构地点只列档案，不伪造坐标。" });
}

import { mkdir, writeFile } from "node:fs/promises";

const WARNING_RSS = "https://www.cwa.gov.tw/rss/Data/cwa_warning.xml";
const TYPHOON_PAGE = "https://www.cwa.gov.tw/V8/C/P/Typhoon/TY_NEWS.html";
const OUTPUT = new URL("../public/data/alerts.json", import.meta.url);

function decodeEntities(value) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function field(item, name) {
  const match = item.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"));
  return match ? decodeEntities(match[1]) : "";
}

function parseRss(xml) {
  return [...xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)]
    .map((match) => {
      const published = field(match[1], "pubDate");
      return {
        title: field(match[1], "title"),
        description: field(match[1], "description"),
        link: field(match[1], "link"),
        publishedAt:
          published && !Number.isNaN(new Date(published).getTime())
            ? new Date(published).toISOString()
            : null,
      };
    })
    .filter((item) => item.title);
}

async function fetchText(url, accept) {
  const response = await fetch(url, {
    headers: {
      Accept: accept,
      "User-Agent": "TaiwanWeatherGo-GitHubPages/1.0",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.text();
}

const fetchedAt = new Date().toISOString();
const [rssResult, pageResult] = await Promise.allSettled([
  fetchText(WARNING_RSS, "application/rss+xml, application/xml, text/xml"),
  fetchText(TYPHOON_PAGE, "text/html"),
]);

const rss = rssResult.status === "fulfilled" ? rssResult.value : "";
const page = pageResult.status === "fulfilled" ? pageResult.value : "";
const alerts = rss ? parseRss(rss).slice(0, 8) : [];
const typhoonPattern = /颱風|熱帶性低氣壓|熱帶低壓/;
const typhoonItems = alerts
  .filter((item) => typhoonPattern.test(`${item.title} ${item.description}`))
  .slice(0, 4);
const explicitlyNone =
  page.includes("目前無發布颱風消息") || page.includes("目前無發佈颱風消息");
const activeTyphoon = typhoonItems.length > 0 || Boolean(page && !explicitlyNone);
const available = Boolean(rss || page);

const payload = {
  available,
  activeTyphoon,
  statusText: !available
    ? "官方資料暫時無法取得"
    : activeTyphoon
      ? "目前有颱風或熱帶低壓消息"
      : "目前無發布颱風消息",
  typhoonItems,
  alerts,
  fetchedAt,
};

await mkdir(new URL("../public/data/", import.meta.url), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

if (!available) {
  console.warn("CWA data was unavailable; deployed fallback status instead.");
} else {
  console.log(`Saved ${alerts.length} CWA alert items at ${fetchedAt}.`);
}

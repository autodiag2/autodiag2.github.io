import fs from "fs"
import path from "path"
import * as cheerio from "cheerio"

const siteUrl = process.env.SITE_URL || "https://autodiag2.github.io"
const feedTitle = process.env.FEED_TITLE || "Posts"
const feedDescription = process.env.FEED_DESC || "Latest posts"
const feedPath = process.env.FEED_PATH || "/rss.xml"

const postsDir = path.resolve("public/posts")
const outJson = path.resolve("public/posts/index.json")
const outRss = path.resolve("public/rss.xml")

const files = fs.readdirSync(postsDir).filter(f => f.endsWith(".html"))

const esc = s =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")

const absUrl = p => {
  const base = siteUrl.replace(/\/+$/, "")
  const rel = String(p || "").replace(/^\/+/, "")
  return `${base}/${rel}`
}

const pickText = (root, sel) => (root.find(sel).first().text() || "").trim()

const textOrNull = v => {
  const s = String(v || "").trim()
  return s.length ? s : null
}

const isoOrNull = v => {
  const s = textOrNull(v)
  if (!s) return null
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

const posts = files
  .map((file, i) => {
    const filePath = path.join(postsDir, file)
    const content = fs.readFileSync(filePath, "utf8")
    const stats = fs.statSync(filePath)
    const $ = cheerio.load(content)

    const article = $("article").first()
    const root = article.length ? article : $.root()

    const title =
      pickText(root, "h2") ||
      pickText(root, "h1") ||
      $("title").first().text().trim() ||
      file.replace(/\.html$/i, "")

    const desc =
      $('meta[name="description"]').attr("content")?.trim() ||
      pickText(root, "p") ||
      ""

    const times = article.find("time")
    const publishedAt =
      isoOrNull(times.first().attr("datetime")) ||
      stats.birthtime?.toISOString?.() ||
      stats.mtime.toISOString()

    const updatedAt =
      isoOrNull(article.find("time.updated").first().attr("datetime")) ||
      isoOrNull(times.eq(1).attr("datetime")) ||
      stats.mtime.toISOString()

    return {
      id: i + 1,
      title,
      filename: file,
      publishedAt,
      updatedAt,
      description: desc
    }
  })
  .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

fs.writeFileSync(
  outJson,
  JSON.stringify(
    posts.map(({ description, ...rest }) => rest),
    null,
    2
  )
)

const now = new Date().toISOString()
const itemsXml = posts
  .map(p => {
    const link = absUrl(`/posts/${p.filename}`)
    const guid = link
    const pubDate = new Date(p.publishedAt).toUTCString()
    const filePath = path.join(postsDir, p.filename)
    const html = fs.readFileSync(filePath, "utf8")
    const $ = cheerio.load(html)
    const contentHtml = ($("article").first().html() || $("body").first().html() || "").trim()
    const desc = p.description ? esc(p.description) : ""

    return `    <item>
      <title>${esc(p.title)}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="true">${esc(guid)}</guid>
      <pubDate>${esc(pubDate)}</pubDate>
      <description>${desc}</description>
      <content:encoded><![CDATA[${contentHtml}]]></content:encoded>
      <source url="${esc(absUrl(feedPath))}">${esc(feedTitle)}</source>
      <atom:updated>${esc(new Date(p.updatedAt).toISOString())}</atom:updated>
      <atom:published>${esc(new Date(p.publishedAt).toISOString())}</atom:published>
    </item>`
  })
  .join("\n")

const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${esc(feedTitle)}</title>
    <link>${esc(siteUrl)}</link>
    <description>${esc(feedDescription)}</description>
    <language>en</language>
    <lastBuildDate>${esc(new Date(now).toUTCString())}</lastBuildDate>
    <atom:link href="${esc(absUrl(feedPath))}" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>
`

fs.writeFileSync(outRss, rssXml)
console.log(`Generated ${outJson} (${posts.length} posts)`)
console.log(`Generated ${outRss} (${posts.length} items)`)
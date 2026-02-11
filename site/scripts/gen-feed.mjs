import fs from "fs"
import path from "path"
import * as cheerio from "cheerio"
import { createHash } from "crypto"

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

const pickText = ($, sel) => ($(sel).first().text() || "").trim()

const posts = files
  .map((file, i) => {
    const filePath = path.join(postsDir, file)
    const content = fs.readFileSync(filePath, "utf8")
    const stats = fs.statSync(filePath)
    const $ = cheerio.load(content)

    const title =
      pickText($, "h2") ||
      pickText($, "h1") ||
      pickText($, "title") ||
      file.replace(/\.html$/i, "")

    const desc =
      $('meta[name="description"]').attr("content")?.trim() ||
      pickText($, "p") ||
      ""

    const createdAt = stats.birthtime?.toISOString?.() || stats.mtime.toISOString()
    const modifiedAt = stats.mtime.toISOString()

    return {
      id: i + 1,
      title,
      filename: file,
      createdAt,
      modifiedAt,
      description: desc,
    }
  })
  .sort((a, b) => (a.modifiedAt < b.modifiedAt ? 1 : a.modifiedAt > b.modifiedAt ? -1 : 0))

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
    const pubDate = new Date(p.modifiedAt).toUTCString()
    const createdIso = p.createdAt
    const filePath = path.join(postsDir, p.filename)
    const html = fs.readFileSync(filePath, "utf8")
    const $ = cheerio.load(html)
    const contentHtml = ($("article").first().html() || $("body").first().html() || "").trim()
    const contentEsc = esc(contentHtml)
    const desc = p.description ? esc(p.description) : ""
    const cid = createHash("sha1").update(link).digest("hex") + "@autodiag2.github.io"

    return `    <item>
      <title>${esc(p.title)}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="true">${esc(guid)}</guid>
      <pubDate>${esc(pubDate)}</pubDate>
      <description>${desc}</description>
      <content:encoded><![CDATA[${contentHtml}]]></content:encoded>
      <enclosure url="cid:${cid}" type="text/html" />
      <source url="${esc(absUrl(feedPath))}">${esc(feedTitle)}</source>
      <atom:updated>${esc(new Date(p.modifiedAt).toISOString())}</atom:updated>
      <atom:published>${esc(createdIso)}</atom:published>
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

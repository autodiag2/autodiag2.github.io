import fs from "fs"
import path from "path"
import * as cheerio from "cheerio"

const postsDir = path.resolve("public/posts")
const outFile = path.resolve("public/posts/index.json")

const files = fs.readdirSync(postsDir).filter(f => f.endsWith(".html"))

function textOrNull(v) {
  if (!v) return null
  const s = v.trim()
  return s.length ? s : null
}

function validIsoOrNull(v) {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

const posts = files.map((file, i) => {
  const filePath = path.join(postsDir, file)
  const content = fs.readFileSync(filePath, "utf8")
  const stats = fs.statSync(filePath)
  const $ = cheerio.load(content)

  const article = $("article").first()
  const title = textOrNull(article.find("h2").first().text()) || file.replace(".html", "")

  const times = article.find("time")
  const publishedAt =
    validIsoOrNull(times.first().attr("datetime")) ||
    stats.birthtime.toISOString()

  const updatedAt =
    validIsoOrNull(article.find('time.updated').first().attr("datetime")) ||
    validIsoOrNull(times.eq(1).attr("datetime")) ||
    stats.mtime.toISOString()

  return {
    id: i + 1,
    title,
    filename: file,
    publishedAt,
    updatedAt
  }
}).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))

fs.writeFileSync(outFile, JSON.stringify(posts, null, 2))
console.log(`Generated ${outFile} with ${posts.length} posts.`)
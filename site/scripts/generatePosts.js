import fs from "fs"
import path from "path"
import * as cheerio from "cheerio"

const postsDir = path.resolve("public/posts")
const outFile = path.resolve("public/posts/index.json")

const files = fs.readdirSync(postsDir).filter(f => f.endsWith(".html"))

const posts = files.map((file, i) => {
  const filePath = path.join(postsDir, file)
  const content = fs.readFileSync(filePath, "utf8")
  const stats = fs.statSync(filePath)
  const $ = cheerio.load(content)
  const title = $("h2").first().text() || file.replace(".html", "")
  return {
    id: i + 1,
    title,
    filename: file,
    createdAt: stats.birthtime.toISOString(),
    modifiedAt: stats.mtime.toISOString(),
  }
})

fs.writeFileSync(outFile, JSON.stringify(posts, null, 2))
console.log(`Generated ${outFile} with ${posts.length} posts.`)
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import fs from "fs"
import path from "path"
import * as cheerio from "cheerio"

export default defineConfig({
  plugins: [react()],
  server: {
    middlewareMode: false,
    setup: ({ middlewares }) => {
      middlewares.use("/posts/index.json", (req, res, next) => {
        const postsDir = path.resolve(__dirname, "public/posts")
        try {
          const files = fs.readdirSync(postsDir).filter(f => f.endsWith(".html"))
          const posts = files.map((file, i) => {
            const content = fs.readFileSync(path.join(postsDir, file), "utf8")
            const $ = cheerio.load(content)
            const title = $("h2").first().text() || file.replace(".html", "")
            return { id: i + 1, title, filename: file }
          })
          res.setHeader("Content-Type", "application/json")
          res.end(JSON.stringify(posts))
        } catch {
          res.statusCode = 500
          res.end("[]")
        }
      })
      next()
    },
  },
})

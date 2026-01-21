import { useState, useEffect } from "react"
import logo from "./assets/logo.png"
import logo_github from "./assets/logo_github.png"

type Post = { id: number; title: string; bodyFile: string; body?: string }

export default function App() {
  const [dark, setDark] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [loadingBody, setLoadingBody] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)
  const [homeContent, setHomeContent] = useState<string>("")

  useEffect(() => {
    // Load home page content from public/index.html (or another file if preferred)
    fetch("/index.html")
      .then(res => res.text())
      .then(html => setHomeContent(html))
      .catch(() => setHomeContent("<p>Welcome to autodiag2!</p>"))
  }, [])

  useEffect(() => {
    setLoadingPosts(true)
    fetch("/posts/index.json")
      .then(res => res.json())
      .then((data: { id: number; title: string; filename: string }[]) => {
        const postsData = data.map(({ id, title, filename }) => ({
          id,
          title,
          bodyFile: `/posts/${filename}`,
        }))
        setPosts(postsData)
        setLoadingPosts(false)
      })
      .catch(() => setLoadingPosts(false))
  }, [])

  useEffect(() => {
    if (selectedPostId == null) return

    const post = posts.find(p => p.id === selectedPostId)
    if (!post) return
    if (post.body) return

    setLoadingBody(true)
    fetch(post.bodyFile)
      .then(res => res.text())
      .then(html => {
        setPosts(prev =>
          prev.map(p => (p.id === post.id ? { ...p, body: html } : p))
        )
        setLoadingBody(false)
      })
      .catch(() => setLoadingBody(false))
  }, [selectedPostId, posts])

  const selectedPost = posts.find(p => p.id === selectedPostId)

  return (
    <div
      className={dark ? "solarized-dark" : "solarized-light"}
      style={{ display: "flex", height: "100vh", width: "100vw" }}
    >
      <nav
        style={{
          width: 250,
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          flexShrink: 0,
          overflowY: "auto",
        }}
      >
        <div className="presentation">
          <a
            href="#"
            onClick={e => {
              e.preventDefault()
              setSelectedPostId(null)
            }}
          >
            <img src={logo} alt="Logo" style={{ width: 200, height: 200 }} />
          </a>
          <div className="spacer"></div>
          <span className="title">autodiag2</span>
        </div>
        <div>
          <h3>Posts</h3>
          {loadingPosts && <p>Loading posts...</p>}
          {!loadingPosts &&
            posts.map(({ id, title }) => (
              <button
                key={id}
                onClick={() => setSelectedPostId(id)}
                className={`post-button${id === selectedPostId ? " selected" : ""}`}
                style={{
                  border: "none",
                  padding: "0.5rem",
                  textAlign: "left",
                  width: "100%",
                  cursor: "pointer",
                }}
              >
                {title}
              </button>
            ))}
        </div>
        <div
          className="social-icons"
          style={{ display: "flex", gap: "1rem", width: "100%" }}
        >
          <a href="https://github.com/autodiag2/">
            <img src={logo_github} alt="GitHub" style={{ width: 32, height: 32 }} />
          </a>
        </div>
      </nav>
      <main
        style={{
          flexGrow: 1,
          padding: "1rem",
          overflowY: "auto",
        }}
      >
        <button
          onClick={() => setDark(!dark)}
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 1000,
          }}
        >
          Toggle theme
        </button>

        {selectedPostId === null && !loadingBody && (
          <article
            dangerouslySetInnerHTML={{ __html: homeContent }}
            style={{ marginTop: "1.5rem" }}
          />
        )}

        {loadingBody && <p>Loading post content...</p>}

        {!loadingBody && selectedPost?.body && (
          <article
            style={{ marginTop: "1.5rem" }}
            dangerouslySetInnerHTML={{ __html: selectedPost.body }}
          />
        )}
      </main>
    </div>
  )
}

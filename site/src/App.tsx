import { useState, useEffect } from "react"

type Post = { id: number; title: string; body: string }

export default function App() {
  const [dark, setDark] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch("https://jsonplaceholder.typicode.com/posts?_limit=5")
      .then(res => res.json())
      .then((data: Post[]) => {
        setPosts(data)
        setLoading(false)
      })
  }, [])

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
        }}
      >
        <span className="title">autodiag</span>
        <a href="https://github.com/autodiag2/">GitHub</a>
        <button onClick={() => setDark(!dark)}>Toggle theme</button>
      </nav>
      <main
        style={{
          flexGrow: 1,
          padding: "1rem",
          overflowY: "auto",
        }}
      >
        <h1>elm327sim android</h1>
        <p>
          Autodiag democratizes access to car diagnostics and repair through
          open tools and documentation.
        </p>
        {loading && <p>Loading posts...</p>}
        {!loading &&
          posts.map(({ id, title, body }) => (
            <article key={id} style={{ marginBottom: "1.5rem" }}>
              <h2>{title}</h2>
              <p>{body}</p>
            </article>
          ))}
      </main>
    </div>
  )
}
import { useState } from "react"

export default function App() {
  const [dark, setDark] = useState(false)

  return (
    <div className={dark ? "solarized-dark" : "solarized-light"}>
      <nav>
        <span className="title">autodiag</span>
        <a href="https://github.com/autodiag2/">GitHub</a>
        <button onClick={() => setDark(dark === false)}>
          Toggle theme
        </button>
      </nav>
      <main>
        <h1>elm327sim android</h1>
        <p>
          Autodiag democratizes access to car diagnostics and repair through
          open tools and documentation.
        </p>
      </main>
    </div>
  )
}

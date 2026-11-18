import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import AuthShell from "../components/AuthShell"
import useAuth from "../hooks/useAuth"
import { errorMessage } from "../service/api"
import { getMyDetails, login } from "../service/auth"
import { setTokens } from "../lib/storage"

function Login() {
  const navigate = useNavigate()
  const { setUser } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    if (!email || !password) return setError("Please fill all fields..!")

    setBusy(true)
    setError("")
    try {
      const res = await login(email, password)
      const { access_token, refresh_token } = res.data
      if (!access_token || !refresh_token) throw new Error("Missing tokens")

      setTokens(access_token, refresh_token)
      const me = await getMyDetails()
      setUser(me.data)
      navigate("/", { replace: true })
    } catch (err) {
      console.error(err)
      setError(errorMessage(err, "Login fail..!"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to pick up where you left off.">
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" autoComplete="email" placeholder="you@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error && <p className="rounded-lg border border-crimson-700 bg-crimson-900/40 px-3 py-2 text-sm text-crimson-300">{error}</p>}

        <button type="submit" className="btn btn-primary mt-1 w-full py-2.5" disabled={busy}>
          {busy ? "Signing in…" : "Log in"}
        </button>

        <p className="mt-2 text-center text-sm text-ink-300">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-crimson-400 hover:underline">
            Register
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}

export default Login

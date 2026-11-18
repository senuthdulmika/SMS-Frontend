import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import AuthShell from "../components/AuthShell"
import { errorMessage } from "../service/api"
import { register } from "../service/auth"

function Register() {
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [coPassword, setCOPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password || !coPassword) return setError("Please fill all fields..!")
    if (password.length < 6) return setError("Password must be at least 6 characters..!")
    if (password !== coPassword) return setError("Password not matched..!")

    setBusy(true)
    setError("")
    try {
      await register(name, email, password)
      navigate("/login")
    } catch (err) {
      console.error(err)
      setError(errorMessage(err, "Registration fail..!"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Start organising your studies in under a minute.">
      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <div>
          <label className="label">Full name</label>
          <input className="input" autoComplete="name" placeholder="Senuth" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" autoComplete="email" placeholder="you@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" autoComplete="new-password" placeholder="min. 6 chars" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <label className="label">Confirm</label>
            <input className="input" type="password" autoComplete="new-password" placeholder="repeat" value={coPassword} onChange={(e) => setCOPassword(e.target.value)} />
          </div>
        </div>

        {error && <p className="rounded-lg border border-crimson-700 bg-crimson-900/40 px-3 py-2 text-sm text-crimson-300">{error}</p>}

        <button type="submit" className="btn btn-primary mt-1 w-full py-2.5" disabled={busy}>
          {busy ? "Creating…" : "Create account"}
        </button>

        <p className="mt-2 text-center text-sm text-ink-300">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-crimson-400 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}

export default Register

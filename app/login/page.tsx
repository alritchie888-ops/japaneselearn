"use client"

import { useRef, useState } from "react"
import { ArrowLeft, Loader2, Smartphone } from "lucide-react"

const DEMO_ACCOUNTS = [
  { name: "Alistair", phone: "(555) 111-0001", code: "111111" },
  { name: "Xu Er", phone: "(555) 111-0002", code: "222222" },
  { name: "Josh", phone: "(555) 111-0003", code: "333333" },
]

export default function LoginPage() {
  const [step, setStep] = useState<"phone" | "code">("phone")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [name, setName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const composing = useRef(false)

  async function requestCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.")
        return
      }
      setName(data.name)
      setStep("code")
    } catch {
      setError("Network error. Try again.")
    } finally {
      setBusy(false)
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.")
        return
      }
      window.location.href = "/"
    } catch {
      setError("Network error. Try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground font-jp">
            あ
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">
            Sign in to Kana
          </h1>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            {step === "phone"
              ? "Enter your phone number to get a login code."
              : `Enter the code sent to ${name ?? "your phone"}.`}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {step === "phone" ? (
            <form onSubmit={requestCode} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                Phone number
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 focus-within:ring-2 focus-within:ring-ring">
                  <Smartphone className="size-4 text-muted-foreground" aria-hidden="true" />
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 111-0001"
                    className="w-full bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground"
                    aria-label="Phone number"
                  />
                </div>
              </label>
              {error && <p className="text-sm font-medium text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={busy}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Send code
              </button>
            </form>
          ) : (
            <form onSubmit={verify} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                Verification code
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onCompositionStart={() => (composing.current = true)}
                  onCompositionEnd={() => (composing.current = false)}
                  placeholder="6-digit code"
                  className="rounded-xl border border-border bg-background px-3 py-3 text-center text-2xl font-semibold tracking-[0.4em] outline-none focus:ring-2 focus:ring-ring placeholder:text-base placeholder:font-normal placeholder:tracking-normal placeholder:text-muted-foreground"
                  aria-label="Verification code"
                />
              </label>
              {error && <p className="text-sm font-medium text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={busy}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Verify &amp; continue
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("phone")
                  setCode("")
                  setError(null)
                }}
                className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                Use a different number
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/50 p-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Demo accounts
          </p>
          <ul className="flex flex-col gap-1.5">
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.name} className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{a.name}</span>
                <span className="font-mono text-muted-foreground">
                  {a.phone} · code {a.code}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  )
}

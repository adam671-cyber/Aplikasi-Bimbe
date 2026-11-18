"use client";

import * as React from "react";
import { useActionState } from "react";
import { AlertCircle, ArrowRight, Eye, EyeOff, KeyRound, UserRound } from "lucide-react";
import { loginAction, type LoginState } from "@/lib/auth/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const demoAccounts = [
  { label: "Siswa", identifier: "6001", password: "siswa123", description: "Alya Putri · Kelas 6" },
  { label: "Tutor", identifier: "tutor", password: "tutor123", description: "Bu Rani · Kelas 6" },
  { label: "Admin", identifier: "admin", password: "admin123", description: "Admin Bimbel" },
];

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {}
  );
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  const fill = (account: (typeof demoAccounts)[number]) => {
    setIdentifier(account.identifier);
    setPassword(account.password);
  };

  return (
    <div>
      <form action={formAction} className="space-y-4">
        {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}

        {state.error ? (
          <Alert variant="error" title="Tidak bisa masuk">
            {state.error}
          </Alert>
        ) : null}

        <div>
          <Label htmlFor="identifier" required>
            Username atau NIS
          </Label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="identifier"
              name="identifier"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="Contoh: 6001 atau tutor"
              autoComplete="username"
              autoCapitalize="none"
              className="pl-10"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="password" required>
            Password
          </Label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Masukkan password"
              autoComplete="current-password"
              className="px-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" size="lg" disabled={pending} className="w-full">
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Memeriksa akun…
            </span>
          ) : (
            <>
              Masuk
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        <p className="text-center text-[12px] leading-5 text-slate-500">
          Lupa password? Hubungi tutor atau admin bimbel untuk reset password.
        </p>
      </form>

      <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Akun demo
        </p>
        <p className="mt-1 text-[12px] text-slate-500">
          Pilih salah satu peran untuk mengisi formulir otomatis.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {demoAccounts.map((account) => (
            <button
              key={account.label}
              type="button"
              onClick={() => fill(account)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-brand-300 hover:bg-brand-50/50"
            >
              <span className="flex items-center justify-between text-[12px] font-semibold text-slate-800">
                {account.label}
                <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
              </span>
              <span className="mt-0.5 block truncate text-[10px] text-slate-400">
                {account.description}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-start gap-2 text-[10px] leading-4 text-slate-400">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Data demo disimpan di memori server dan kembali ke kondisi awal saat
          server dijalankan ulang.
        </div>
      </div>
    </div>
  );
}

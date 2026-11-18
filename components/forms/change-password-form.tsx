"use client";

import { useActionState, useEffect, useRef } from "react";
import { KeyRound } from "lucide-react";
import { changePasswordAction, type PasswordState } from "@/lib/auth/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<PasswordState, FormData>(
    changePasswordAction,
    {}
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}

      <div>
        <Label htmlFor="oldPassword" required>
          Password lama
        </Label>
        <Input
          id="oldPassword"
          name="oldPassword"
          type="password"
          autoComplete="current-password"
          placeholder="Masukkan password saat ini"
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="newPassword" required>
            Password baru
          </Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
            minLength={8}
            required
          />
        </div>
        <div>
          <Label htmlFor="confirmPassword" required>
            Ulangi password baru
          </Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Ulangi password baru"
            minLength={8}
            required
          />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        <KeyRound className="h-4 w-4" />
        {pending ? "Menyimpan…" : "Perbarui password"}
      </Button>
    </form>
  );
}

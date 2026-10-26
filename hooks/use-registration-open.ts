import { useEffect, useState } from "react"

/** Whether public sign-up is open, which only happens before the first (admin) account exists. */
export function useRegistrationOpen() {
  const [open, setOpen] = useState<boolean | null>(null)

  useEffect(() => {
    fetch("/api/auth/register")
      .then((response) => (response.ok ? response.json() : { registrationOpen: false }))
      .then((data) => setOpen(!!data.registrationOpen))
      .catch(() => setOpen(false))
  }, [])

  return open
}

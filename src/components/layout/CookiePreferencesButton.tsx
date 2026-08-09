"use client";

import { OPEN_CONSENT_EVENT } from "@/lib/consent";

export default function CookiePreferencesButton() {
  return <button type="button" className="transition-colors hover:text-[#F8FAFC]" onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}>Preferenze cookie</button>;
}

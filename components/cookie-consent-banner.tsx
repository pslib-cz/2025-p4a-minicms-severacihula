"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const STORAGE_KEY = "cookie-consent-choice";

type ConsentChoice = "accepted" | "rejected";

export function CookieConsentBanner() {
  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const savedChoice = localStorage.getItem(STORAGE_KEY);
    if (savedChoice === "accepted" || savedChoice === "rejected") {
      setChoice(savedChoice);
    }
    setIsReady(true);
  }, []);

  const updateChoice = (nextChoice: ConsentChoice) => {
    localStorage.setItem(STORAGE_KEY, nextChoice);
    setChoice(nextChoice);
  };

  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <>
      {isReady && choice === "accepted" && gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId}');`}
          </Script>
        </>
      ) : null}

      {isReady && choice === null ? (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-300 bg-white/95 p-4 shadow-lg backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-700">
              Tato aplikace pouziva analyticke cookies pro mereni navstevnosti.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700"
                onClick={() => updateChoice("rejected")}
              >
                Odmitnout
              </button>
              <button
                type="button"
                className="rounded bg-slate-900 px-4 py-2 text-sm text-white"
                onClick={() => updateChoice("accepted")}
              >
                Prijmout vse
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

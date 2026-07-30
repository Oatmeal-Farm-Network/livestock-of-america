import { useEffect, useState } from "react";
import {
  CONTACT_EMAIL,
  LIVESTOCK_API_URL,
  SAIGE_API_URL,
  endpoints,
} from "./config/api";

export default function App() {
  const [health, setHealth] = useState<string>("…");

  useEffect(() => {
    if (!LIVESTOCK_API_URL) {
      setHealth("VITE_LIVESTOCK_API_URL not set");
      return;
    }
    fetch(endpoints.health())
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        setHealth(
          r.ok
            ? `ok (${body.service ?? "livestock"})`
            : `HTTP ${r.status}`,
        );
      })
      .catch((err: unknown) => {
        setHealth(err instanceof Error ? err.message : "request failed");
      });
  }, []);

  return (
    <main className="page">
      <p className="brand">Livestock of America</p>
      <h1>Buy, sell, and manage livestock</h1>
      <p className="lede">
        Dedicated livestock marketplace, breed knowledge, and herd tools —
        powered by the livestock API service.
      </p>
      <dl className="env">
        <div>
          <dt>Livestock API</dt>
          <dd>{LIVESTOCK_API_URL || "(not set)"}</dd>
        </div>
        <div>
          <dt>API health</dt>
          <dd>{health}</dd>
        </div>
        {SAIGE_API_URL ? (
          <div>
            <dt>Saige API</dt>
            <dd>{SAIGE_API_URL}</dd>
          </div>
        ) : null}
        {CONTACT_EMAIL ? (
          <div>
            <dt>Contact</dt>
            <dd>
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </dd>
          </div>
        ) : null}
      </dl>
    </main>
  );
}

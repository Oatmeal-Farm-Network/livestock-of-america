import {
  CONTACT_EMAIL,
  LIVESTOCK_API_URL,
  OFN_API_URL,
  SAIGE_API_URL,
} from "./config/api";

export default function App() {
  return (
    <main className="page">
      <p className="brand">Livestock of America</p>
      <h1>Buy, sell, and manage livestock</h1>
      <p className="lede">
        Dedicated livestock marketplace, breed knowledge, and herd tools.
      </p>
      <dl className="env">
        <div>
          <dt>Livestock API</dt>
          <dd>{LIVESTOCK_API_URL || "(not set)"}</dd>
        </div>
        <div>
          <dt>OFN API (auth / marketplace / animals)</dt>
          <dd>{OFN_API_URL || "(not set)"}</dd>
        </div>
        <div>
          <dt>Saige API</dt>
          <dd>{SAIGE_API_URL || "(not set)"}</dd>
        </div>
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

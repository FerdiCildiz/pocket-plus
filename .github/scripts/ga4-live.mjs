// Pulls the last 30 minutes of live GA4 data (Realtime API) and writes out/ga4.json.
// Runs inside GitHub Actions. Needs env GA4_SERVICE_ACCOUNT (the service account JSON key).
// Uses only Node built-ins (Node 20+).
import crypto from "node:crypto";
import fs from "node:fs";

const PROPERTY = process.env.GA4_PROPERTY_ID || "563945414";
const key = JSON.parse(process.env.GA4_SERVICE_ACCOUNT);

const b64u = (value) => Buffer.from(value).toString("base64url");

async function accessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = b64u(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64u(
    JSON.stringify({
      iss: key.client_email,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claims}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(unsigned), key.private_key).toString("base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  if (!res.ok) throw new Error(`token request failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

async function realtime(token, body) {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY}:runRealtimeReport`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`realtime report failed: ${res.status} ${await res.text()}`);
  return res.json();
}

const token = await accessToken();

const [byCountry, byEvent, total] = await Promise.all([
  realtime(token, {
    dimensions: [{ name: "country" }],
    metrics: [{ name: "activeUsers" }],
    limit: 50,
  }),
  realtime(token, {
    dimensions: [{ name: "eventName" }],
    metrics: [{ name: "eventCount" }],
    limit: 50,
  }),
  realtime(token, {
    metrics: [{ name: "activeUsers" }],
  }),
]);

const output = {
  updated: new Date().toISOString(),
  window: "last 30 minutes",
  activeUsers: Number(total.rows?.[0]?.metricValues?.[0]?.value ?? 0),
  countries: (byCountry.rows || [])
    .map((r) => ({ country: r.dimensionValues[0].value, activeUsers: Number(r.metricValues[0].value) }))
    .sort((a, b) => b.activeUsers - a.activeUsers),
  events: (byEvent.rows || [])
    .map((r) => ({ event: r.dimensionValues[0].value, count: Number(r.metricValues[0].value) }))
    .sort((a, b) => b.count - a.count),
};

fs.mkdirSync("out", { recursive: true });
fs.writeFileSync("out/ga4.json", JSON.stringify(output, null, 2) + "\n");
console.log(`wrote out/ga4.json: ${output.activeUsers} active users, ${output.countries.length} countries, ${output.events.length} event names`);

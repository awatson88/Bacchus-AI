const mobileStyles = `
:root {
  color-scheme: light;
  --bg: #f7f1e8;
  --panel: rgba(255, 250, 244, 0.96);
  --panel-strong: #fffaf4;
  --ink: #2f2318;
  --muted: #746252;
  --line: rgba(85, 58, 36, 0.15);
  --brand: #a23a2c;
  --brand-strong: #7d291f;
  --brand-soft: rgba(162, 58, 44, 0.12);
  --ok: #25634f;
  --warn: #8c5b12;
  --shadow: 0 20px 50px rgba(71, 46, 28, 0.12);
  --radius-xl: 24px;
  --radius-lg: 18px;
  --radius-md: 14px;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  min-height: 100%;
  font-family: "Avenir Next", "Segoe UI", sans-serif;
  background:
    radial-gradient(circle at top left, rgba(255, 222, 179, 0.6), transparent 35%),
    radial-gradient(circle at top right, rgba(162, 58, 44, 0.12), transparent 30%),
    linear-gradient(180deg, #fbf6ef 0%, #f4ebdf 100%);
  color: var(--ink);
}

body {
  padding: 18px 14px 28px;
}

.shell {
  width: min(100%, 760px);
  margin: 0 auto;
}

.hero {
  padding: 18px 18px 10px;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.5);
  color: var(--muted);
  font-size: 13px;
  letter-spacing: 0.02em;
}

.title {
  margin: 16px 0 8px;
  font-family: "Iowan Old Style", "Palatino Linotype", serif;
  font-size: clamp(34px, 9vw, 52px);
  line-height: 0.96;
}

.subtitle {
  margin: 0;
  color: var(--muted);
  font-size: 16px;
  line-height: 1.5;
}

.token-card,
.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow);
  backdrop-filter: blur(14px);
}

.token-card {
  padding: 18px;
  margin: 16px 0 18px;
}

.section-grid {
  display: grid;
  gap: 16px;
}

.panel {
  padding: 18px;
}

.panel h2 {
  margin: 0 0 8px;
  font-size: 22px;
}

.panel p {
  margin: 0 0 14px;
  color: var(--muted);
  line-height: 1.45;
}

.field {
  display: grid;
  gap: 8px;
  margin-bottom: 14px;
}

.field label {
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
}

input,
textarea,
select,
button {
  font: inherit;
}

input,
textarea,
select {
  width: 100%;
  border: 1px solid rgba(85, 58, 36, 0.18);
  background: rgba(255, 255, 255, 0.82);
  border-radius: var(--radius-md);
  padding: 14px 15px;
  color: var(--ink);
}

textarea {
  min-height: 96px;
  resize: vertical;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

button {
  border: 0;
  border-radius: 999px;
  padding: 14px 18px;
  font-weight: 700;
  cursor: pointer;
}

.button-primary {
  background: linear-gradient(135deg, var(--brand) 0%, var(--brand-strong) 100%);
  color: white;
}

.button-secondary {
  background: var(--brand-soft);
  color: var(--brand-strong);
}

.button-ghost {
  background: rgba(255, 255, 255, 0.7);
  color: var(--ink);
  border: 1px solid var(--line);
}

.status {
  margin-top: 10px;
  min-height: 22px;
  font-size: 14px;
  color: var(--muted);
}

.status.error { color: var(--brand); }
.status.success { color: var(--ok); }
.status.warn { color: var(--warn); }

.candidate-list,
.recommendation-list,
.inventory-list {
  display: grid;
  gap: 12px;
  margin-top: 14px;
}

.card {
  padding: 14px;
  border-radius: var(--radius-lg);
  background: var(--panel-strong);
  border: 1px solid rgba(85, 58, 36, 0.12);
}

.card h3 {
  margin: 0 0 6px;
  font-size: 17px;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 6px 0 0;
}

.pill {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  background: rgba(85, 58, 36, 0.08);
  color: var(--muted);
}

.card p,
.card ul {
  margin: 8px 0 0;
  color: var(--muted);
  line-height: 1.45;
}

.card ul {
  padding-left: 18px;
}

.candidate-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.candidate-actions button {
  padding: 10px 14px;
  font-size: 14px;
}

.split {
  display: grid;
  gap: 16px;
}

.fine-print {
  margin-top: 10px;
  font-size: 12px;
  color: var(--muted);
}

@media (min-width: 760px) {
  body { padding: 26px 20px 34px; }
  .section-grid { grid-template-columns: 1.1fr 0.9fr; align-items: start; }
  .split { grid-template-columns: 1fr 1fr; }
}
`;

const mobileScript = `
const state = {
  token: localStorage.getItem("bartendergpt_api_token") || "",
  intakeJob: null
};

const tokenInput = document.querySelector("#token");
const tokenStatus = document.querySelector("#token-status");
const intakeStatus = document.querySelector("#intake-status");
const recommendationsStatus = document.querySelector("#recommendations-status");
const inventoryStatus = document.querySelector("#inventory-status");
const candidatesRoot = document.querySelector("#candidates");
const recommendationsRoot = document.querySelector("#recommendations");
const inventoryRoot = document.querySelector("#inventory-results");

tokenInput.value = state.token;
updateTokenStatus();

document.querySelector("#save-token").addEventListener("click", () => {
  state.token = tokenInput.value.trim();
  if (state.token) {
    localStorage.setItem("bartendergpt_api_token", state.token);
  } else {
    localStorage.removeItem("bartendergpt_api_token");
  }
  updateTokenStatus("Saved on this phone.");
});

document.querySelector("#clear-token").addEventListener("click", () => {
  state.token = "";
  tokenInput.value = "";
  localStorage.removeItem("bartendergpt_api_token");
  updateTokenStatus("Cleared.");
});

document.querySelector("#intake-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus(intakeStatus, "Preparing your bottle photos…");

  const files = [...document.querySelector("#photos").files];
  const message = document.querySelector("#intake-message").value.trim() || "Add these bottles to my inventory.";
  const location = document.querySelector("#intake-location").value.trim();

  if (!files.length) {
    setStatus(intakeStatus, "Choose at least one bottle photo first.", "error");
    return;
  }

  if (!state.token) {
    setStatus(intakeStatus, "Add your BartenderGPT API token first.", "error");
    return;
  }

  try {
    const images = await Promise.all(files.map(fileToImagePayload));
    const response = await authedFetch("/api/v1/intake/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        location: location || undefined,
        quantity: 1,
        images
      })
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    const payload = await response.json();
    state.intakeJob = payload.job;
    renderCandidates(payload.job);
    setStatus(
      intakeStatus,
      payload.nextStep || "Review the detected bottles below, then approve the ones you want.",
      "success"
    );
  } catch (error) {
    setStatus(intakeStatus, error.message || "Unable to process these bottle photos.", "error");
  }
});

document.querySelector("#wine-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus(recommendationsStatus, "Looking through your cellar…");

  const meal = document.querySelector("#meal").value.trim();
  const mood = document.querySelector("#mood").value.trim();
  const weatherSummary = document.querySelector("#weather").value.trim();
  const budgetPreference = document.querySelector("#budget").value;

  if (!meal) {
    setStatus(recommendationsStatus, "Tell me what you're eating first.", "error");
    return;
  }

  try {
    const response = await fetch("/api/v1/recommendations/wine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        meal,
        mood: mood || undefined,
        weatherSummary: weatherSummary || undefined,
        budgetPreference: budgetPreference || undefined
      })
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    const payload = await response.json();
    renderWineRecommendations(payload.recommendations || []);
    setStatus(recommendationsStatus, "Wine suggestions refreshed.", "success");
  } catch (error) {
    setStatus(recommendationsStatus, error.message || "Unable to fetch wine suggestions.", "error");
  }
});

document.querySelector("#cocktail-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus(recommendationsStatus, "Shaking the menu…");

  const mood = document.querySelector("#cocktail-mood").value.trim();
  const weatherSummary = document.querySelector("#cocktail-weather").value.trim();
  const preferredBaseSpirit = document.querySelector("#cocktail-spirit").value.trim();

  try {
    const response = await fetch("/api/v1/recommendations/cocktails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mood: mood || undefined,
        weatherSummary: weatherSummary || undefined,
        preferredBaseSpirit: preferredBaseSpirit || undefined
      })
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    const payload = await response.json();
    renderCocktailRecommendations(payload.recommendations || []);
    setStatus(recommendationsStatus, "Cocktail suggestions refreshed.", "success");
  } catch (error) {
    setStatus(recommendationsStatus, error.message || "Unable to fetch cocktail suggestions.", "error");
  }
});

document.querySelector("#load-inventory").addEventListener("click", async () => {
  setStatus(inventoryStatus, "Loading inventory…");

  const category = document.querySelector("#inventory-category").value;
  const query = category ? "?category=" + encodeURIComponent(category) : "";

  try {
    const response = await fetch("/api/v1/inventory/items" + query);
    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    const payload = await response.json();
    renderInventory(payload.items || []);
    setStatus(inventoryStatus, payload.count + " bottles loaded.", "success");
  } catch (error) {
    setStatus(inventoryStatus, error.message || "Unable to load inventory.", "error");
  }
});

async function fileToImagePayload(file) {
  const dataUrl = await readFileAsDataUrl(file);
  return {
    filename: file.name,
    contentType: file.type || "image/jpeg",
    url: dataUrl
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read " + file.name));
    reader.readAsDataURL(file);
  });
}

function updateTokenStatus(message) {
  if (message) {
    setStatus(tokenStatus, message, "success");
    return;
  }

  if (state.token) {
    setStatus(tokenStatus, "Token saved on this device.", "success");
  } else {
    setStatus(tokenStatus, "Add your BartenderGPT API token once to enable photo intake and approvals.", "warn");
  }
}

function setStatus(node, message, kind) {
  node.textContent = message || "";
  node.className = "status" + (kind ? " " + kind : "");
}

async function authedFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  if (state.token) {
    headers.set("Authorization", "Bearer " + state.token);
  }
  return fetch(url, { ...options, headers });
}

async function getErrorMessage(response) {
  try {
    const payload = await response.json();
    return payload.message || payload.error || "Request failed.";
  } catch {
    return "Request failed.";
  }
}

function renderCandidates(job) {
  candidatesRoot.innerHTML = "";

  const pending = (job.candidates || []).filter((candidate) => candidate.decision !== "rejected");
  if (!pending.length) {
    candidatesRoot.innerHTML = '<div class="card"><p>No candidates detected yet.</p></div>';
    return;
  }

  pending.forEach((candidate, index) => {
    const card = document.createElement("article");
    card.className = "card";
    const name = [candidate.vintage, candidate.producer, candidate.label].filter(Boolean).join(" ") || "Unlabeled bottle";
    const reasoning = (candidate.reasoning || []).map((reason) => "<li>" + escapeHtml(reason) + "</li>").join("");
    card.innerHTML = \`
      <h3>\${index + 1}. \${escapeHtml(name)}</h3>
      <div class="meta">
        <span class="pill">\${escapeHtml(candidate.category)}</span>
        <span class="pill">confidence \${Math.round((candidate.confidence || 0) * 100)}%</span>
        \${candidate.baseSpirit ? '<span class="pill">' + escapeHtml(candidate.baseSpirit) + '</span>' : ""}
        \${candidate.priceTier ? '<span class="pill">' + escapeHtml(candidate.priceTier) + '</span>' : ""}
      </div>
      \${candidate.notes ? '<p>' + escapeHtml(candidate.notes) + '</p>' : ""}
      \${reasoning ? '<ul>' + reasoning + '</ul>' : ""}
      <div class="candidate-actions">
        <button class="button-secondary" data-action="approve">Approve</button>
        <button class="button-ghost" data-action="reject">Reject</button>
      </div>
    \`;

    card.querySelector('[data-action="approve"]').addEventListener("click", () => approveCandidate(job.id, candidate.id));
    card.querySelector('[data-action="reject"]').addEventListener("click", () => reviewCandidate(job.id, candidate.id, { decision: "rejected" }));
    candidatesRoot.appendChild(card);
  });
}

async function reviewCandidate(jobId, candidateId, patch) {
  try {
    const response = await authedFetch("/api/v1/intake/jobs/" + encodeURIComponent(jobId) + "/candidates/" + encodeURIComponent(candidateId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    const payload = await response.json();
    state.intakeJob = payload.job;
    renderCandidates(payload.job);
    setStatus(intakeStatus, "Candidate updated.", "success");
  } catch (error) {
    setStatus(intakeStatus, error.message || "Unable to update candidate.", "error");
  }
}

async function approveCandidate(jobId, candidateId) {
  try {
    const response = await authedFetch("/api/v1/intake/jobs/" + encodeURIComponent(jobId) + "/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateIds: [candidateId] })
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    const payload = await response.json();
    state.intakeJob = payload.job;
    renderCandidates(payload.job);
    setStatus(intakeStatus, "Approved " + payload.createdCount + " bottle" + (payload.createdCount === 1 ? "" : "s") + ".", "success");
  } catch (error) {
    setStatus(intakeStatus, error.message || "Unable to approve candidate.", "error");
  }
}

function renderWineRecommendations(recommendations) {
  recommendationsRoot.innerHTML = "";
  if (!recommendations.length) {
    recommendationsRoot.innerHTML = '<div class="card"><p>No matching wine suggestions yet.</p></div>';
    return;
  }

  recommendations.forEach((recommendation) => {
    const card = document.createElement("article");
    card.className = "card";
    const reasons = (recommendation.reasons || []).map((reason) => "<li>" + escapeHtml(reason) + "</li>").join("");
    card.innerHTML = \`
      <h3>\${escapeHtml(recommendation.displayName)}</h3>
      <div class="meta">
        <span class="pill">score \${Math.round(recommendation.score)}</span>
        <span class="pill">\${escapeHtml(recommendation.urgency || "unknown")}</span>
        \${recommendation.priceTier ? '<span class="pill">' + escapeHtml(recommendation.priceTier) + '</span>' : ""}
        \${typeof recommendation.estimatedPriceUsd === "number" ? '<span class="pill">$' + recommendation.estimatedPriceUsd.toFixed(0) + '</span>' : ""}
      </div>
      \${reasons ? '<ul>' + reasons + '</ul>' : ""}
    \`;
    recommendationsRoot.appendChild(card);
  });
}

function renderCocktailRecommendations(recommendations) {
  recommendationsRoot.innerHTML = "";
  if (!recommendations.length) {
    recommendationsRoot.innerHTML = '<div class="card"><p>No cocktail matches yet.</p></div>';
    return;
  }

  recommendations.forEach((recommendation) => {
    const card = document.createElement("article");
    card.className = "card";
    const reasons = (recommendation.reasons || []).map((reason) => "<li>" + escapeHtml(reason) + '</li>').join("");
    const missing = recommendation.missingIngredients?.length
      ? '<p>Missing: ' + recommendation.missingIngredients.map(escapeHtml).join(", ") + '</p>'
      : '<p>You have everything needed on hand.</p>';
    card.innerHTML = \`
      <h3>\${escapeHtml(recommendation.name)}</h3>
      <div class="meta">
        <span class="pill">score \${Math.round(recommendation.score)}</span>
        <span class="pill">matched \${(recommendation.matchedIngredients || []).length}</span>
      </div>
      \${missing}
      \${reasons ? '<ul>' + reasons + '</ul>' : ""}
    \`;
    recommendationsRoot.appendChild(card);
  });
}

function renderInventory(items) {
  inventoryRoot.innerHTML = "";
  if (!items.length) {
    inventoryRoot.innerHTML = '<div class="card"><p>No inventory results yet.</p></div>';
    return;
  }

  items.slice(0, 40).forEach((item) => {
    const card = document.createElement("article");
    card.className = "card";
    const name = [item.vintage, item.producer, item.label].filter(Boolean).join(" ");
    card.innerHTML = \`
      <h3>\${escapeHtml(name)}</h3>
      <div class="meta">
        <span class="pill">\${escapeHtml(item.category)}</span>
        <span class="pill">\${escapeHtml(item.status)}</span>
        <span class="pill">\${escapeHtml(item.location)}</span>
      </div>
      \${item.baseSpirit ? '<p>Base spirit: ' + escapeHtml(item.baseSpirit) + '</p>' : ""}
      \${typeof item.estimatedPriceUsd === "number" ? '<p>Estimated price: $' + item.estimatedPriceUsd.toFixed(0) + '</p>' : ""}
    \`;
    inventoryRoot.appendChild(card);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
`;

export const mobileManifest = JSON.stringify(
  {
    name: "BartenderGPT",
    short_name: "BartenderGPT",
    start_url: "/mobile",
    display: "standalone",
    background_color: "#f7f1e8",
    theme_color: "#a23a2c",
    description:
      "Phone-first BartenderGPT app for uploading bottles and asking for wine or cocktail ideas."
  },
  null,
  2
);

export function renderMobileAppHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#a23a2c" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="BartenderGPT" />
    <title>BartenderGPT</title>
    <link rel="manifest" href="/mobile/manifest.webmanifest" />
    <style>${mobileStyles}</style>
  </head>
  <body>
    <main class="shell">
      <section class="hero">
        <div class="eyebrow">Pocket cellar and bar companion</div>
        <h1 class="title">BartenderGPT</h1>
        <p class="subtitle">Upload new bottles from your phone, review what the model found, approve the keepers, and ask for pairings or cocktails without fighting the ChatGPT mobile app.</p>
      </section>

      <section class="token-card">
        <div class="field">
          <label for="token">Personal API token</label>
          <input id="token" type="password" placeholder="Paste your BARTENDERGPT_API_TOKEN once on this device" />
        </div>
        <div class="button-row">
          <button id="save-token" class="button-primary" type="button">Save token</button>
          <button id="clear-token" class="button-ghost" type="button">Clear</button>
        </div>
        <div id="token-status" class="status"></div>
        <p class="fine-print">Read-only recommendations work without a token, but photo intake and approvals still need your token.</p>
      </section>

      <section class="section-grid">
        <article class="panel">
          <h2>Add bottles</h2>
          <p>Take a few Binny’s shelf photos, add a note if you want, and BartenderGPT will build a review queue.</p>
          <form id="intake-form">
            <div class="field">
              <label for="photos">Bottle photos</label>
              <input id="photos" type="file" accept="image/*" capture="environment" multiple />
            </div>
            <div class="field">
              <label for="intake-message">What should I know?</label>
              <textarea id="intake-message" placeholder="Add these bottles to my bar cart."></textarea>
            </div>
            <div class="field">
              <label for="intake-location">Store them where?</label>
              <input id="intake-location" type="text" placeholder="Bar Cart, Wine Fridge, Cellar Rack A3..." />
            </div>
            <div class="button-row">
              <button class="button-primary" type="submit">Process bottle photos</button>
            </div>
            <div id="intake-status" class="status"></div>
          </form>
          <div id="candidates" class="candidate-list">
            <div class="card"><p>Your detected bottles will show up here for review.</p></div>
          </div>
        </article>

        <div class="split">
          <article class="panel">
            <h2>Wine pairing</h2>
            <p>Ask for a dinner pick with budget awareness.</p>
            <form id="wine-form">
              <div class="field">
                <label for="meal">Meal</label>
                <input id="meal" type="text" placeholder="Roast chicken, mushroom pasta, steak..." />
              </div>
              <div class="field">
                <label for="mood">Mood</label>
                <input id="mood" type="text" placeholder="Casual Tuesday night, date night..." />
              </div>
              <div class="field">
                <label for="weather">Weather</label>
                <input id="weather" type="text" placeholder="Cool rainy Chicago evening" />
              </div>
              <div class="field">
                <label for="budget">Budget</label>
                <select id="budget">
                  <option value="">Let BartenderGPT infer it</option>
                  <option value="everyday">Everyday</option>
                  <option value="special">Special</option>
                  <option value="splurge">Splurge</option>
                </select>
              </div>
              <button class="button-secondary" type="submit">Get wine suggestions</button>
            </form>
          </article>

          <article class="panel">
            <h2>Cocktail ideas</h2>
            <p>Ask for cocktails from what you already have.</p>
            <form id="cocktail-form">
              <div class="field">
                <label for="cocktail-mood">Mood</label>
                <input id="cocktail-mood" type="text" placeholder="Tiki, classic, cozy..." />
              </div>
              <div class="field">
                <label for="cocktail-weather">Weather</label>
                <input id="cocktail-weather" type="text" placeholder="Warm spring night in Chicago" />
              </div>
              <div class="field">
                <label for="cocktail-spirit">Preferred spirit</label>
                <input id="cocktail-spirit" type="text" placeholder="rum, tequila, bourbon..." />
              </div>
              <button class="button-secondary" type="submit">Get cocktail ideas</button>
            </form>
          </article>
        </div>
      </section>

      <section class="panel" style="margin-top: 16px;">
        <h2>Results</h2>
        <p>Wine and cocktail suggestions will appear here.</p>
        <div id="recommendations-status" class="status"></div>
        <div id="recommendations" class="recommendation-list">
          <div class="card"><p>Ask for a pairing or cocktail, and I’ll fill this section in.</p></div>
        </div>
      </section>

      <section class="panel" style="margin-top: 16px;">
        <h2>Inventory snapshot</h2>
        <p>Quickly glance at what’s in stock.</p>
        <div class="button-row" style="margin-bottom: 14px;">
          <select id="inventory-category">
            <option value="">All categories</option>
            <option value="wine">Wine</option>
            <option value="spirit">Spirit</option>
            <option value="liqueur">Liqueur</option>
            <option value="aperitif">Aperitif</option>
            <option value="bitters">Bitters</option>
            <option value="syrup">Syrup</option>
            <option value="mixer">Mixer</option>
          </select>
          <button id="load-inventory" class="button-ghost" type="button">Load inventory</button>
        </div>
        <div id="inventory-status" class="status"></div>
        <div id="inventory-results" class="inventory-list">
          <div class="card"><p>Load your inventory when you want a quick snapshot.</p></div>
        </div>
      </section>
    </main>
    <script>${mobileScript}</script>
  </body>
</html>`;
}

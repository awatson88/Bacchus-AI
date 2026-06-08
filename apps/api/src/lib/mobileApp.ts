const mobileStyles = `
:root {
  color-scheme: light;
  --bg: #f7f1e8;
  --panel: rgba(255, 250, 244, 0.96);
  --panel-strong: #fffaf4;
  --panel-soft: rgba(255, 253, 249, 0.9);
  --ink: #2f2318;
  --muted: #746252;
  --line: rgba(85, 58, 36, 0.15);
  --line-strong: rgba(85, 58, 36, 0.24);
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

body.sheet-open {
  overflow: hidden;
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

.button-row,
.card-actions {
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

button:disabled {
  opacity: 0.56;
  cursor: not-allowed;
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

.button-danger {
  background: rgba(162, 58, 44, 0.14);
  color: var(--brand-strong);
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

.meta,
.detail-meta {
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
.card ul,
.detail-copy,
.detail-list {
  margin: 8px 0 0;
  color: var(--muted);
  line-height: 1.45;
}

.card ul,
.detail-list {
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

.card-button {
  width: 100%;
  border: 0;
  padding: 0;
  background: transparent;
  text-align: left;
  color: inherit;
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.card-main {
  flex: 1;
  min-width: 0;
}

.disclosure {
  color: var(--muted);
  font-size: 14px;
  white-space: nowrap;
  padding-top: 4px;
}

.thumbnail,
.fallback-thumbnail {
  width: 56px;
  height: 78px;
  border-radius: 14px;
  border: 1px solid rgba(85, 58, 36, 0.12);
  overflow: hidden;
  background: linear-gradient(180deg, #efe4d6 0%, #dbc5ad 100%);
  flex-shrink: 0;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.fallback-thumbnail {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 8px 7px 7px;
  color: #4f3b2b;
}

.fallback-thumbnail::before {
  content: "";
  position: absolute;
  left: 16px;
  right: 16px;
  top: 10px;
  height: 10px;
  border-radius: 999px 999px 6px 6px;
  background: rgba(79, 59, 43, 0.14);
}

.fallback-icon {
  position: relative;
  z-index: 1;
  align-self: center;
  margin-top: 12px;
  font-size: 22px;
  line-height: 1;
}

.fallback-label {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 3px;
  padding: 6px 7px 7px;
  border-radius: 10px;
  background: rgba(255, 250, 244, 0.82);
  border: 1px solid rgba(85, 58, 36, 0.08);
}

.fallback-category {
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(79, 59, 43, 0.72);
}

.fallback-name {
  font-size: 9px;
  line-height: 1.1;
  font-weight: 700;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.fallback-vintage {
  font-size: 8px;
  color: rgba(79, 59, 43, 0.7);
}

.card-detail {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(85, 58, 36, 0.1);
}

.ingredient-grid {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.ingredient-card {
  padding: 12px;
  border-radius: var(--radius-md);
  background: var(--panel-soft);
  border: 1px solid rgba(85, 58, 36, 0.1);
}

.ingredient-card h4 {
  margin: 0;
  font-size: 14px;
}

.ingredient-card p {
  margin: 6px 0 0;
  font-size: 14px;
}

.option-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.option-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(85, 58, 36, 0.08);
  color: var(--ink);
  font-size: 12px;
}

.sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(31, 20, 12, 0.44);
  opacity: 0;
  pointer-events: none;
  transition: opacity 180ms ease;
}

.sheet-backdrop.visible {
  opacity: 1;
  pointer-events: auto;
}

.sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 92vh;
  overflow: auto;
  background: var(--panel);
  border-radius: 28px 28px 0 0;
  border: 1px solid var(--line);
  box-shadow: 0 -18px 50px rgba(31, 20, 12, 0.16);
  padding: 16px 16px 28px;
  transform: translateY(105%);
  transition: transform 220ms ease;
}

.sheet.visible {
  transform: translateY(0);
}

.sheet-handle {
  width: 52px;
  height: 6px;
  background: rgba(85, 58, 36, 0.16);
  border-radius: 999px;
  margin: 0 auto 14px;
}

.sheet-header {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.sheet-title {
  flex: 1;
}

.sheet-title h3 {
  margin: 0;
  font-size: 28px;
  line-height: 1.04;
}

.sheet-close {
  width: 42px;
  height: 42px;
  border-radius: 999px;
  padding: 0;
}

.detail-grid {
  display: grid;
  gap: 16px;
  margin-top: 18px;
}

.detail-panel {
  padding: 14px;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(85, 58, 36, 0.12);
  background: var(--panel-strong);
}

.detail-panel h4 {
  margin: 0 0 8px;
  font-size: 16px;
}

.timeline {
  display: grid;
  gap: 10px;
}

.timeline-entry {
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: rgba(85, 58, 36, 0.06);
}

.timeline-entry strong {
  display: block;
  margin-bottom: 2px;
}

.grid-two {
  display: grid;
  gap: 10px;
}

.panel-wide {
  grid-column: 1 / -1;
}

.concierge-panel {
  background:
    linear-gradient(135deg, rgba(255, 252, 247, 0.98) 0%, rgba(255, 247, 238, 0.95) 100%);
}

.context-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin: 10px 0 14px;
}

.context-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(85, 58, 36, 0.08);
  color: var(--ink);
  font-size: 13px;
}

.context-action {
  padding: 10px 14px;
}

.prompt-shell {
  display: grid;
  gap: 12px;
}

.prompt-input {
  min-height: 84px;
  border-radius: 22px;
  padding: 16px 18px;
  background: rgba(255, 255, 255, 0.9);
}

.prompt-submit {
  justify-self: flex-start;
}

.prompt-templates {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.prompt-chip {
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid var(--line);
  color: var(--ink);
  font-weight: 600;
}

.prompt-chip:hover {
  background: rgba(255, 255, 255, 0.9);
}

.pantry-preset-grid {
  display: grid;
  gap: 10px;
  margin: 14px 0;
}

.pantry-preset-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 12px 13px;
  border-radius: var(--radius-md);
  background: var(--panel-soft);
  border: 1px solid rgba(85, 58, 36, 0.1);
}

.pantry-preset-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(162, 58, 44, 0.1);
  font-size: 18px;
}

.pantry-preset-copy strong {
  display: block;
  font-size: 14px;
}

.pantry-preset-copy span {
  color: var(--muted);
  font-size: 12px;
}

.pantry-mini-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.pantry-mini-actions button {
  padding: 10px 14px;
  font-size: 14px;
}

@media (min-width: 760px) {
  body { padding: 26px 20px 34px; }
  .section-grid { grid-template-columns: 1.1fr 0.9fr; align-items: start; }
  .split { grid-template-columns: 1fr 1fr; }
  .grid-two { grid-template-columns: 1fr 1fr; }
}
`;

const mobileScript = `
const state = {
  token: localStorage.getItem("bartendergpt_api_token") || "",
  intakeJob: null,
  selectedItem: null,
  selectedItemEvents: [],
  inventoryItems: [],
  lastInventoryCategory: "",
  expandedCocktail: null,
  weatherContext: null,
  pantryItems: []
};

const pantryPresets = [
  {
    id: "orgeat",
    category: "syrup",
    producer: "House",
    label: "Orgeat",
    location: "Bar Pantry",
    cocktailTags: ["orgeat", "almond"]
  },
  {
    id: "gum-syrup",
    category: "syrup",
    producer: "House",
    label: "Gum Syrup",
    location: "Bar Pantry",
    cocktailTags: ["gum syrup", "rich syrup"]
  },
  {
    id: "grenadine",
    category: "syrup",
    producer: "House",
    label: "Homemade Grenadine",
    location: "Bar Pantry",
    cocktailTags: ["grenadine", "pomegranate"]
  },
  {
    id: "angostura",
    category: "bitters",
    producer: "Angostura",
    label: "Aromatic Bitters",
    location: "Bar Pantry",
    cocktailTags: ["bitters", "aromatic"]
  },
  {
    id: "orange-bitters",
    category: "bitters",
    producer: "Regans",
    label: "Orange Bitters No. 6",
    location: "Bar Pantry",
    cocktailTags: ["orange bitters", "bitters"]
  },
  {
    id: "luxardo",
    category: "mixer",
    producer: "Luxardo",
    label: "Maraschino Cherries",
    location: "Bar Pantry",
    cocktailTags: ["cherry", "garnish"]
  },
  {
    id: "pineapple-juice",
    category: "mixer",
    producer: "House",
    label: "Pineapple Juice",
    location: "Fridge",
    cocktailTags: ["pineapple juice"]
  }
];

const tokenInput = document.querySelector("#token");
const tokenStatus = document.querySelector("#token-status");
const intakeStatus = document.querySelector("#intake-status");
const conciergeStatus = document.querySelector("#concierge-status");
const recommendationsStatus = document.querySelector("#recommendations-status");
const inventoryStatus = document.querySelector("#inventory-status");
const pantryStatus = document.querySelector("#pantry-status");
const candidatesRoot = document.querySelector("#candidates");
const recommendationsRoot = document.querySelector("#recommendations");
const inventoryRoot = document.querySelector("#inventory-results");
const pantryRoot = document.querySelector("#pantry-results");
const sheetBackdrop = document.querySelector("#sheet-backdrop");
const detailSheet = document.querySelector("#detail-sheet");
const detailSheetBody = document.querySelector("#detail-sheet-body");
const ambientContextChip = document.querySelector("#ambient-context-chip");
const conciergePrompt = document.querySelector("#concierge-prompt");

tokenInput.value = state.token;
updateTokenStatus();
renderPantryPresets();
refreshAmbientContext();
loadPantry(true);

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

document.querySelector("#concierge-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  await runConciergePrompt();
});

document.querySelector("#refresh-ambient").addEventListener("click", async () => {
  await refreshAmbientContext(true);
});

document.querySelectorAll("[data-prompt-template]").forEach((button) => {
  button.addEventListener("click", () => {
    conciergePrompt.value = button.getAttribute("data-prompt-template") || "";
    conciergePrompt.focus();
  });
});

document.querySelector("#sheet-close").addEventListener("click", closeItemDetail);
sheetBackdrop.addEventListener("click", closeItemDetail);

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
  await loadInventory();
});

document.querySelector("#load-pantry").addEventListener("click", async () => {
  await loadPantry();
});

async function loadInventory() {
  setStatus(inventoryStatus, "Loading inventory…");
  const category = document.querySelector("#inventory-category").value;
  state.lastInventoryCategory = category;
  const query = category ? "?category=" + encodeURIComponent(category) : "";

  try {
    const response = await fetch("/api/v1/inventory/items" + query);
    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    const payload = await response.json();
    state.inventoryItems = payload.items || [];
    renderInventory(state.inventoryItems);
    setStatus(inventoryStatus, payload.count + " bottles loaded.", "success");
  } catch (error) {
    setStatus(inventoryStatus, error.message || "Unable to load inventory.", "error");
  }
}

async function loadPantry(silent = false) {
  if (!silent) {
    setStatus(pantryStatus, "Loading tracked pantry…");
  }

  try {
    const response = await fetch("/api/v1/inventory/items");
    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    const payload = await response.json();
    state.pantryItems = (payload.items || []).filter((item) =>
      ["bitters", "syrup", "mixer"].includes(item.category) &&
      !["consumed", "missing", "empty"].includes(item.status)
    );
    renderPantryItems(state.pantryItems);
    renderPantryPresets();

    if (!silent) {
      setStatus(pantryStatus, state.pantryItems.length + " tracked pantry items loaded.", "success");
    }
  } catch (error) {
    if (!silent) {
      setStatus(pantryStatus, error.message || "Unable to load pantry items.", "error");
    }
  }
}

async function runConciergePrompt() {
  const prompt = conciergePrompt.value.trim();
  if (!prompt) {
    setStatus(conciergeStatus, "Tell me what you're feeling or what dinner looks like first.", "error");
    return;
  }

  setStatus(conciergeStatus, "Thinking through your inventory, mood, and Chicago context…");
  setStatus(recommendationsStatus, "Working on a bartender's choice…");

  const mode = inferPromptMode(prompt);
  const weatherSummary = getAmbientSummary();

  try {
    if (mode === "wine") {
      const response = await fetch("/api/v1/recommendations/wine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meal: extractMealFromPrompt(prompt) || prompt,
          mood: prompt,
          weatherSummary,
          budgetPreference: inferBudgetPreferenceFromPrompt(prompt) || undefined
        })
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const payload = await response.json();
      renderWineRecommendations(payload.recommendations || []);
      setStatus(conciergeStatus, "Wine picks are ready.", "success");
      setStatus(recommendationsStatus, "Wine suggestions refreshed.", "success");
      return;
    }

    const response = await fetch("/api/v1/recommendations/cocktails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mood: prompt,
        weatherSummary,
        preferredBaseSpirit: inferPreferredSpiritFromPrompt(prompt) || undefined
      })
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    const payload = await response.json();
    renderCocktailRecommendations(payload.recommendations || []);
    setStatus(conciergeStatus, "Cocktail ideas are ready.", "success");
    setStatus(recommendationsStatus, "Cocktail suggestions refreshed.", "success");
  } catch (error) {
    const message = error.message || "Unable to work up a recommendation right now.";
    setStatus(conciergeStatus, message, "error");
    setStatus(recommendationsStatus, message, "error");
  }
}

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
    setStatus(tokenStatus, "Add your BartenderGPT API token once to enable photo intake, bottle edits, and approvals.", "warn");
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

async function refreshAmbientContext(showStatus = false) {
  if (showStatus) {
    setStatus(conciergeStatus, "Refreshing Chicago weather and season…");
  }

  try {
    const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=41.8781&longitude=-87.6298&current=temperature_2m,apparent_temperature,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FChicago");
    if (!response.ok) {
      throw new Error("Could not pull Chicago weather.");
    }

    const payload = await response.json();
    state.weatherContext = buildAmbientContext(payload.current);
  } catch {
    state.weatherContext = buildFallbackAmbientContext();
  }

  ambientContextChip.textContent = state.weatherContext.label;
  if (showStatus) {
    setStatus(conciergeStatus, "Chicago context refreshed.", "success");
  }
}

function buildAmbientContext(current) {
  const now = new Date();
  const season = getSeason(now);
  const weekday = now.toLocaleDateString(undefined, { weekday: "long" });
  const temperature = typeof current?.temperature_2m === "number" ? Math.round(current.temperature_2m) + "°F" : null;
  const weatherText = describeWeatherCode(current?.weather_code);
  const label = "Chicago now: " + [temperature, weatherText, season].filter(Boolean).join(" • ");
  const summary = ["Chicago", weekday, season, temperature, weatherText].filter(Boolean).join(", ");

  return { label, summary };
}

function buildFallbackAmbientContext() {
  const now = new Date();
  const season = getSeason(now);
  const weekday = now.toLocaleDateString(undefined, { weekday: "long" });
  return {
    label: "Chicago context: " + weekday + " • " + season,
    summary: ["Chicago", weekday, season].join(", ")
  };
}

function getAmbientSummary() {
  return state.weatherContext?.summary || buildFallbackAmbientContext().summary;
}

function getSeason(date) {
  const month = date.getMonth();
  if ([11, 0, 1].includes(month)) {
    return "winter";
  }
  if ([2, 3, 4].includes(month)) {
    return "spring";
  }
  if ([5, 6, 7].includes(month)) {
    return "summer";
  }
  return "fall";
}

function describeWeatherCode(code) {
  const map = {
    0: "clear",
    1: "mostly clear",
    2: "partly cloudy",
    3: "overcast",
    45: "foggy",
    48: "foggy",
    51: "light drizzle",
    53: "drizzly",
    55: "steady drizzle",
    61: "light rain",
    63: "rainy",
    65: "heavy rain",
    71: "snow showers",
    73: "snowy",
    75: "heavy snow",
    80: "scattered showers",
    81: "showery",
    82: "stormy showers",
    95: "thunderstorms"
  };
  return map[code] || "seasonal weather";
}

function inferPromptMode(prompt) {
  const normalized = normalize(prompt);

  if (includesAny(normalized, ["wine", "pair", "pairing", "cellar", "barolo", "pinot", "chablis", "champagne"])) {
    return "wine";
  }

  if (includesAny(normalized, ["cocktail", "martini", "margarita", "manhattan", "negroni", "daiquiri", "old fashioned", "tiki", "dealer's choice", "caribbean", "rum", "bourbon", "rye", "mezcal", "tequila", "gin"])) {
    return "cocktail";
  }

  if (includesAny(normalized, ["dinner", "lunch", "roast", "taco", "pasta", "steak", "chicken", "fish", "salmon"])) {
    return "wine";
  }

  return "cocktail";
}

function extractMealFromPrompt(prompt) {
  const normalized = prompt.trim();
  const match = normalized.match(/(?:having|making|eating)\s+(.+?)(?:\.|,| and | but | while | tonight|$)/i);
  return match?.[1]?.trim() || "";
}

function inferBudgetPreferenceFromPrompt(prompt) {
  const normalized = normalize(prompt);
  if (includesAny(normalized, ["tuesday", "weekday", "weeknight", "casual", "everyday"])) {
    return "everyday";
  }
  if (includesAny(normalized, ["special", "date night", "nice bottle", "celebration"])) {
    return "special";
  }
  if (includesAny(normalized, ["splurge", "trophy bottle", "go big"])) {
    return "splurge";
  }
  return "";
}

function inferPreferredSpiritFromPrompt(prompt) {
  const normalized = normalize(prompt);
  const spirits = ["rum", "tequila", "mezcal", "gin", "bourbon", "rye", "vodka"];
  return spirits.find((spirit) => normalized.includes(spirit)) || "";
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
      <div class="card-header">
        \${renderBottleVisual(candidate)}
        <div class="card-main">
          <h3>\${index + 1}. \${escapeHtml(name)}</h3>
          <div class="meta">
            <span class="pill">\${escapeHtml(candidate.category)}</span>
            <span class="pill">confidence \${Math.round((candidate.confidence || 0) * 100)}%</span>
            \${candidate.baseSpirit ? '<span class="pill">' + escapeHtml(candidate.baseSpirit) + '</span>' : ""}
            \${candidate.priceTier ? '<span class="pill">' + escapeHtml(candidate.priceTier) + '</span>' : ""}
          </div>
        </div>
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
    loadPantry(true);
    if (state.inventoryItems.length > 0) {
      loadInventory();
    }
  } catch (error) {
    setStatus(intakeStatus, error.message || "Unable to approve candidate.", "error");
  }
}

function renderWineRecommendations(recommendations) {
  recommendationsRoot.innerHTML = "";
  state.expandedCocktail = null;

  if (!recommendations.length) {
    recommendationsRoot.innerHTML = '<div class="card"><p>No matching wine suggestions yet.</p></div>';
    return;
  }

  recommendations.forEach((recommendation) => {
    const card = document.createElement("article");
    card.className = "card";
    const reasons = (recommendation.reasons || []).map((reason) => "<li>" + escapeHtml(reason) + "</li>").join("");
    const bottleVisualTarget = {
      imageUrl: recommendation.imageUrl,
      category: "wine",
      label: recommendation.displayName,
      displayName: recommendation.displayName
    };
    card.innerHTML = \`
      <div class="card-header">
        \${renderBottleVisual(bottleVisualTarget)}
        <div class="card-main">
          <h3>\${escapeHtml(recommendation.displayName)}</h3>
          <div class="meta">
            <span class="pill">score \${Math.round(recommendation.score)}</span>
            <span class="pill">\${escapeHtml(recommendation.urgency || "unknown")}</span>
            \${recommendation.priceTier ? '<span class="pill">' + escapeHtml(recommendation.priceTier) + '</span>' : ""}
            \${typeof recommendation.estimatedPriceUsd === "number" ? '<span class="pill">$' + recommendation.estimatedPriceUsd.toFixed(0) + '</span>' : ""}
          </div>
        </div>
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
    const expanded = state.expandedCocktail === recommendation.name;
    const card = document.createElement("article");
    card.className = "card";
    const reasons = (recommendation.reasons || []).map((reason) => "<li>" + escapeHtml(reason) + "</li>").join("");
    const matchedInventory = (recommendation.matchedInventory || [])
      .map((group) => {
        const options = group.assumedPantry
          ? '<p>Assumed pantry staple.</p>'
          : '<div class="option-list">' + (group.matchedItems || []).map((item) => '<span class="option-pill">' + escapeHtml(item.displayName) + '</span>').join("") + '</div>';
        return '<div class="ingredient-card"><h4>' + escapeHtml(group.ingredient) + '</h4>' + options + '</div>';
      })
      .join("");
    const riffOptions = (recommendation.riffOptions || [])
      .map((riff) => {
        const options = (riff.items || []).map((item) => '<span class="option-pill">' + escapeHtml(item.displayName) + '</span>').join("");
        return '<div class="ingredient-card"><h4>' + escapeHtml(riff.title) + '</h4><p>' + escapeHtml(riff.description) + '</p><div class="option-list">' + options + '</div></div>';
      })
      .join("");
    const steps = (recommendation.recipeSteps || []).map((step) => "<li>" + escapeHtml(step) + "</li>").join("");
    const servingNotes = (recommendation.servingNotes || []).map((note) => "<li>" + escapeHtml(note) + "</li>").join("");

    card.innerHTML = \`
      <button type="button" class="card-button" data-toggle="cocktail">
        <div class="card-header">
          <div class="fallback-thumbnail">\${escapeHtml(getInitials(recommendation.name))}</div>
          <div class="card-main">
            <h3>\${escapeHtml(recommendation.name)}</h3>
            <div class="meta">
              <span class="pill">score \${Math.round(recommendation.score)}</span>
              <span class="pill">\${(recommendation.matchedIngredients || []).length} ingredients covered</span>
            </div>
            <p>\${recommendation.missingIngredients?.length ? 'Missing ' + escapeHtml(recommendation.missingIngredients.join(', ')) : 'You have everything needed on hand.'}</p>
          </div>
          <div class="disclosure">\${expanded ? "Hide" : "Recipe"}</div>
        </div>
      </button>
      \${expanded ? \`
        <div class="card-detail">
          <p><strong>Matched ingredients:</strong> \${escapeHtml((recommendation.matchedIngredients || []).join(", ") || "None")}</p>
          <p><strong>Recipe build:</strong> \${escapeHtml((recommendation.recipeIngredients || []).join(" • "))}</p>
          \${reasons ? '<ul>' + reasons + '</ul>' : ""}
          \${steps ? '<div class="ingredient-grid"><div class="ingredient-card"><h4>How to make it</h4><ul class="detail-list">' + steps + '</ul></div></div>' : ""}
          \${matchedInventory ? '<div class="ingredient-grid">' + matchedInventory + '</div>' : ""}
          \${riffOptions ? '<div class="ingredient-grid">' + riffOptions + '</div>' : ""}
          \${servingNotes ? '<div class="ingredient-grid"><div class="ingredient-card"><h4>Serving notes</h4><ul class="detail-list">' + servingNotes + '</ul></div></div>' : ""}
        </div>
      \` : ""}
    \`;

    card.querySelector('[data-toggle="cocktail"]').addEventListener("click", () => {
      state.expandedCocktail = expanded ? null : recommendation.name;
      renderCocktailRecommendations(recommendations);
    });
    recommendationsRoot.appendChild(card);
  });
}

function renderInventory(items) {
  inventoryRoot.innerHTML = "";

  if (!items.length) {
    inventoryRoot.innerHTML = '<div class="card"><p>No inventory results yet.</p></div>';
    return;
  }

  items.slice(0, 60).forEach((item) => {
    const card = document.createElement("article");
    card.className = "card";
    const name = [item.vintage, item.producer, item.label].filter(Boolean).join(" ");
    const urgencyPill = item.drinkTo ? '<span class="pill">drink by ' + escapeHtml(formatDate(item.drinkTo)) + '</span>' : '';
    card.innerHTML = \`
      <button type="button" class="card-button" data-item-id="\${escapeHtml(item.id)}">
        <div class="card-header">
          \${renderBottleVisual(item)}
          <div class="card-main">
            <h3>\${escapeHtml(name)}</h3>
            <div class="meta">
              <span class="pill">\${escapeHtml(item.category)}</span>
              <span class="pill">\${escapeHtml(item.status)}</span>
              <span class="pill">\${escapeHtml(item.location)}</span>
              \${urgencyPill}
            </div>
            \${typeof item.estimatedPriceUsd === "number" ? '<p>Estimated price: $' + item.estimatedPriceUsd.toFixed(0) + '</p>' : ""}
          </div>
          <div class="disclosure">Open</div>
        </div>
      </button>
    \`;
    card.querySelector('[data-item-id]').addEventListener("click", () => openItemDetail(item.id));
    inventoryRoot.appendChild(card);
  });
}

function renderPantryPresets() {
  const root = document.querySelector("#pantry-presets");
  if (!root) {
    return;
  }

  root.innerHTML = "";
  pantryPresets.forEach((preset) => {
    const tracked = state.pantryItems.some((item) =>
      normalize(item.label) === normalize(preset.label) &&
      normalize(item.producer) === normalize(preset.producer)
    );

    const card = document.createElement("div");
    card.className = "pantry-preset-card";
    card.innerHTML = \`
      <div class="pantry-preset-icon">\${escapeHtml(getBottleIcon(preset.category, "", ""))}</div>
      <div class="pantry-preset-copy">
        <strong>\${escapeHtml(preset.label)}</strong>
        <span>\${escapeHtml(titleCase(preset.category))} • \${escapeHtml(preset.location)}</span>
      </div>
      <button type="button" class="\${tracked ? "button-ghost" : "button-secondary"}" data-preset-id="\${escapeHtml(preset.id)}" \${tracked ? "disabled" : ""}>
        \${tracked ? "Tracked" : "I have this"}
      </button>
    \`;

    card.querySelector("[data-preset-id]")?.addEventListener("click", () => addPantryPreset(preset.id));
    root.appendChild(card);
  });
}

function renderPantryItems(items) {
  pantryRoot.innerHTML = "";

  if (!items.length) {
    pantryRoot.innerHTML = '<div class="card"><p>No tracked syrups, mixers, or bitters yet. Use the quick-add cards above when you bring something fun home.</p></div>';
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "card";
    const name = [item.producer, item.label].filter(Boolean).join(" ");
    card.innerHTML = \`
      <div class="card-header">
        \${renderBottleVisual(item)}
        <div class="card-main">
          <h3>\${escapeHtml(name)}</h3>
          <div class="meta">
            <span class="pill">\${escapeHtml(item.category)}</span>
            <span class="pill">\${escapeHtml(item.status)}</span>
            <span class="pill">\${escapeHtml(item.location)}</span>
          </div>
          \${item.notes ? '<p>' + escapeHtml(item.notes) + '</p>' : ""}
        </div>
      </div>
      <div class="pantry-mini-actions">
        <button type="button" class="button-ghost" data-open-pantry="\${escapeHtml(item.id)}">Open</button>
        <button type="button" class="button-secondary" data-finish-pantry="\${escapeHtml(item.id)}">Finished</button>
      </div>
    \`;

    card.querySelector("[data-open-pantry]")?.addEventListener("click", () => openItemDetail(item.id));
    card.querySelector("[data-finish-pantry]")?.addEventListener("click", () => markPantryItemFinished(item.id));
    pantryRoot.appendChild(card);
  });
}

async function addPantryPreset(presetId) {
  const preset = pantryPresets.find((entry) => entry.id === presetId);
  if (!preset) {
    return;
  }

  if (!state.token) {
    setStatus(pantryStatus, "Add your BartenderGPT API token first.", "error");
    return;
  }

  setStatus(pantryStatus, "Adding " + preset.label + "…");

  try {
    const response = await authedFetch("/api/v1/inventory/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: preset.category,
        producer: preset.producer,
        label: preset.label,
        quantity: 1,
        location: preset.location,
        status: "sealed",
        cocktailTags: preset.cocktailTags,
        notes: "Tracked from the mobile pantry quick-add list."
      })
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    await loadPantry(true);
    if (state.inventoryItems.length > 0) {
      await loadInventory();
    }
    setStatus(pantryStatus, preset.label + " added to your tracked pantry.", "success");
  } catch (error) {
    setStatus(pantryStatus, error.message || "Unable to add pantry item.", "error");
  }
}

async function markPantryItemFinished(itemId) {
  if (!state.token) {
    setStatus(pantryStatus, "Add your BartenderGPT API token first.", "error");
    return;
  }

  try {
    const response = await authedFetch("/api/v1/inventory/items/" + encodeURIComponent(itemId) + "/consume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: "Marked finished from pantry tracker." })
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    await loadPantry(true);
    if (state.inventoryItems.length > 0) {
      await loadInventory();
    }
    setStatus(pantryStatus, "Pantry item marked finished.", "success");
  } catch (error) {
    setStatus(pantryStatus, error.message || "Unable to update pantry item.", "error");
  }
}

async function openItemDetail(itemId) {
  setStatus(inventoryStatus, "Loading bottle details…");

  try {
    const [itemResponse, eventsResponse] = await Promise.all([
      authedFetch("/api/v1/inventory/items/" + encodeURIComponent(itemId)),
      authedFetch("/api/v1/inventory/items/" + encodeURIComponent(itemId) + "/events")
    ]);

    if (!itemResponse.ok) {
      throw new Error(await getErrorMessage(itemResponse));
    }
    if (!eventsResponse.ok) {
      throw new Error(await getErrorMessage(eventsResponse));
    }

    const itemPayload = await itemResponse.json();
    const eventsPayload = await eventsResponse.json();
    state.selectedItem = itemPayload.item;
    state.selectedItemEvents = eventsPayload.events || [];
    renderItemDetail();
    detailSheet.classList.add("visible");
    sheetBackdrop.classList.add("visible");
    document.body.classList.add("sheet-open");
    setStatus(inventoryStatus, "", "");
  } catch (error) {
    setStatus(inventoryStatus, error.message || "Unable to load that bottle.", "error");
  }
}

function closeItemDetail() {
  detailSheet.classList.remove("visible");
  sheetBackdrop.classList.remove("visible");
  document.body.classList.remove("sheet-open");
}

function renderItemDetail() {
  const item = state.selectedItem;
  if (!item) {
    detailSheetBody.innerHTML = '<p class="detail-copy">No bottle selected.</p>';
    return;
  }

  const events = state.selectedItemEvents || [];
  const acquiredEvent = events.find((event) => event.eventType === "acquired");
  const detailName = [item.vintage, item.producer, item.label].filter(Boolean).join(" ");
  const eventsMarkup = events.length
    ? events.map((event) => '<div class="timeline-entry"><strong>' + escapeHtml(titleCase(event.eventType)) + '</strong><span>' + escapeHtml(formatDate(event.createdAt)) + '</span>' + (event.notes ? '<p class="detail-copy">' + escapeHtml(event.notes) + '</p>' : '') + '</div>').join("")
    : '<p class="detail-copy">No events yet.</p>';
  const tokenMissing = !state.token;

  detailSheetBody.innerHTML = \`
    <div class="sheet-header">
      \${renderBottleVisual(item, true)}
      <div class="sheet-title">
        <h3>\${escapeHtml(detailName)}</h3>
        <div class="detail-meta">
          <span class="pill">\${escapeHtml(item.category)}</span>
          <span class="pill">\${escapeHtml(item.status)}</span>
          \${item.location ? '<span class="pill">' + escapeHtml(item.location) + '</span>' : ""}
          \${item.priceTier ? '<span class="pill">' + escapeHtml(item.priceTier) + '</span>' : ""}
        </div>
      </div>
    </div>

    <div class="detail-grid">
      <section class="detail-panel">
        <h4>At a glance</h4>
        <div class="grid-two">
          <p class="detail-copy"><strong>Added:</strong> \${escapeHtml(formatDate(acquiredEvent?.createdAt || item.createdAt))}</p>
          <p class="detail-copy"><strong>Updated:</strong> \${escapeHtml(formatDate(item.updatedAt))}</p>
          <p class="detail-copy"><strong>Drink window:</strong> \${escapeHtml(formatDrinkWindow(item))}</p>
          <p class="detail-copy"><strong>Estimated price:</strong> \${typeof item.estimatedPriceUsd === "number" ? '$' + item.estimatedPriceUsd.toFixed(0) : 'Unknown'}</p>
          \${item.region ? '<p class="detail-copy"><strong>Region:</strong> ' + escapeHtml(item.region) + '</p>' : ""}
          \${item.baseSpirit ? '<p class="detail-copy"><strong>Base spirit:</strong> ' + escapeHtml(item.baseSpirit) + '</p>' : ""}
        </div>
        \${item.notes ? '<p class="detail-copy"><strong>Notes:</strong> ' + escapeHtml(item.notes) + '</p>' : ""}
      </section>

      <section class="detail-panel">
        <h4>Edit bottle</h4>
        <form id="detail-form">
          <div class="grid-two">
            <div class="field">
              <label for="detail-producer">Producer</label>
              <input id="detail-producer" type="text" value="\${escapeAttribute(item.producer || "")}" />
            </div>
            <div class="field">
              <label for="detail-label">Label</label>
              <input id="detail-label" type="text" value="\${escapeAttribute(item.label || "")}" />
            </div>
            <div class="field">
              <label for="detail-vintage">Vintage</label>
              <input id="detail-vintage" type="number" min="1800" max="2100" value="\${item.vintage ?? ""}" />
            </div>
            <div class="field">
              <label for="detail-location">Location</label>
              <input id="detail-location" type="text" value="\${escapeAttribute(item.location || "")}" />
            </div>
            <div class="field">
              <label for="detail-bin">Bin</label>
              <input id="detail-bin" type="text" value="\${escapeAttribute(item.bin || "")}" />
            </div>
            <div class="field">
              <label for="detail-status">Status</label>
              <select id="detail-status">
                \${renderStatusOptions(item.status)}
              </select>
            </div>
            <div class="field">
              <label for="detail-drink-from">Drink from</label>
              <input id="detail-drink-from" type="date" value="\${toDateInput(item.drinkFrom)}" />
            </div>
            <div class="field">
              <label for="detail-drink-to">Drink by</label>
              <input id="detail-drink-to" type="date" value="\${toDateInput(item.drinkTo)}" />
            </div>
            <div class="field">
              <label for="detail-price">Estimated price</label>
              <input id="detail-price" type="number" min="0" step="1" value="\${item.estimatedPriceUsd ?? ""}" />
            </div>
            <div class="field">
              <label for="detail-fill">Fill %</label>
              <input id="detail-fill" type="number" min="0" max="100" step="1" value="\${item.fillPercent ?? ""}" />
            </div>
          </div>
          <div class="field">
            <label for="detail-notes">Notes</label>
            <textarea id="detail-notes">\${escapeHtml(item.notes || "")}</textarea>
          </div>
          <div class="card-actions">
            <button type="submit" class="button-primary" \${tokenMissing ? "disabled" : ""}>Save changes</button>
            <button type="button" id="consume-item" class="button-secondary" \${tokenMissing ? "disabled" : ""}>I drank this</button>
            <button type="button" id="duplicate-item" class="button-ghost" \${tokenMissing ? "disabled" : ""}>Add another bottle</button>
          </div>
          \${tokenMissing ? '<p class="fine-print">Add your API token above to edit or consume inventory.</p>' : ""}
          <div id="detail-status-message" class="status"></div>
        </form>
      </section>

      <section class="detail-panel">
        <h4>Timeline</h4>
        <div class="timeline">\${eventsMarkup}</div>
      </section>
    </div>
  \`;

  const form = document.querySelector("#detail-form");
  form?.addEventListener("submit", saveSelectedItem);
  document.querySelector("#consume-item")?.addEventListener("click", consumeSelectedItem);
  document.querySelector("#duplicate-item")?.addEventListener("click", duplicateSelectedItem);
}

async function saveSelectedItem(event) {
  event.preventDefault();
  if (!state.selectedItem) {
    return;
  }

  const statusNode = document.querySelector("#detail-status-message");
  setStatus(statusNode, "Saving changes…");

  try {
    const payload = {
      producer: valueOrUndefined("#detail-producer"),
      label: valueOrUndefined("#detail-label"),
      vintage: numberOrUndefined("#detail-vintage"),
      location: valueOrUndefined("#detail-location"),
      bin: valueOrUndefined("#detail-bin"),
      status: valueOrUndefined("#detail-status"),
      drinkFrom: dateInputToIso("#detail-drink-from"),
      drinkTo: dateInputToIso("#detail-drink-to"),
      estimatedPriceUsd: numberOrUndefined("#detail-price"),
      fillPercent: numberOrUndefined("#detail-fill"),
      notes: valueOrUndefined("#detail-notes")
    };

    const response = await authedFetch("/api/v1/inventory/items/" + encodeURIComponent(state.selectedItem.id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    const result = await response.json();
    state.selectedItem = result.item;
    await refreshSelectedItemEvents();
    renderItemDetail();
    await loadInventory();
    await loadPantry(true);
    setStatus(document.querySelector("#detail-status-message"), "Saved.", "success");
  } catch (error) {
    setStatus(document.querySelector("#detail-status-message"), error.message || "Unable to save bottle.", "error");
  }
}

async function consumeSelectedItem() {
  if (!state.selectedItem) {
    return;
  }

  try {
    const response = await authedFetch("/api/v1/inventory/items/" + encodeURIComponent(state.selectedItem.id) + "/consume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: "Marked consumed from mobile app." })
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    const result = await response.json();
    state.selectedItem = result.item;
    await refreshSelectedItemEvents();
    renderItemDetail();
    await loadInventory();
    await loadPantry(true);
    setStatus(document.querySelector("#detail-status-message"), "Bottle marked consumed.", "success");
  } catch (error) {
    setStatus(document.querySelector("#detail-status-message"), error.message || "Unable to mark bottle consumed.", "error");
  }
}

async function duplicateSelectedItem() {
  if (!state.selectedItem) {
    return;
  }

  try {
    const item = state.selectedItem;
    const response = await authedFetch("/api/v1/inventory/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: item.category,
        producer: item.producer,
        label: item.label,
        quantity: 1,
        vintage: item.vintage,
        country: item.country,
        region: item.region,
        style: item.style,
        grapeVarieties: item.grapeVarieties || [],
        baseSpirit: item.baseSpirit,
        sizeMl: item.sizeMl,
        abv: item.abv,
        location: item.location,
        bin: item.bin,
        status: "sealed",
        fillPercent: item.category === "wine" ? undefined : item.fillPercent,
        drinkFrom: item.drinkFrom,
        drinkTo: item.drinkTo,
        qualityScore: item.qualityScore,
        estimatedPriceUsd: item.estimatedPriceUsd,
        priceTier: item.priceTier,
        confidence: item.confidence,
        pairingTags: item.pairingTags || [],
        cocktailTags: item.cocktailTags || [],
        notes: item.notes,
        imageUrl: item.imageUrl
      })
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    await loadInventory();
    await loadPantry(true);
    setStatus(document.querySelector("#detail-status-message"), "Added another bottle.", "success");
  } catch (error) {
    setStatus(document.querySelector("#detail-status-message"), error.message || "Unable to add another bottle.", "error");
  }
}

async function refreshSelectedItemEvents() {
  if (!state.selectedItem) {
    return;
  }

  const eventsResponse = await authedFetch("/api/v1/inventory/items/" + encodeURIComponent(state.selectedItem.id) + "/events");
  if (eventsResponse.ok) {
    const payload = await eventsResponse.json();
    state.selectedItemEvents = payload.events || [];
  }
}

function renderBottleVisual(item, large = false) {
  const className = large ? "thumbnail" : "thumbnail";
  if (item.imageUrl) {
    return '<div class="' + className + '"><img src="' + escapeAttribute(item.imageUrl) + '" alt="' + escapeAttribute(item.label || item.displayName || item.name || "Bottle") + '" /></div>';
  }

  const fallbackClass = large ? "fallback-thumbnail" : "fallback-thumbnail";
  const displayName = item.label || item.displayName || item.name || [item.producer, item.label].filter(Boolean).join(" ") || "House bottle";
  const category = titleCase(item.category || "bottle");
  const vintage = item.vintage ? String(item.vintage) : "";
  return '<div class="' + fallbackClass + '" aria-label="' + escapeAttribute(displayName) + '">' +
    '<div class="fallback-icon" aria-hidden="true">' + escapeHtml(getBottleIcon(item.category, item.style, item.baseSpirit)) + "</div>" +
    '<div class="fallback-label">' +
      '<span class="fallback-category">' + escapeHtml(category) + "</span>" +
      '<span class="fallback-name">' + escapeHtml(displayName) + "</span>" +
      (vintage ? '<span class="fallback-vintage">' + escapeHtml(vintage) + "</span>" : "") +
    "</div>" +
  "</div>";
}

function getInitials(value) {
  const words = String(value || "")
    .split(/\\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return words.map((word) => word[0] || "").join("") || "BG";
}

function getBottleIcon(category, style, baseSpirit) {
  const normalizedCategory = String(category || "").toLowerCase();
  const normalizedStyle = String(style || "").toLowerCase();
  const normalizedSpirit = String(baseSpirit || "").toLowerCase();

  if (normalizedCategory === "wine") {
    if (normalizedStyle.includes("sparkling") || normalizedStyle.includes("champagne")) {
      return "🍾";
    }
    if (normalizedStyle.includes("rose")) {
      return "🌷";
    }
    if (normalizedStyle.includes("white") || normalizedStyle.includes("chablis") || normalizedStyle.includes("riesling")) {
      return "🥂";
    }
    return "🍷";
  }

  if (normalizedCategory === "liqueur" || normalizedCategory === "aperitif") {
    return "🍸";
  }

  if (normalizedCategory === "bitters") {
    return "💧";
  }

  if (normalizedCategory === "syrup" || normalizedCategory === "mixer") {
    return "🧃";
  }

  if (normalizedSpirit.includes("rum")) {
    return "🏝️";
  }

  if (normalizedSpirit.includes("tequila") || normalizedSpirit.includes("mezcal")) {
    return "🌵";
  }

  if (normalizedSpirit.includes("gin")) {
    return "🫒";
  }

  if (normalizedSpirit.includes("bourbon") || normalizedSpirit.includes("rye") || normalizedSpirit.includes("whiskey") || normalizedSpirit.includes("whisky")) {
    return "🥃";
  }

  return "🍶";
}

function formatDate(value) {
  if (!value) {
    return "Unknown";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function formatDrinkWindow(item) {
  if (!item.drinkFrom && !item.drinkTo) {
    return "Not set";
  }
  if (item.drinkFrom && item.drinkTo) {
    return formatDate(item.drinkFrom) + " to " + formatDate(item.drinkTo);
  }
  if (item.drinkTo) {
    return "Drink by " + formatDate(item.drinkTo);
  }
  return "Drink from " + formatDate(item.drinkFrom);
}

function toDateInput(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 10);
}

function dateInputToIso(selector) {
  const value = document.querySelector(selector)?.value?.trim();
  return value ? new Date(value + "T00:00:00.000Z").toISOString() : undefined;
}

function valueOrUndefined(selector) {
  const value = document.querySelector(selector)?.value?.trim();
  return value ? value : undefined;
}

function numberOrUndefined(selector) {
  const value = document.querySelector(selector)?.value?.trim();
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function renderStatusOptions(selected) {
  return ["sealed", "open", "low", "empty", "consumed", "missing"]
    .map((status) => '<option value="' + status + '"' + (status === selected ? " selected" : "") + ">" + titleCase(status) + "</option>")
    .join("");
}

function titleCase(value) {
  return String(value || "")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function includesAny(haystack, needles) {
  return needles.some((needle) => haystack.includes(needle));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
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
        <p class="subtitle">Start with a feeling, a dinner plan, or a spirit craving. BartenderGPT will look through your bottles, pull in a little Chicago context, and point you toward something worth opening.</p>
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
        <p class="fine-print">Read-only recommendations work without a token, but photo intake and bottle edits still need your token.</p>
      </section>

      <section class="section-grid">
        <article class="panel panel-wide concierge-panel">
          <h2>What are you feeling?</h2>
          <p>Type the way you’d text a friend: dinner plan, vibe, weather, spirit craving, or “dealer’s choice.”</p>
          <div class="context-strip">
            <span id="ambient-context-chip" class="context-pill">Checking Chicago weather…</span>
            <button id="refresh-ambient" class="button-ghost context-action" type="button">Refresh Chicago context</button>
          </div>
          <form id="concierge-form">
            <div class="prompt-shell">
              <textarea id="concierge-prompt" class="prompt-input" placeholder="We’re having roast chicken tonight and want an everyday white."></textarea>
              <button class="button-primary prompt-submit" type="submit">Ask BartenderGPT</button>
            </div>
          </form>
          <div class="prompt-templates">
            <button type="button" class="prompt-chip" data-prompt-template="It's a warm June night in Chicago and I'm in a tiki mood. Dealer's choice.">Warm tiki night</button>
            <button type="button" class="prompt-chip" data-prompt-template="It's Taco Tuesday and we want something bright and agave-driven.">Taco Tuesday agave</button>
            <button type="button" class="prompt-chip" data-prompt-template="We're having roast chicken and want an everyday wine for a casual Tuesday.">Weeknight roast chicken wine</button>
            <button type="button" class="prompt-chip" data-prompt-template="Give me a serious stirred cocktail for a quiet night in.">Quiet stirred classic</button>
          </div>
          <div id="concierge-status" class="status"></div>
        </article>

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
            <p>Tap any cocktail to see what “matched 3” actually means, how to make it, and which bottles to grab.</p>
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
        <p>Prompt-first wine and cocktail suggestions will appear here, with the detailed structured forms still available above if you want to steer more directly.</p>
        <div id="recommendations-status" class="status"></div>
        <div id="recommendations" class="recommendation-list">
          <div class="card"><p>Ask for a pairing or cocktail, and I’ll fill this section in.</p></div>
        </div>
      </section>

      <section class="panel" style="margin-top: 16px;">
        <h2>Tracked pantry</h2>
        <p>Keep an eye on the non-staples that actually change what cocktails are on the table: syrups, bitters, cherries, pineapple juice, and the fun supporting players.</p>
        <div id="pantry-presets" class="pantry-preset-grid"></div>
        <div class="button-row" style="margin-bottom: 14px;">
          <button id="load-pantry" class="button-ghost" type="button">Load pantry</button>
        </div>
        <div id="pantry-status" class="status"></div>
        <div id="pantry-results" class="inventory-list">
          <div class="card"><p>Tracked pantry items will show up here once loaded.</p></div>
        </div>
      </section>

      <section class="panel" style="margin-top: 16px;">
        <h2>Inventory snapshot</h2>
        <p>Tap a bottle to see details, edit it, mark it consumed, or add another bottle.</p>
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

    <div id="sheet-backdrop" class="sheet-backdrop"></div>
    <aside id="detail-sheet" class="sheet" aria-hidden="true">
      <div class="sheet-handle"></div>
      <div class="button-row" style="justify-content: flex-end;">
        <button id="sheet-close" class="sheet-close button-ghost" type="button">Close</button>
      </div>
      <div id="detail-sheet-body"></div>
    </aside>

    <script>${mobileScript}</script>
  </body>
</html>`;
}

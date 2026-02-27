import { setPromptFormat, applyPreset, buildFlatPrompt, buildStructuredPrompt, buildMidjourneyPrompt, buildJson } from './template_manager.js';
import { applyConflictRules } from './style_manager.js';
import { copyPrompt, copyJson, savePrompt, enhancePrompt } from './export_import.js';
import { resetAll } from './history_manager.js';
import { bindEvents, initCollapsible } from './event_handlers.js';


// =============================================
// CONFIG
// =============================================
const groupConfig = {
  aiModel: { mode: "single" },
  cameraBody: { mode: "single" },
  aspectRatio: { mode: "single" },
  resolution: { mode: "single" },
  purpose: { mode: "single" },
  format: { mode: "single" },
  medium: { mode: "single" },
  lens: { mode: "single" },
  focalLength: { mode: "single" },
  shotSize: { mode: "single" },
  aperture: { mode: "single" },
  angle: { mode: "single" },
  composition: { mode: "single" },
  quality: { mode: "single" },
  mjVersion: { mode: "single" },
  mjStyle: { mode: "single" },
  fluxModel: { mode: "single" },
  dalleStyle: { mode: "single" },
  dalleQuality: { mode: "single" },
  referenceType: { mode: "single" },
  photoStyle: { mode: "single" },
  cinemaStyle: { mode: "single" },
  directorStyle: { mode: "single" },
  artStyle: { mode: "single" },
  colorPalette: { mode: "single" },
  mood: { mode: "single" },
  lightType: { mode: "primaryAccent" },
  timeOfDay: { mode: "primaryAccent" },
  lightFX: { mode: "multi" },
  skinDetail: { mode: "multi" },
  hairDetail: { mode: "multi" },
  material: { mode: "multi" },
  typography: { mode: "multi" },
  quickStyle: { mode: "single" },
  fashionFoodStyle: { mode: "single" },
  emotion: { mode: "single" }
};

const MAX_CONSISTENCY_PREFIX = `FACE ID LOCKED from reference. Exact facial match required - all features preserved.
"CONSISTENCY PROTOCOL": "100% facial feature".
"preservation from reference image".
"FACE LOCKED": "NON-NEGOTIABLE"
"FACE CONSISTENCY": "100% - All facial features must remain IDENTICAL to locked reference CHARACTER INTEGRITY: Maintain key features across all variations ZERO DEVIATION from specified eye color, hair color, face structure, unique identifiers
"Keep the facial features of the person in the uploaded image exactly consistent. Do not modify their identity. Maintain 70% identical bone structure, skin tone, and facial imperfections (moles, scars)."
`;



const FILM_STOCKS = {
  "Kodak Vision3 500T": "shot on Kodak Vision3 500T 5219 film stock, visible film grain, red halation around highlights, tungsten color balance, cinematic texture, deep shadows",
  "Kodak Vision3 250D": "shot on Kodak Vision3 250D 5207 film stock, fine grain structure, true-to-life colors, rich daylight saturation, organic skin tones",
  "Kodak Vision3 50D": "shot on Kodak Vision3 50D film stock, virtually grain-free, hyper-vivid colors, extreme detail retention, pristine film quality",
  "Fujifilm Eterna 500T": "shot on Fujifilm Eterna 500T, low contrast, soft pastel color palette, cinematic greenish shadows, smooth tonal transitions",
  "Kodak Tri-X 400": "shot on Kodak Tri-X 400 Black and White film, heavy contrast, gritty film grain, noir aesthetic, monochromatic",
  "Kodachrome 64": "shot on vintage Kodachrome 64, nostalgic warm colors, deeply saturated reds and yellows, 1970s magazine look",
  "ARRI Alexa 35 Sensor": "shot on ARRI Alexa 35, REVEAL Color Science, extreme dynamic range, creamy highlight roll-off, noise-free shadows",
  "RED V-Raptor / Monstro": "shot on RED V-Raptor 8K VV, hyper-realistic detail, razor sharp, deep crushed blacks, digital precision",
  "Sony Venice 2": "shot on Sony Venice 2, exceptional low light performance, clean vibrant colors, modern full-frame aesthetic",
  "VHS / MiniDV": "shot on VHS camcorder, 1990s home video style, tracking errors, chromatic aberration, low resolution, scanlines"
};

// =============================================
// UTILS
// =============================================
export const $ = id => document.getElementById(id);
export const esc = s => (s ?? "").toString().replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m]);

export function notify(msg, type = "success") {
  const n = $("notification");
  n.textContent = msg;
  n.className = "notification " + type;
  n.classList.add("show");
  clearTimeout(n._t);
  n._t = setTimeout(() => n.classList.remove("show"), 2500);
}

export function wordCount(t) { const s = (t || "").trim(); return s ? s.split(/\s+/).length : 0; }
export function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

// =============================================
// INIT
// =============================================
document.addEventListener("DOMContentLoaded", function () {
  // Local fallback for css2 when opened directly from disk.
  var css2 = document.getElementById("css2LocalLink");
  if (css2 && window.location.protocol === "file:") {
    css2.href = "file:///C:/Users/TOT/Documents/Grav4/VideoPrompt/css2";
  }
  initPresets();
  bindEvents();
  setPromptFormat(state.promptFormat);
  updateAll();
});

function initPresets() {
  const g = $("presetGrid");
  g.innerHTML = "";
  presets.forEach((p, i) => {
    const b = document.createElement("button");
    b.className = "option-btn";
    b.style.borderColor = "var(--green)";
    b.style.borderWidth = "2px";
    b.dataset.presetIndex = String(i);
    b.textContent = p.name;
    b.addEventListener("click", () => applyPreset(i));
    g.appendChild(b);
  });
}



export function handleInput() { updateAll(); }

// =============================================
// TRANSLATE SCENE — via backend /api/translate
// =============================================
async function translateScene() {
  var textarea = $("mainSubject");
  var text = textarea.value.trim();
  var status = $("translateStatus");
  var btn = $("translateBtn");

  if (!text) { notify("Поле пустое", "warn"); return; }

  // Detect if already English
  var nonAscii = text.replace(/[a-zA-Z0-9\s.,!?;:\'"()\-\/\\@#$%^&*=+\[\]{}|<>~`]/g, "");
  if (nonAscii.length < text.length * 0.15) {
    notify("Текст уже на английском", "warn");
    return;
  }

  btn.disabled = true;
  status.textContent = "Переводим...";
  status.style.color = "var(--accent-light)";

  try {
    var response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text, to: "en" })
    });
    var data = await response.json();
    if (!response.ok) {
      throw new Error(data && data.error ? data.error : "HTTP " + response.status);
    }

    var translated = data && data.text ? String(data.text) : "";
    if (!translated) throw new Error("Пустой ответ перевода");

    if (translated === translated.toUpperCase() && translated.length > 20) {
      translated = translated.charAt(0).toUpperCase() + translated.slice(1).toLowerCase();
    }
    textarea.value = translated;
    state.mainSubject = translated;
    status.textContent = "✅ Переведено";
    status.style.color = "var(--green)";
    updateAll();
    notify("Текст переведён на английский");
  } catch (e) {
    status.textContent = "❌ Ошибка";
    status.style.color = "var(--red, #ff7675)";
    notify("Ошибка перевода: " + e.message, "err");
  } finally {
    btn.disabled = false;
    setTimeout(function () { status.textContent = ""; }, 4000);
  }
}

// =============================================
// SELECTION LOGIC
// =============================================
export function handleSelect(group, value) {
  const mode = (groupConfig[group] && groupConfig[group].mode) || "single";

  // FIX: Any manual selection clears preset-active flag
  if (state.isStandardPresetActive && group !== "resolution") {
    state.isStandardPresetActive = false;
  }

  if (mode === "single") {
    // Toggle off if clicking same value
    if (state[group] === value) state[group] = "";
    else state[group] = value;

    document.querySelectorAll(`[data-group="${group}"]`).forEach(b => {
      b.classList.toggle("active", b.dataset.value === state[group]);
      b.querySelectorAll(".slot-tag").forEach(t => t.remove());
    });

    if (group === "aspectRatio") {
      state.resolution = "";
      rebuildResolution();
    }
    if (group === "aiModel") {
      updateModelHint();
    }
    // FIX: Quick Style visual reset
    if (group === "quickStyle" && state[group]) {
      // Clear competing styles visually and in state
      state.photoStyle = ""; state.cinemaStyle = ""; state.directorStyle = "";
      state.fashionFoodStyle = ""; // Clear Fashion Food
      syncGroup("photoStyle"); syncGroup("cinemaStyle"); syncGroup("directorStyle");
      syncGroup("fashionFoodStyle");
      // Also ensure expanded sections correct for Quick Style
      if (window.expandSectionsForQuickStyle) window.expandSectionsForQuickStyle(true);
    }

    // FIX: Fashion Food Style visual reset
    if (group === "fashionFoodStyle" && state[group]) {
      state.quickStyle = "";
      syncGroup("quickStyle");
      // Clear other styles that are blanket disabled
      ["photoStyle", "cinemaStyle", "directorStyle", "artStyle", "filmStock", "referenceType"].forEach(k => {
        state[k] = "";
        syncGroup(k);
      });
    }
  }

  if (mode === "multi") {
    if (!Array.isArray(state[group])) state[group] = [];
    const arr = state[group];
    const idx = arr.indexOf(value);
    if (idx >= 0) arr.splice(idx, 1); else arr.push(value);

    document.querySelectorAll(`[data-group="${group}"]`).forEach(b => {
      b.classList.toggle("active", arr.includes(b.dataset.value));
    });
  }

  if (mode === "primaryAccent") {
    togglePA(group, value);
  }

  updateAll();
}

function togglePA(group, value) {
  const cur = state[group] || { primary: "", accent: "" };

  if (cur.primary === value) { cur.primary = ""; }
  else if (cur.accent === value) { cur.accent = ""; }
  else if (!cur.primary) { cur.primary = value; }
  else if (!cur.accent) { cur.accent = value; }
  else { cur.accent = value; }

  state[group] = cur;
  syncPAUI(group);
}

function syncPAUI(group) {
  const cur = state[group] || { primary: "", accent: "" };
  document.querySelectorAll(`[data-group="${group}"]`).forEach(b => {
    const v = b.dataset.value;
    b.classList.toggle("active", v === cur.primary || v === cur.accent);
    b.querySelectorAll(".slot-tag").forEach(t => t.remove());

    if (v === cur.primary) {
      const t = document.createElement("span");
      t.className = "slot-tag primary"; t.textContent = "P";
      b.appendChild(t);
    }
    if (v === cur.accent) {
      const t = document.createElement("span");
      t.className = "slot-tag accent"; t.textContent = "A";
      b.appendChild(t);
    }
  });
}

export function syncGroup(group) {
  const mode = groupConfig[group] && groupConfig[group].mode;
  if (mode === "single") {
    document.querySelectorAll(`[data-group="${group}"]`).forEach(b => {
      b.classList.toggle("active", b.dataset.value === state[group]);
      b.querySelectorAll(".slot-tag").forEach(t => t.remove());
    });
  }
  if (mode === "multi") {
    const arr = state[group] || [];
    document.querySelectorAll(`[data-group="${group}"]`).forEach(b => {
      b.classList.toggle("active", arr.includes(b.dataset.value));
    });
  }
  if (mode === "primaryAccent") syncPAUI(group);
}

// =============================================
// RESOLUTION
// =============================================
export function rebuildResolution() {
  const ar = state.aspectRatio;
  const info = $("resolutionInfo");
  const opts = $("resolutionOptions");
  opts.innerHTML = "";

  if (!ar || !resolutionMap[ar]) {
    info.style.display = "block";
    opts.style.display = "none";
    return;
  }
  info.style.display = "none";
  opts.style.display = "grid";

  resolutionMap[ar].forEach(r => {
    const b = document.createElement("button");
    b.className = "option-btn";
    b.dataset.group = "resolution";
    b.dataset.value = r.value;
    b.textContent = r.label;
    if (state.resolution === r.value) b.classList.add("active");
    opts.appendChild(b);
  });
}

// =============================================
// MODEL HINTS
// =============================================
export function updateModelHint() {
  const h = $("modelHint");
  if (state.aiModel && modelTips[state.aiModel]) {
    h.textContent = modelTips[state.aiModel];
    h.style.display = "block";
  } else {
    h.style.display = "none";
  }
}

function updateRefUI() {
  const isMJ = state.aiModel === "midjourney";
  const sec = $("referencesSection");
  const input = $("referenceImages");

  // Midjourney mode: disable reference upload entirely
  if (isMJ) {
    if (sec) sec.classList.add("disabled-section");
    if (input) {
      input.value = "";
      input.disabled = true;
    }
    state.referenceImages = [];
    $("imagePreviewContainer").style.display = "none";
    $("referenceOptions").style.display = "none";
    $("referenceWeight").style.display = "none";
    $("refUploadHint").innerHTML = "Загрузка референсных изображений отключена для <b>Midjourney</b> в этой версии билдера.";
    return;
  }

  // Non-MJ engines: enable references
  if (sec) sec.classList.remove("disabled-section");
  if (input) input.disabled = false;

  $("refUploadHint").textContent = "До 13 изображений. Опишите, что взять из каждого.";
  $("referenceImages").setAttribute("multiple", "");

  const hasRefs = state.referenceImages.length > 0;
  if (!hasRefs) {
    $("imagePreviewContainer").style.display = "none";
    $("referenceOptions").style.display = "none";
    $("referenceWeight").style.display = "none";
    return;
  }

  $("imagePreviewContainer").style.display = "block";
  $("referenceOptions").style.display = "block";
  // Weight slider: useful for SD and Flux (IP-Adapter). Not useful for chatgpt/nano/dall-e/ideogram/etc.
  const needsWeight = ["stable-diffusion", "flux"].includes(state.aiModel);
  $("referenceWeight").style.display = needsWeight ? "block" : "none";
}

function updateGenParamsUI() {
  const m = state.aiModel;
  $("mjGenParams").style.display = m === "midjourney" ? "block" : "none";
  $("sdGenParams").style.display = m === "stable-diffusion" ? "block" : "none";
  $("fluxGenParams").style.display = m === "flux" ? "block" : "none";
  $("dalleGenParams").style.display = m === "dall-e-3" ? "block" : "none";
  $("noGenParams").style.display = ["midjourney", "stable-diffusion", "flux", "dall-e-3", ""].includes(m) ? "none" : "block";
}

// =============================================
// COMPACT PROMPT — strip to essential core
// =============================================
export function compactPrompt() {
  const outBox = $("promptOutput");
  let text = outBox.textContent || "";
  if (!text.trim() || text.includes("Select parameters") || text.includes("Выберите")) {
    notify("Промпт пуст", "warn"); return;
  }

  // Remove quality spam keywords
  const qualitySpam = [
    "8k", "4k", "2k", "masterpiece", "best quality", "ultra detailed",
    "high quality", "detailed", "highly detailed", "professional",
    "award-winning", "amazing", "beautiful", "stunning"
  ];
  let parts = text.split(", ");
  parts = parts.filter(p => {
    const low = p.trim().toLowerCase();
    return !qualitySpam.some(q => low === q || low === q + ",");
  });

  // Remove duplicate semantic concepts
  const seen = new Set();
  parts = parts.filter(p => {
    const key = p.trim().toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Strip appended reference/negative sections
  let cleaned = parts.join(", ");
  cleaned = cleaned.replace(/\n\n--- Reference images ---[\s\S]*$/, "");
  cleaned = cleaned.replace(/\nNegative prompt:[\s\S]*$/, "");
  cleaned = cleaned.replace(/,\s*,/g, ",").replace(/,\s*$/, "").trim();

  outBox.textContent = cleaned;
  $("charCount").textContent = String(cleaned.length);
  $("wordCount").textContent = String(cleaned.split(/\s+/).filter(Boolean).length);
  notify("⚡ Промпт оптимизирован — убраны избыточные слова");
}

// =============================================
// REFERENCES
// =============================================
export function handleImageUpload(event) {
  const MAX_REFERENCE_IMAGES = 13;
  const allFiles = Array.from(event.target.files || []);
  const files = allFiles.slice(0, MAX_REFERENCE_IMAGES);
  if (!files.length) return;
  if (allFiles.length > MAX_REFERENCE_IMAGES) {
    notify(`Можно загрузить максимум ${MAX_REFERENCE_IMAGES} изображений. Лишние файлы проигнорированы.`, "warn");
  }

  // Disabled for Midjourney in this build
  if (state.aiModel === "midjourney") {
    event.target.value = "";
    notify("Референсные изображения отключены для Midjourney", "warn");
    return;
  }

  state.referenceImages = [];
  const previews = $("imagePreviews");
  previews.innerHTML = "";

  files.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgData = { name: file.name, data: e.target.result, size: (file.size / 1024).toFixed(1) + " KB", description: "", width: 0, height: 0 };

      // Capture actual image dimensions
      const tempImg = new Image();
      tempImg.onload = () => {
        imgData.width = tempImg.naturalWidth;
        imgData.height = tempImg.naturalHeight;
      };
      tempImg.onerror = () => {
        console.warn(`Failed to load image dimensions for ${file.name}`);
      };
      tempImg.src = e.target.result;

      state.referenceImages.push(imgData);

      const card = document.createElement("div");
      card.className = "image-preview-card";
      imgData.extract = [];
      card.innerHTML = `
            <button class="image-remove-btn" data-remove-index="${index}">×</button>
            <div><img src="${e.target.result}" alt="${esc(file.name)}"></div>
            <div class="image-preview-details">
              <div class="image-preview-info">
                <div style="font-weight:800;color:var(--accent-light);margin-bottom:3px;">Изображение ${index + 1}</div>
                <div>${esc(file.name)} · ${esc(imgData.size)}</div>
              </div>
              <div class="ref-extract-row">
                ${REF_EXTRACT_OPTIONS.map((opt, oi) => `<label class="ref-extract-label"><input type="checkbox" data-ext-img="${index}" data-ext-opt="${oi}"> ${opt}</label>`).join("")}
              </div>
              <textarea class="image-description-input" data-desc-index="${index}" placeholder="Доп. описание: что именно взять..."></textarea>
            </div>`;
      // Wire extract checkboxes
      card.querySelectorAll('[data-ext-img]').forEach(cb => {
        cb.addEventListener('change', function () {
          const ii = parseInt(this.dataset.extImg, 10), oo = parseInt(this.dataset.extOpt, 10), opt = REF_EXTRACT_OPTIONS[oo];
          if (!state.referenceImages[ii]) return;
          if (!state.referenceImages[ii].extract) state.referenceImages[ii].extract = [];
          const ex = state.referenceImages[ii].extract;
          this.closest(".ref-extract-label").classList.toggle("ext-checked", this.checked);
          if (this.checked) { if (!ex.includes(opt)) ex.push(opt) } else { const i = ex.indexOf(opt); if (i >= 0) ex.splice(i, 1) }
          updateAll();
        });
      });
      previews.appendChild(card);

      card.querySelector(`[data-remove-index="${index}"]`).addEventListener("click", () => removeImage(index));
      card.querySelector(`[data-desc-index="${index}"]`).addEventListener("input", (ev) => {
        const i = parseInt(ev.target.dataset.descIndex, 10);
        if (state.referenceImages[i]) state.referenceImages[i].description = ev.target.value;
        updateAll();
      });

      $("imagePreviewContainer").style.display = "block";
      // Show reference controls for supported engines
      $("referenceOptions").style.display = "block";
      $("referenceWeight").style.display = ["stable-diffusion", "flux"].includes(state.aiModel) ? "block" : "none";
      updateAll();
    };
    reader.onerror = () => {
      notify(`Ошибка чтения файла ${file.name}`, "err");
    };
    reader.readAsDataURL(file);
  });
  notify(`Загружено ${files.length} файл(ов)`);
}

export function removeImage(index) {
  state.referenceImages.splice(index, 1);
  if (!state.referenceImages.length) {
    $("imagePreviewContainer").style.display = "none";
    $("referenceOptions").style.display = "none";
    $("referenceWeight").style.display = "none";
    $("referenceImages").value = "";
    updateAll();
    return;
  }
  rebuildImageCards();
  updateAll();
}

export function rebuildImageCards() {
  const previews = $("imagePreviews");
  previews.innerHTML = "";
  state.referenceImages.forEach((img, idx) => {
    const card = document.createElement("div");
    card.className = "image-preview-card";
    const extractChecks = REF_EXTRACT_OPTIONS.map((opt, oi) => {
      const checked = (img.extract || []).includes(opt) ? "checked" : "";
      return `<label class="ref-extract-label"><input type="checkbox" data-ext-img="${idx}" data-ext-opt="${oi}" ${checked}> ${opt}</label>`;
    }).join("");
    card.innerHTML = `
          <button class="image-remove-btn" data-remove-index="${idx}">×</button>
          <div><img src="${img.data}" alt="${esc(img.name)}"></div>
          <div class="image-preview-details">
            <div class="image-preview-info">
              <div style="font-weight:800;color:var(--accent-light);margin-bottom:3px;">Изображение ${idx + 1}</div>
              <div>${esc(img.name)} · ${esc(img.size)}</div>
            </div>
            <div class="ref-extract-row">${extractChecks}</div>
            <textarea class="image-description-input" data-desc-index="${idx}" placeholder="Что взять: палитру, позу, стиль, текстуру...">${esc(img.description || "")}</textarea>
          </div>`;
    previews.appendChild(card);
    // Wire extract checkboxes
    card.querySelectorAll('[data-ext-img]').forEach(cb => {
      cb.addEventListener('change', function () {
        const ii = parseInt(this.dataset.extImg, 10), oo = parseInt(this.dataset.extOpt, 10), opt = REF_EXTRACT_OPTIONS[oo];
        if (!state.referenceImages[ii]) return;
        if (!state.referenceImages[ii].extract) state.referenceImages[ii].extract = [];
        const ex = state.referenceImages[ii].extract;
        if (this.checked) { if (!ex.includes(opt)) ex.push(opt) } else { const i = ex.indexOf(opt); if (i >= 0) ex.splice(i, 1) }
        updateAll();
      });
    });
    card.querySelector(`[data-remove-index="${idx}"]`).addEventListener("click", () => removeImage(idx));
    card.querySelector(`[data-desc-index="${idx}"]`).addEventListener("input", (ev) => {
      const i = parseInt(ev.target.dataset.descIndex, 10);
      if (state.referenceImages[i]) state.referenceImages[i].description = ev.target.value;
      updateAll();
    });
  });
}

// =============================================
// NEGATIVES
// =============================================
export function addNegative(text) {
  const f = $("negativePrompt");
  const cur = (f.value || "").trim();
  // Avoid duplicates
  const existing = cur.split(",").map(s => s.trim().toLowerCase());
  const newParts = text.split(",").map(s => s.trim()).filter(s => !existing.includes(s.toLowerCase()));
  if (!newParts.length) { notify("Уже добавлено", "warn"); return; }
  f.value = cur ? (cur + ", " + newParts.join(", ")) : newParts.join(", ");
  state.negativePrompt = f.value;
  updateAll();
}

// =============================================
// PROMPT FORMAT
// =============================================



// ChatGPT Image: style descriptions without author names (content policy)
var CHATGPT_STYLE_MAP = {
  "in the style of Annie Leibovitz, dramatic portrait lighting, rich colors": "dramatic editorial portrait, rich warm saturated colors, deep shadows with golden highlights, intimate cinematic composition",
  "in the style of Peter Lindbergh, black and white, raw beauty, minimal retouching": "raw black-and-white portrait, unretouched natural beauty, high contrast silver gelatin aesthetic, emotional authenticity",
  "in the style of Steve McCurry, vivid saturated colors, documentary": "vivid hypersaturated documentary photograph, intense eye contact, Kodachrome warmth, National Geographic composition",
  "in the style of Helmut Newton, high contrast, provocative glamour, black and white": "high contrast glamour noir, provocative fashion pose, hard directional light, bold black-and-white with deep blacks",
  "in the style of Mario Testino, warm golden tones, glossy fashion": "warm golden fashion tones, sun-kisses glossy skin, aspirational luxury aesthetic, bright editorial warmth",
  "in the style of Tim Walker, surreal, fantastical, pastel dreamlike": "surreal fantastical set design, pastel dreamlike palette, whimsical oversized props, fairy-tale fashion fantasy",
  "in the style of Ansel Adams, high dynamic range landscape, deep blacks, zone system": "extreme tonal range landscape, pure black to bright white, zone-system exposure, majestic wilderness clarity",
  "in the style of Richard Avedon, stark white background, high contrast portrait": "stark pure white background, high contrast minimalist portrait, sharp focus on facial character, fashion-documentary hybrid",
  "in the style of Guy Bourdin, bold saturated colors, surreal fashion, strong shadows": "bold saturated pop colors, surreal fashion narrative, hard geometric shadows, provocative avant-garde composition",
  "in the style of Gregory Crewdson, cinematic suburban, eerie twilight, elaborate staged": "cinematic suburban tableau, eerie twilight atmosphere, elaborate staged scene, uncanny everyday mystery",
  "cinematography by Roger Deakins, naturalistic light, precise framing, atmospheric": "naturalistic motivated lighting, precise geometric framing, atmospheric haze, restrained palette with emotional depth",
  "cinematography by Emmanuel Lubezki, long takes, natural light, immersive": "pure natural light, immersive wide-angle perspective, ethereal luminosity, spiritual fluid movement feel",
  "cinematography by Hoyte van Hoytema, IMAX, desaturated palette, epic scale": "IMAX large-format clarity, desaturated cool palette, epic monumental scale, tactile film grain texture",
  "cinematography by Robert Richardson, high contrast, bold color, dynamic lighting": "aggressive high-contrast lighting, bold expressive color, dramatic rim lights, kinetic visual energy",
  "cinematography by Bradford Young, low-key lighting, rich shadows, warm undertones": "low-key intimate lighting, rich layered shadows, warm amber undertones, textured underexposed beauty",
  "cinematography by Janusz Kaminski, overexposed highlights, bleach bypass": "overexposed blown highlights, bleach bypass silver tones, diffused backlight halos, raw documentary feel",
  "cinematography by Vittorio Storaro, painterly light, rich color symbolism": "painterly Renaissance lighting, rich symbolic color storytelling, warm-to-cool emotional transitions, operatic grandeur",
  "cinematography by Greig Fraser, anamorphic, moody atmosphere, teal and orange": "anamorphic lens distortion, moody atmospheric haze, teal-and-orange grade, modern epic texture",
  "cinematography by Linus Sandgren, warm nostalgic tones, golden light, film grain": "warm nostalgic golden tones, classic Hollywood glamour, visible film grain, romantic soft focus",
  "cinematography by Ari Wegner, textured natural light, intimate framing, muted palette": "textured available-light naturalism, intimate observational framing, muted period-authentic palette",
  "directed by Denis Villeneuve, vast scale, muted desaturated palette, atmospheric silence, epic compositions": "vast monumental scale, muted desaturated palette, atmospheric silence and negative space, geometric epic compositions",
  "directed by Wes Anderson, symmetrical framing, pastel color palette, whimsical miniature aesthetic": "obsessively symmetrical framing, curated pastel palette, whimsical dollhouse aesthetic, centered compositions",
  "directed by Christopher Nolan, IMAX large format, desaturated blue tones, practical effects, epic scope": "IMAX large-format grandeur, desaturated cool blue tones, grounded practical realism, epic cerebral scope",
  "directed by David Fincher, dark muted palette, precise framing, cold blue-green tones, clinical aesthetic": "dark muted palette, mathematically precise framing, cold blue-green undertones, clinical sterile aesthetic",
  "directed by Ridley Scott, atmospheric haze, painterly compositions, epic historical grandeur": "atmospheric haze and smoke, painterly Renaissance compositions, epic historical grandeur, chiaroscuro depth",
  "directed by Quentin Tarantino, bold saturated colors, dynamic angles, retro grindhouse aesthetic": "bold oversaturated retro colors, dynamic low-angle shots, vintage grindhouse grain, pop-culture pastiche",
  "directed by Greta Gerwig, warm natural light, soft pastels, intimate handheld framing, nostalgic warmth": "warm natural window light, soft nostalgic pastels, intimate handheld framing, gentle feminine warmth",
  "directed by Jordan Peele, unsettling suburban beauty, vivid colors, horror tension, surreal undertones": "unsettling suburban uncanny beauty, vivid hyper-real colors, creeping horror tension, surreal social undertones",
  "directed by Bong Joon-ho, social contrast, sharp compositions, dark humor, class division visual metaphor": "sharp architectural compositions, visual class-division metaphors, dark satirical tone, spatial contrast storytelling",
  "directed by Chloe Zhao, golden hour landscapes, natural light, documentary intimacy, vast American West": "golden hour vast landscape, purely natural light, documentary intimate realism, poetic frontier beauty"
};
// =============================================
// BUILD PROMPT — FLAT (universal, recommended)
// =============================================







/* ===== SCRIPT TAG SPLIT ===== */


// === COLLAPSIBLE LOGIC v3 (Strict + Quick Style Support) ===
(function () {
  const SECTION_MAP = {
    "aiModel": "aiModelSection",
    "cameraBody": "cameraSectionV2",
    "lens": "lensSectionV2",
    "focalLength": "apertureSection",
    "shotSize": "apertureSection",
    "medium": "artStyleSectionV2",
    "aperture": "apertureSection",
    "angle": "apertureSection",
    "composition": "compositionSectionV2",
    "filmStock": "filmStockSection",
    "lighting": "lightingSectionV2",
    "timeOfDay": "lightingSectionV2",
    "lightFX": "lightingSectionV2",
    "colorPalette": "paletteSectionV2",
    "mood": "moodSectionV2",
    "skinDetail": "skinDetailSection",
    "hairDetail": "hairDetailSection",
    "material": "materialSection",
    "typography": "typographySection",
    "photoStyle": "photoStyleSection",
    "cinemaStyle": "cinemaStyleSection",
    "directorStyle": "directorStyleSection",
    "format": "formatSection",
    "purpose": "purposeSection",
    "referenceImages": "referencesSection",
    "negativePrompt": "negativeSection",
    "emotion": "emotionSection",
    "ambience": "audioSectionV2",
    "foley": "audioSectionV2",
    "cinematicFx": "audioSectionV2",
    "artStyle": "artStyleSectionV2"
  };

  function toggleSection(header, forceState = null) {
    const section = header.parentElement;
    if (!section) return;

    if (forceState !== null) {
      if (forceState === true) section.classList.remove('collapsed'); // Open
      else section.classList.add('collapsed'); // Close
    } else {
      section.classList.toggle('collapsed');
    }
  }

  function initCollapsible() {
    const sections = document.querySelectorAll('.section');

    // STRICT INITIAL STATE: 
    // Open: Quick Presets, Presets. 
    // Closed: Everything else.

    sections.forEach(sec => {
      const header = sec.querySelector('.section-header');
      if (!header) return;

      // Bind click robustly even if HTML already contains data-bound="true".
      // Some saved HTML snapshots persist this attribute and otherwise block binding.
      if (header.__vpeCollapseHandler) {
        header.removeEventListener('click', header.__vpeCollapseHandler);
      }
      header.__vpeCollapseHandler = (e) => {
        if (e.target.closest('.help-tip') || e.target.closest('.mode-badge') || e.target.closest('input') || e.target.closest('button')) return;
        toggleSection(header);
      };
      header.addEventListener('click', header.__vpeCollapseHandler);
      header.dataset.bound = "true";

      // Initial State
      // FIX: Removed jsonSection from default open list
      if (sec.id === 'quickStyleSection' || sec.id === 'presetsSection' || sec.id === 'generationModeSection' || sec.id === 'promptSection') {
        sec.classList.remove('collapsed');
      } else {
        sec.classList.add('collapsed');
      }
    });
    console.log('VPE: Strict collapsible state applied.');
  }

  // Expose: Expand related sections for PRESETS
  window.expandRelatedSections = function (presetValues) {
    // 1. Collapse all param sections (keep nav sections open)
    document.querySelectorAll('.section').forEach(sec => {
      if (sec.id === 'quickStyleSection' || sec.id === 'presetsSection' || sec.id === 'generationModeSection') return;
      sec.classList.add('collapsed');
    });

    // 2. Open Related
    const keys = Object.keys(presetValues);

    // Always open Core
    document.getElementById('aiModelSection')?.classList.remove('collapsed');
    document.getElementById('descriptionSection')?.classList.remove('collapsed');

    keys.forEach(k => {
      if (SECTION_MAP[k]) {
        const el = document.getElementById(SECTION_MAP[k]);
        if (el && presetValues[k]) el.classList.remove('collapsed');
      }
      // LightType special
      if (k === 'lightType' && (presetValues[k].primary || presetValues[k].accent)) {
        document.getElementById('lightingSection')?.classList.remove('collapsed');
      }
    });
  };

  // Expose: Expand for QUICK STYLE
  window.expandSectionsForQuickStyle = function (isActive) {
    if (!isActive) return; // If unselected, do nothing or user preference? Let's leave as is.

    // When Quick Style is Active:
    // Open: Quick Style, AI Model, Aspect Ratio, Resolution, Generation Mode.
    // Close: All artistic controls (Camera, Lighting, Styles, etc) as they are disabled/locked.

    const keepOpen = [
      'quickStyleSection',
      'aiModelSection',
      'aspectRatioSection',
      'descriptionSection',
      'generationModeSection',
      'promptSection',
      'jsonSection'
    ];

    document.querySelectorAll('.section').forEach(sec => {
      if (keepOpen.includes(sec.id)) {
        sec.classList.remove('collapsed');
      } else {
        sec.classList.add('collapsed');
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCollapsible);
  } else {
    initCollapsible();
  }
  window.resetAll = resetAll; // Expose for verification
  window.buildStructuredPrompt = buildStructuredPrompt; // Expose for verification

})();


/* ===== SCRIPT TAG SPLIT ===== */


(() => {
  if (window.__docSyncV1) return;
  window.__docSyncV1 = true;

/* ===== SCRIPT TAG SPLIT ===== */



// Export to window for prompt_engine.js
window.buildFlatPrompt = typeof buildFlatPrompt !== "undefined" ? buildFlatPrompt : null;
window.buildStructuredPrompt = typeof buildStructuredPrompt !== "undefined" ? buildStructuredPrompt : null;
window.buildMidjourneyPrompt = typeof buildMidjourneyPrompt !== "undefined" ? buildMidjourneyPrompt : null;
window.buildJson = typeof buildJson !== "undefined" ? buildJson : null;
window.buildG4FlatForNBP = typeof buildG4FlatForNBP !== "undefined" ? buildG4FlatForNBP : null;
window.buildG4ForNBP = typeof buildG4ForNBP !== "undefined" ? buildG4ForNBP : null;


// Expose for external inline or other scripts
window.state = state;
window.$ = $;
window.updateAll = updateAll;
window.buildFlatPrompt = buildFlatPrompt;
window.buildStructuredPrompt = buildStructuredPrompt;
window.buildMidjourneyPrompt = buildMidjourneyPrompt;
window.buildJson = buildJson;

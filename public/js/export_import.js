import { state, $, notify } from './client_logic.js';
import { buildJson, buildFlatPrompt } from './template_manager.js';

export function safeCopy(text, label, btn) {
  const originalText = btn ? btn.innerHTML : "";
  const success = () => {
    notify(label + " скопирован");
    if (btn) {
      btn.innerHTML = "✅ Скопировано!";
      setTimeout(() => btn.innerHTML = originalText, 2000);
    }
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(success).catch(function () {
      fallbackCopy(text, label, btn, success);
    });
  } else {
    fallbackCopy(text, label, btn, success);
  }
}

// FIX: Robust fallback copy
function fallbackCopy(text, label, btn, onSuccess) {
  var ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  ta.style.top = "0"; // avoid scrolling to bottom
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand("copy");
    if (onSuccess) onSuccess();
    else notify(label + " скопирован");
  } catch (e) {
    notify("Ошибка копирования", "err");
  }
  document.body.removeChild(ta);
}
export function copyPrompt() {
  var text = $("promptOutput").textContent || "";
  if (!text.trim() || text.indexOf("Select parameters") >= 0 || text.indexOf("Выберите") >= 0) {
    notify("Сначала соберите промпт", "warn"); return;
  }
  safeCopy(text, "Промпт", this);
}

function copyJson() {
  try {
    var jsonData = buildJson();
export     if (!text || text === "{}" || text === "null") { notify("JSON пуст", "warn"); return; }
    safeCopy(text, "JSON", this);
  } catch (e) {
    notify("Ошибка JSON: " + e.message, "err");
  }
}

window.updatePrompt = updatePrompt; // Expose for verification
function updatePrompt() {
  const flat = buildFlatPrompt();
  $("promptOutput").textContent = flat;
export   // checkConflicts();
}

function savePrompt() {
  const text = $("promptOutput").textContent || "";
  if (!text.trim() || text.includes("Select parameters") || text.includes("Выберите")) { notify("Нечего сохранять", "warn"); return; }
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "vpe-prompt-" + Date.now() + ".txt"; a.click();
  URL.revokeObjectURL(url);
  notify("Файл сохранён");
}

function resetAll() {
  // Reset state
  ["aiModel", "cameraBody", "aspectRatio", "resolution", "purpose", "format", "medium", "lens", "focalLength", "shotSize", "aperture", "angle", "composition", "quality", "colorPalette", "mood", "referenceType", "photoStyle", "cinemaStyle", "directorStyle", "artStyle", "filmStock", "quickStyle", "fashionFoodStyle", "mainSubject", "textContent", "negativePrompt", "emotion", "cinematicPreset", "ambience", "foley", "cinematicFx"].forEach(k => state[k] = "");
  state.lightType = { primary: "", accent: "" };
  state.timeOfDay = { primary: "", accent: "" };
  state.lightFX = []; state.colorPalette = ""; state.skinDetail = []; state.hairDetail = []; state.material = []; state.typography = [];
  state.generateFourMode = false; state.grid3x3Mode = false; state.maxConsistency = false; state.beforeAfter = false; state.seamlessPattern = false; state.seed = "";
  state.mjVersion = "7"; state.mjStyle = ""; state.mjStylize = 250; state.mjChaos = 0; state.mjWeird = 0;
  state.sdCfg = 7; state.sdSteps = 25;
  state.fluxModel = "dev"; state.fluxGuidance = 3.5; state.fluxSteps = 28;
  state.dalleStyle = "vivid"; state.dalleQuality = "hd";
  state.skinRenderBoost = false; state.hairRenderBoost = false;
  state.referenceImages = []; state.referenceWeight = 50;
  state.promptFormat = "flat";
  state.isStandardPresetActive = false;

  // Reset inputs
  $("mainSubject").value = "";
  $("textContent").value = "";
  $("negativePrompt").value = "";
  $("generateFourMode").checked = false;
  $("grid3x3Mode").checked = false;
  $("maxConsistency").checked = false;
  $("skinRenderBoost").checked = false;
  $("hairRenderBoost").checked = false;
  $("lensSectionV2").classList.remove("disabled-section");
  $("beforeAfter").checked = false;
  $("beforeAfter").disabled = false;
  $("seamlessPattern").checked = false;
  $("seamlessPattern").disabled = false;
  $("generateFourMode").disabled = false;
  $("grid3x3Mode").disabled = false;
  $("maxConsistency").disabled = false;
  $("skinRenderBoost").disabled = false;
  $("hairRenderBoost").disabled = false;
  $("seedInput").value = "";
  // Reset engine param sliders
  $("mjStylizeSlider").value = 250; $("mjStylizeVal").textContent = "250";
  $("mjChaosSlider").value = 0; $("mjChaosVal").textContent = "0";
  $("mjWeirdSlider").value = 0; $("mjWeirdVal").textContent = "0";
  $("sdCfgSlider").value = 7; $("sdCfgVal").textContent = "7";
  $("sdStepsSlider").value = 25; $("sdStepsVal").textContent = "25";
  $("fluxGuidanceSlider").value = 3.5; $("fluxGuidanceVal").textContent = "3.5";
  $("fluxStepsSlider").value = 28; $("fluxStepsVal").textContent = "28";
  $("referenceImages").value = "";
  $("refWeightSlider").value = 50;
  $("weightValue").textContent = "50";

  // FIX: Reset all range sliders explicitly
  document.querySelectorAll('input[type="range"]').forEach(slider => {
    const def = slider.getAttribute('value') || slider.getAttribute('data-default') || slider.min || 0;
    slider.value = def;
    // Try to update sibling display if exists (usually id + "Val")
    const disp = document.getElementById(slider.id.replace("Slider", "Val"));
    if (disp) disp.textContent = def;
  });

  $("imagePreviewContainer").style.display = "none";
  $("referenceOptions").style.display = "none";
  $("referenceWeight").style.display = "none";
  $("imagePreviews").innerHTML = "";
  $("modelHint").style.display = "none";

  // Clear UI — buttons, conflict states, toggle labels
  document.querySelectorAll(".option-btn[data-group]").forEach(b => {
    b.classList.remove("active", "conflict-disabled");
    b.disabled = false;
    b.title = "";
    b.querySelectorAll(".slot-tag").forEach(t => t.remove());
  });
  document.querySelectorAll(".toggle-label").forEach(l => {
    l.classList.remove("checked");
    l.style.opacity = "";
    l.title = "";
  });
  // FIX: Also reset disabled-section on all left-panel sections
  document.querySelectorAll(".left-panel > .section.disabled-section").forEach(sec => {
    sec.classList.remove("disabled-section");
  });

  $("resolutionInfo").style.display = "block";
  $("resolutionOptions").style.display = "none";
  $("resolutionOptions").innerHTML = "";

  updateAll();
  notify("Всё сброшено");
}

// =============================================
// AI ENHANCE LOGIC
// =============================================

async function enhancePrompt() {
  const ta = document.getElementById('mainSubject');
  const text = ta.value.trim();
  if (!text) { ta.placeholder = 'Сначала введите идею...'; return; }

  const btn = document.getElementById('enhanceBtn');
  const originalContent = btn.innerHTML;
  btn.classList.add('loading');
  btn.innerHTML = '<span>⏳</span> Улучшаю...';
  btn.disabled = true;

  try {
    let improvedText = "";
    // System prompt construction
    const currentModel = state.aiModel || "General";
    const systemPrompt = `You are a professional video prompt engineer.
Expand this scene description into a detailed visual prompt.
Structure: [Subject/Character details] + [Environment/Location] + [Lighting/Atmosphere] + [Action/Pose].
Keep it concise but vivid (under 150 words). Write ONLY the improved prompt.
Target Model: ${currentModel}
Original idea: "${text}"`;

    improvedText = "";
    // If we had a Google API key, we could use callGemini here, but for now we follow the user's request to detach Groq.
    notify("AI-улучшение через GROQ отключено", "warn");
  } catch (e) {
    console.error(e);
    notify("AI Error: " + e.message, "err");
  }

  btn.classList.remove('loading');
  btn.innerHTML = originalContent;
  btn.disabled = false;
}

export async function callGemini(prompt) {
  if (!state.apiKey) throw new Error("Google API key not configured");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error?.message || "Gemini API error");
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export async function callGroq(prompt, key) {
  if (!key) throw new Error("Groq API key not provided");
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    })
  });
  if (!response.ok) throw new Error(`Groq HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error?.message || "Groq API error");
  return data.choices?.[0]?.message?.content || "";
}


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

export     if (!isActive) return; // If unselected, do nothing or user preference? Let's leave as is.

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

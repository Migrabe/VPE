import { state, $, updateAll, notify } from './client_logic.js';

export function resetAll() {
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


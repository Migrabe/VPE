import { state, $, updateAll, notify } from './client_logic.js';
import { applyPreset, buildFlatPrompt } from './template_manager.js';
import { copyPrompt, copyJson, savePrompt, enhancePrompt } from './export_import.js';
import { resetAll } from './history_manager.js';

export function bindEvents() {
  // Delegated clicks on option buttons
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".option-btn");
    if (!btn) return;

    if (btn.dataset.action === "addNegative") {
      addNegative(btn.dataset.value || "");
      return;
    }

    const group = btn.dataset.group;
    if (!group) return;
    handleSelect(group, btn.dataset.value || "");
  });

  $("referenceImages").addEventListener("change", handleImageUpload);
  $("refWeightSlider").addEventListener("input", (e) => {
    state.referenceWeight = parseInt(e.target.value, 10);
    $("weightValue").textContent = String(state.referenceWeight);
    updateAll();
  });

  // Gen params sliders
  $("mjStylizeSlider").addEventListener("input", (e) => { state.mjStylize = +e.target.value; $("mjStylizeVal").textContent = state.mjStylize; updateAll(); });
  $("mjChaosSlider").addEventListener("input", (e) => { state.mjChaos = +e.target.value; $("mjChaosVal").textContent = state.mjChaos; updateAll(); });
  $("mjWeirdSlider").addEventListener("input", (e) => { state.mjWeird = +e.target.value; $("mjWeirdVal").textContent = state.mjWeird; updateAll(); });
  $("sdCfgSlider").addEventListener("input", (e) => { state.sdCfg = +e.target.value; $("sdCfgVal").textContent = state.sdCfg; updateAll(); });
  $("sdStepsSlider").addEventListener("input", (e) => { state.sdSteps = +e.target.value; $("sdStepsVal").textContent = state.sdSteps; updateAll(); });
  $("fluxGuidanceSlider").addEventListener("input", (e) => { state.fluxGuidance = +e.target.value; $("fluxGuidanceVal").textContent = state.fluxGuidance; updateAll(); });
  $("fluxStepsSlider").addEventListener("input", (e) => { state.fluxSteps = +e.target.value; $("fluxStepsVal").textContent = state.fluxSteps; updateAll(); });

  // Compact button
  $("compactBtn").addEventListener("click", compactPrompt);

  $("copyPromptBtn").addEventListener("click", copyPrompt);
  $("copyJsonBtn").addEventListener("click", copyJson);
  $("resetBtn").addEventListener("click", resetAll);
  $("saveBtn").addEventListener("click", savePrompt);

  // Special modes checkboxes — bind via JS, not inline
  ["generateFourMode", "grid3x3Mode", "maxConsistency", "beforeAfter", "seamlessPattern", "skinRenderBoost", "hairRenderBoost"].forEach(id => {
    const cb = $(id);
    if (cb) {
      cb.addEventListener("change", () => {
        state[id] = cb.checked;

        // Visual feedback on label
        cb.closest(".toggle-label").classList.toggle("checked", cb.checked);
        updateAll();
      });
      // Also handle click on label itself for robustness
      cb.closest("label").addEventListener("click", (e) => {
        // Only handle if the click was on the label text, not the checkbox itself
        if (e.target === cb) return;
        e.preventDefault();
        cb.checked = !cb.checked;
        state[id] = cb.checked;
        cb.closest(".toggle-label").classList.toggle("checked", cb.checked);
        updateAll();
      });
    }
  });

  // Seed buttons
  $("randomSeedBtn").addEventListener("click", () => {
    const seed = Math.floor(Math.random() * 4294967295);
    $("seedInput").value = seed; state.seed = String(seed); updateAll();
    notify("Seed: " + seed);
  });
  $("clearSeedBtn").addEventListener("click", () => {
    $("seedInput").value = "";
    state.seed = "";
    updateAll();
  });
  // FIX: Seed Validation — allow empty to clear seed
  $("seedInput").addEventListener("input", function () {
    if (this.value === "") {
      state.seed = "";
      buildPrompt();
      return;
    }
    let val = parseInt(this.value, 10);
    if (isNaN(val) || val < 0) val = 0;
    if (val > 4294967295) val = 4294967295;
    this.value = val;
    state.seed = String(val);
    buildPrompt(); // strictly update text, not full updateAll to avoid focus loss
  });

  // FIX: Generate 4 vs 3x3 Mutual Exclusion
  $("generateFourMode").addEventListener("change", function () {
    if (this.checked && $("grid3x3Mode").checked) {
      $("grid3x3Mode").click(); // simulate click to trigger logic + visual update
    }
  });
  $("grid3x3Mode").addEventListener("change", function () {
    if (this.checked && $("generateFourMode").checked) {
      $("generateFourMode").click();
    }
  });
}

function handleInput() { updateAll(); }


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

  export function toggleSection(header, forceState = null) {
    const section = header.parentElement;
    if (!section) return;

    if (forceState !== null) {
      if (forceState === true) section.classList.remove('collapsed'); // Open
      else section.classList.add('collapsed'); // Close
    } else {
      section.classList.toggle('collapsed');
    }
  }

  export function initCollapsible() {
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
  export function expandRelatedSections (presetValues) {
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
  export function expandSectionsForQuickStyle (isActive) {
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




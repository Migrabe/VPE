import { state, wordCount, countParams, deepClone, $, notify, updateModelHint, updateAll, rebuildResolution, syncGroup } from './client_logic.js';
import { groupConfig, presets, resolutionMap, FILM_STOCKS, EMOTIONS } from './style_manager.js';

export function setPromptFormat(fmt) {
  state.promptFormat = fmt;
  document.querySelectorAll(".format-tab").forEach(t => {
    t.classList.toggle("active", t.dataset.format === fmt);
  });
  const labels = { flat: "Flat (Плоский)", structured: "Structured (Структурный)", midjourney: "Midjourney синтаксис" };
  $("promptFormatLabel").textContent = labels[fmt] || fmt;
  updateAll();
}

export function buildG4ForNBP(basePromptText) {
  // ---- Собираем base_scene из текущего state ----
  const cam = [state.cameraBody, state.lens, state.aperture].filter(Boolean).join(", ");

  const lightParts = [];
  if (state.lightType.primary) lightParts.push(state.lightType.primary + " as key light");
  if (state.lightType.accent) lightParts.push(state.lightType.accent + " as accent");
  if (state.timeOfDay.primary) lightParts.push(state.timeOfDay.primary);
  state.lightFX.forEach(fx => lightParts.push(fx));
  const lighting = lightParts.join(", ") || "natural lighting";

  const colorParts = [];
  if (state.colorPalette) colorParts.push(state.colorPalette);
  if (state.filmStock && FILM_STOCKS[state.filmStock]) colorParts.push(FILM_STOCKS[state.filmStock]);
  const color = colorParts.join(". ") || "";

  const skinParts = state.skinDetail.length ? state.skinDetail.join(", ") : "";
  const styleParts = [state.photoStyle, state.cinemaStyle, state.directorStyle, (state.artStyle && window.ART_STYLES_MAP ? window.ART_STYLES_MAP[state.artStyle] : "")].filter(Boolean).join(", ");

  let stylePreset = "";
  if (state.quickStyle && QUICK_STYLES[state.quickStyle]) stylePreset = QUICK_STYLES[state.quickStyle];
  if (state.fashionFoodStyle && FASHION_FOOD_STYLES[state.fashionFoodStyle]) stylePreset = FASHION_FOOD_STYLES[state.fashionFoodStyle];

  const ar = state.aspectRatio || "16:9";
  const res = state.resolution || "4K";
  const subject = state.mainSubject || "the subject";
  const emotion = state.emotion && EMOTIONS[state.emotion] ? EMOTIONS[state.emotion] : "";

  // ---- Negative: встроен в base_scene, не отдельным блоком ----
  const neg = state.negativePrompt
    ? state.negativePrompt
    : "No blurred faces, no plastic skin, no extra fingers";

  // ---- Формируем JSON-объект ----
  const g4 = {
    task: "GENERATE_SCENE_VARIATIONS",
    instruction: "STRICT REQUIREMENT: Generate 4 SEPARATE, INDIVIDUAL images. Do NOT create a grid or collage. Execute the image generation tool 4 separate times.",
    identity_lock: state.maxConsistency
      ? "The subject's face, bone structure, skin tone, and all physical features MUST remain 100% identical across all 4 images. The uploaded reference photo is the absolute source of facial identity. Zero deviation."
      : "Maintain consistent character appearance across all variations.",
    base_scene: {
      subject: subject,
      emotion: emotion || null,
      camera: cam || null,
      lighting: lighting,
      color: color || null,
      skin: skinParts || null,
      style: styleParts || null,
      style_preset: stylePreset || null,
      negative: neg
    },
    global_settings: {
      aspect_ratio: ar,
      resolution: res,
      consistency: "Maintain identical character, wardrobe, accessories. Only camera angle, framing, and environment change."
    },
    variations: [
      {
        id: 1,
        shot_type: "Low angle",
        angle: "Camera low, looking up at subject from the right",
        framing: "Medium-full body, subject powerful against sky",
        direction: "Emphasize industrial architecture above." + (cam ? " " + cam + "." : ""),
        environment_note: "Add new environmental details not in base scene."
      },
      {
        id: 2,
        shot_type: "Cowboy shot",
        angle: "Eye level, facing subject",
        framing: "Mid-thigh up",
        direction: "Subject walks toward camera. Shallow depth of field. Compression feel.",
        environment_note: "Add new environmental details not in base scene."
      },
      {
        id: 3,
        shot_type: "Dutch angle",
        angle: "Tilted 15°, eye level",
        framing: "Medium shot, waist up",
        direction: "Subject mid-action — show the next story beat. Diagonal tension.",
        environment_note: "Add new environmental details not in base scene."
      },
      {
        id: 4,
        shot_type: "Three-quarter from left",
        angle: "Behind-left of subject, looking over shoulder",
        framing: "Three-quarter body with environment",
        direction: "Wide angle 24mm feel. Environmental storytelling.",
        environment_note: "Add new environmental details not in base scene."
      }
    ]
  };

  // Убираем null-поля для чистоты
  Object.keys(g4.base_scene).forEach(k => {
    if (!g4.base_scene[k]) delete g4.base_scene[k];
  });

  return JSON.stringify(g4, null, 2);
}

export function buildG4FlatForNBP(basePromptText) {
  const subject = state.mainSubject || "the subject";
  const cam = [state.cameraBody, state.lens, state.focalLength, state.aperture].filter(Boolean).join(", ");
  const ar = state.aspectRatio || "16:9";
  const res = state.resolution || "4K";

  const lightParts = [];
  if (state.lightType.primary) lightParts.push(state.lightType.primary);
  if (state.lightType.accent) lightParts.push(state.lightType.accent);
  if (state.timeOfDay.primary) lightParts.push(state.timeOfDay.primary);
  state.lightFX.forEach(fx => lightParts.push(fx));
  const lighting = lightParts.join(", ") || "natural lighting";

  const colorParts = [];
  if (state.colorPalette) colorParts.push(state.colorPalette);
  if (state.filmStock && FILM_STOCKS[state.filmStock]) colorParts.push(FILM_STOCKS[state.filmStock]);
  const color = colorParts.join(". ");

  const skin = state.skinDetail.length ? state.skinDetail.join(", ") : "";
  const style = [state.photoStyle, state.cinemaStyle, state.directorStyle, (state.artStyle && window.ART_STYLES_MAP ? window.ART_STYLES_MAP[state.artStyle] : "")].filter(Boolean).join(". ");
  const neg = state.negativePrompt || "No blurred faces, no plastic skin, no extra fingers";
  const emotion = state.emotion && EMOTIONS[state.emotion] ? EMOTIONS[state.emotion] : "";

  const identity = state.maxConsistency
    ? "IDENTITY LOCK: The subject's face, bone structure, skin tone, and all physical features must remain 100% identical across all 4 images. Reference photo is the absolute source of identity.\\n\\n"
    : "";

  let flat = `GENERATE 4 SCENE VARIATIONS

You must generate 4 separate, individual images. Do NOT create a grid or collage. Execute the image generation tool 4 separate times.

${identity}BASE SCENE: ${subject}.`;

  if (emotion) flat += ` Emotion: ${emotion}.`;
  if (cam) flat += ` Photographed on ${cam}.`;
  flat += ` ${lighting}.`;
  if (color) flat += ` ${color}.`;
  if (skin) flat += ` ${skin}.`;
  if (style) flat += ` ${style}.`;
  flat += ` ${ar} aspect ratio, ${res}. ${neg}.`;

  flat += `\\nMaintain character and wardrobe across all shots.

--- VARIATION 1: LOW ANGLE ---
Low angle shot, camera looking up at the subject from the right side. Subject appears powerful against the sky.${cam ? " " + cam + "." : ""} Reframe with new environmental details.

--- VARIATION 2: COWBOY SHOT ---
Cowboy shot framing (mid-thigh up). Subject walks toward camera. Shallow depth of field. Compression feel. Reframe with new environmental details.

--- VARIATION 3: DUTCH ANGLE ---
Dutch angle, tilted 15°. Subject mid-action — show the next story beat. Dynamic diagonal tension. Reframe with new environmental details.

--- VARIATION 4: THREE-QUARTER FROM LEFT ---
Three-quarter body from the left. Subject turns, looking over shoulder. Wide angle 24mm feel, environmental storytelling. Reframe with new environmental details.`;

  return flat;
}

export function buildMidjourneyPrompt() {
  // MJ V7 best practice: natural language scene description, no quality spam
  // Structure: [scene/subject], [style cues], [technical], --params
  const desc = [];

  // Core scene
  if (state.mainSubject) desc.push(state.mainSubject.trim());
  if (state.emotion && EMOTIONS[state.emotion]) desc.push(EMOTIONS[state.emotion]);

  // Format/style (only if NOT photorealistic — MJ defaults to photo)
  if (state.format && state.format !== "photorealistic") desc.push(state.format);

  if (state.medium) desc.push(state.medium); // NEW

  // Camera cues (MJ understands camera language well)
  if (state.cameraBody) {
    // Strip "shot on " prefix for cleaner MJ syntax
    desc.push(state.cameraBody.replace(/^shot on\s*/i, ""));
  }
  if (state.lens) desc.push(state.lens);
  if (state.shotSize) desc.push(state.shotSize); // NEW
  if (state.focalLength) desc.push(state.focalLength);
  if (state.aperture) {
    // Extract just f-number for MJ
    const fMatch = state.aperture.match(/f\/[\d.]+/);
    if (fMatch) desc.push(fMatch[0]);
  }
  if (state.filmStock && FILM_STOCKS[state.filmStock]) desc.push(FILM_STOCKS[state.filmStock]);
  if (state.angle) desc.push(state.angle);
  if (state.composition) desc.push(state.composition);

  // Lighting — combine primary + accent naturally
  if (state.lightType.primary) desc.push(state.lightType.primary);
  if (state.lightType.accent) desc.push(state.lightType.accent);
  if (state.timeOfDay.primary) desc.push(state.timeOfDay.primary);
  if (state.timeOfDay.accent) desc.push(state.timeOfDay.accent);

  // Light FX (MJ handles these well)
  state.lightFX.forEach(fx => desc.push(fx));
  if (state.colorPalette) desc.push(state.colorPalette);
  if (state.mood) desc.push("Mood: " + state.mood); // FIX: consistent "Mood: " prefix across all formats

  // Materials & textures (compact)
  state.skinDetail.forEach(s => desc.push(s));
  state.hairDetail.forEach(h => desc.push(h));
  state.material.forEach(m => desc.push(m));

  // Text in image
  if (state.textContent) desc.push(`"${state.textContent}"`);
  state.typography.forEach(t => desc.push(t));

  // Artistic styles
  if (state.photoStyle) desc.push(state.photoStyle);
  if (state.cinemaStyle) desc.push(state.cinemaStyle);
  if (state.directorStyle) desc.push(state.directorStyle);
  if (state.artStyle && window.ART_STYLES_MAP && window.ART_STYLES_MAP[state.artStyle]) desc.push(window.ART_STYLES_MAP[state.artStyle]);
  if (state.quickStyle && QUICK_STYLES[state.quickStyle]) desc.push(QUICK_STYLES[state.quickStyle]);
  if (state.fashionFoodStyle && FASHION_FOOD_STYLES[state.fashionFoodStyle]) desc.push(FASHION_FOOD_STYLES[state.fashionFoodStyle]);

  // FIX: Cinematic Preset
  if (state.cinematicPreset && window.CINEMATIC_PRESETS_MAP && window.CINEMATIC_PRESETS_MAP[state.cinematicPreset]) desc.push(window.CINEMATIC_PRESETS_MAP[state.cinematicPreset]);

  // FIX: Audio (for video-gen models)
  if (state.ambience && typeof AMBIENCE !== 'undefined' && AMBIENCE[state.ambience]) desc.push(AMBIENCE[state.ambience]);
  if (state.foley && typeof FOLEY !== 'undefined' && FOLEY[state.foley]) desc.push(FOLEY[state.foley]);
  if (state.cinematicFx && typeof CINE_FX !== 'undefined' && CINE_FX[state.cinematicFx]) desc.push(CINE_FX[state.cinematicFx]);

  // Purpose as style hint
  if (state.purpose && state.purpose !== "Photography") desc.push(state.purpose);

  // Special modes
  if (state.beforeAfter) desc.push("before and after comparison");
  if (state.seamlessPattern) desc.push("seamless pattern");

  // Build prompt — comma separated, clean
  let prompt = desc.filter(Boolean).join(", ");
  // Clean: remove double commas, trim
  prompt = prompt.replace(/,\s*,/g, ",").replace(/,\s*$/, "").trim();

  // === MJ PARAMETERS ===
  const params = [];

  // AR
  if (state.aspectRatio) params.push(`--ar ${state.aspectRatio}`);

  // Quality
  if (state.quality && state.quality.includes("8k")) params.push("--q 1");

  // Stylize
  params.push(`--s ${state.mjStylize}`);

  // Chaos
  if (state.mjChaos > 0) params.push(`--chaos ${state.mjChaos}`);

  // Weird
  if (state.mjWeird > 0) params.push(`--weird ${state.mjWeird}`);

  // Style raw
  if (state.mjStyle === "raw") params.push("--style raw");

  // Version
  params.push(`--v ${state.mjVersion}`);

  // Tile for seamless
  if (state.seamlessPattern) params.push("--tile");

  // Seed
  if (state.seed) params.push("--seed " + state.seed);

  if (params.length) prompt += " " + params.join(" ");

  // FIX: Removed image URL appending as per user request (Manual Upload workflow)

  return prompt.trim() || "Select parameters on the left...";
}

export function buildStructuredPrompt() {
  let out = "";

  if (state.aiModel) out += `[Model: ${state.aiModel}]\n`;
  if (state.aspectRatio) out += `[Aspect: ${state.aspectRatio}]`;
  if (state.resolution) out += ` [Resolution: ${state.resolution}]`;
  if (state.aspectRatio || state.resolution) out += "\n";
  out += "\n";

  // Main prompt
  const parts = [];
  if (state.quality && state.aiModel !== "midjourney") parts.push(state.quality);
  if (state.purpose) parts.push(state.purpose);

  if (state.format && !(state.format === "photorealistic" && ["Photography", "Cinematic Still", "Product Photography"].includes(state.purpose))) parts.push(state.format);

  if (state.medium) parts.push(state.medium); // NEW

  if (state.mainSubject) parts.push(state.mainSubject.trim());
  if (state.emotion) parts.push(`EMOTION: ${EMOTIONS[state.emotion]}`);
  out += parts.filter(Boolean).join(", ") + "\n\n";

  // Camera
  if (!state.quickStyle) { // FIX: Ignore camera in Quick Style mode
    if (state.cameraBody || state.lens || state.aperture || state.angle || state.composition || state.shotSize) {
      out += "CAMERA: ";
      const cam = [];
      if (state.cameraBody) cam.push(state.cameraBody);
      if (state.lens) cam.push(state.lens);
      if (state.shotSize) cam.push(state.shotSize); // NEW
      if (state.focalLength) cam.push(state.focalLength);
      if (state.aperture) cam.push(state.aperture);
      if (state.angle) cam.push(state.angle);
      if (state.composition) cam.push(state.composition);
      out += cam.join(", ") + "\n";
    }

    // Lighting
    const lightParts = [];
    if (state.lightType.primary) lightParts.push(state.lightType.primary);
    if (state.lightType.accent) lightParts.push(state.lightType.accent);
    if (state.timeOfDay.primary) lightParts.push(state.timeOfDay.primary);
    if (state.timeOfDay.accent) lightParts.push(state.timeOfDay.accent);
    if (lightParts.length) out += "LIGHTING: " + lightParts.join(", ") + "\n";

    if (state.lightFX.length) out += "EFFECTS: " + state.lightFX.join(", ") + "\n";
    if (state.colorPalette) out += "PALETTE: " + state.colorPalette + "\n";
    if (state.mood) out += "MOOD: " + state.mood + "\n"; // NEW

    if (state.skinDetail.length) out += "SKIN: " + state.skinDetail.join(", ") + "\n";
    if (state.hairDetail.length) out += "HAIR: " + state.hairDetail.join(", ") + "\n";
    if (state.material.length) out += "MATERIALS: " + state.material.join(", ") + "\n";
  }

  if (state.textContent) {
    out += `TEXT: "${state.textContent}"`;
    if (state.typography.length) out += ` [${state.typography.join(", ")}]`;
    out += "\n";
  }

  // Modes
  var _cgs = state.aiModel === "chatgpt-image";
  if (state.photoStyle) out += "STYLE: " + (_cgs ? (CHATGPT_STYLE_MAP[state.photoStyle] || state.photoStyle) : state.photoStyle) + "\n";
  if (state.cinemaStyle) out += "CINEMATOGRAPHY: " + (_cgs ? (CHATGPT_STYLE_MAP[state.cinemaStyle] || state.cinemaStyle) : state.cinemaStyle) + "\n";
  if (state.directorStyle) out += "DIRECTOR: " + (_cgs ? (CHATGPT_STYLE_MAP[state.directorStyle] || state.directorStyle) : state.directorStyle) + "\n";
  if (state.artStyle && window.ART_STYLES_MAP && window.ART_STYLES_MAP[state.artStyle]) out += "ART STYLE: " + window.ART_STYLES_MAP[state.artStyle] + "\n";
  if (state.quickStyle && QUICK_STYLES[state.quickStyle]) out += "STYLE PRESET: " + QUICK_STYLES[state.quickStyle] + "\n";
  if (state.fashionFoodStyle && FASHION_FOOD_STYLES[state.fashionFoodStyle]) out += "FASHION/FOOD STYLE: " + FASHION_FOOD_STYLES[state.fashionFoodStyle] + "\n";
  // FIX: Cinematic Preset
  if (state.cinematicPreset && window.CINEMATIC_PRESETS_MAP && window.CINEMATIC_PRESETS_MAP[state.cinematicPreset]) out += "CINEMATIC STYLE: " + window.CINEMATIC_PRESETS_MAP[state.cinematicPreset] + "\n";
  // FIX: Film Stock (was missing from structured format)
  if (state.filmStock && FILM_STOCKS[state.filmStock]) out += "FILM STOCK: " + FILM_STOCKS[state.filmStock] + "\n";
  // FIX: Audio layers
  if (state.ambience && typeof AMBIENCE !== 'undefined' && AMBIENCE[state.ambience]) out += "AMBIENCE: " + AMBIENCE[state.ambience] + "\n";
  if (state.foley && typeof FOLEY !== 'undefined' && FOLEY[state.foley]) out += "FOLEY: " + FOLEY[state.foley] + "\n";
  if (state.cinematicFx && typeof CINE_FX !== 'undefined' && CINE_FX[state.cinematicFx]) out += "CINEMATIC FX: " + CINE_FX[state.cinematicFx] + "\n";
  const modes = [];
  if (state.generateFourMode) modes.push("Generate 4 Variations");
  if (state.beforeAfter) modes.push("before/after");
  if (state.seamlessPattern) modes.push("seamless pattern");
  if (modes.length) out += "MODES: " + modes.join(", ") + "\n";
  if (state.seed) out += "SEED: " + state.seed + "\n";
  // Engine-specific params
  if (state.aiModel === "stable-diffusion") {
    out += `CFG: ${state.sdCfg} | Steps: ${state.sdSteps}\n`;
  }
  if (state.aiModel === "flux") {
    out += `Model: flux-${state.fluxModel} | Guidance: ${state.fluxGuidance} | Steps: ${state.fluxSteps}\n`;
  }
  if (state.aiModel === "dall-e-3") {
    out += `Style: ${state.dalleStyle} | Quality: ${state.dalleQuality}\n`;
  }

  // References
  if (state.referenceImages.length) {
    out += "\n--- REFERENCES ---\n";
    out += `Images: ${state.referenceImages.length}, Weight: ${state.referenceWeight}%`;
    if (state.referenceType) out += `, Type: ${state.referenceType}`;
    out += "\n";
    state.referenceImages.forEach((img, i) => {
      if ((img.description || "").trim()) out += `  #${i + 1}: ${img.description.trim()}\n`;
    });
  }

  return out.trim() || "Select parameters on the left...";
}

export function appendNegativeLast(text) {
  const negRaw = (state.negativePrompt || "").trim();
  if (!negRaw) return text;

  // Midjourney syntax: always last
  if (state.promptFormat === "midjourney" || state.aiModel === "midjourney") {
    const noWords = negRaw.replace(/,\s*/g, ", ");
    return (text.trim() + " --no " + noWords).trim();
  }

  if (state.promptFormat === "structured") {
    return (text.trim() + "\n\nNEGATIVE: " + negRaw).trim();
  }

  return (text.trim() + "\n\nNegative prompt: " + negRaw).trim();
}

export function buildJson() {
  return {
    schema: "vpe-prompt-builder-v2",
    model: state.aiModel || null,
    subject: state.mainSubject || "",
    prompt_flat: buildFlatPrompt(),
    prompt_midjourney: state.aiModel === "midjourney" ? buildMidjourneyPrompt() : undefined,
    technical: {
      aspect_ratio: state.aspectRatio || null,
      resolution: state.resolution || null
    },
    parameters: {
      purpose: state.purpose || null,
      format: state.format || null,
      medium: state.medium || null, // NEW
      mood: state.mood || null, // NEW
      camera: {
        body: state.cameraBody || null,
        lens: state.lens || null,
        shot_size: state.shotSize || null, // NEW
        focal_length: state.focalLength || null,
        aperture: state.aperture || null,
        angle: state.angle || null,
        composition: state.composition || null
      },
      lighting: {
        type: { primary: state.lightType.primary || null, accent: state.lightType.accent || null },
        time: { primary: state.timeOfDay.primary || null, accent: state.timeOfDay.accent || null },
        effects: state.lightFX,
        palette: state.colorPalette || null
      },
      materials: { skin: state.skinDetail, hair: state.hairDetail, objects: state.material },
      text: state.textContent ? { content: state.textContent, style: state.typography } : null,
      quality: state.quality || null,
      photo_style: state.photoStyle || null,
      cinema_style: state.cinemaStyle || null,
      director_style: state.directorStyle || null,
      art_style: state.artStyle || null,
      film_stock: state.filmStock || null,
      quick_style: state.quickStyle || null,
      fashion_food_style: state.fashionFoodStyle || null,
      emotion: state.emotion || null,
      cinematic_preset: state.cinematicPreset || null,
      audio: {
        ambience: state.ambience || null,
        foley: state.foley || null,
        cinematic_fx: state.cinematicFx || null
      }
    },
    modes: { generateFour: state.generateFourMode, grid3x3: state.grid3x3Mode, maxConsistency: state.maxConsistency, before_after: state.beforeAfter, seamless_pattern: state.seamlessPattern },
    renderBoost: { skin: state.skinRenderBoost, hair: state.hairRenderBoost },
    seed: state.seed || null,
    engine_params: (function () {
      const m = state.aiModel;
      if (m === "midjourney") return { version: state.mjVersion, style: state.mjStyle || "default", stylize: state.mjStylize, chaos: state.mjChaos, weird: state.mjWeird };
      if (m === "stable-diffusion") return { cfg_scale: state.sdCfg, steps: state.sdSteps };
      if (m === "flux") return { model: "flux-" + state.fluxModel, guidance: state.fluxGuidance, steps: state.fluxSteps };
      if (m === "dall-e-3") return { style: state.dalleStyle, quality: state.dalleQuality };
      return null;
    })(),
    references: {
      type: (state.referenceType || null),
      weight: state.referenceWeight,
      images: state.referenceImages.map((img, i) => ({
        name: img.name, size: img.size, description: img.description || "", extract: img.extract || [],
        role: state.aiModel === "midjourney" ? (i === 0 ? "omni-reference" : "style-reference") : undefined
      }))
    },
    negative: (state.negativePrompt || "").trim() || ""
  };
}

export function buildFlatPrompt() {
  const headers = [];
  const parts = [];

  // 1. Headers (Metadata)
  // Aspect ratio & resolution — prepend as metadata tags
  if (state.aspectRatio) headers.push(`[Aspect: ${state.aspectRatio}]`);
  if (state.resolution) headers.push(`[Resolution: ${state.resolution}]`);

  // 2. Styles & Parameters
  // Skip quality keywords for MJ (uses --q parameter instead)
  if (state.quality && state.aiModel !== "midjourney") parts.push(state.quality);
  if (state.purpose) parts.push(state.purpose);

  // Format
  if (state.format) {
    // Skip "photorealistic" if purpose already implies it (Photography, Cinematic Still)
    const skipPhotoreal = state.format === "photorealistic" && ["Photography", "Cinematic Still", "Product Photography"].includes(state.purpose);
    if (!skipPhotoreal) parts.push(state.format);
  }

  // Medium (NEW)
  if (state.medium) parts.push(state.medium);

  // NOTE: Main Subject is handled separately below

  // FIX: Quick Style Overlay Logic
  // If Quick Style is active, ignore Camera, Lighting, and Materials
  if (!state.quickStyle) {
    // Camera
    if (state.cameraBody) parts.push(state.cameraBody);
    if (state.lens) parts.push(state.lens);
    if (state.focalLength) parts.push(state.focalLength);
    if (state.aperture) parts.push(state.aperture);
    if (state.filmStock && FILM_STOCKS[state.filmStock]) parts.push(FILM_STOCKS[state.filmStock]);

    // Explicitly ignore Angle and Composition in G4 mode (variations handle this)
    if (!state.generateFourMode) {
      if (state.shotSize) parts.push(state.shotSize); // NEW
      if (state.angle) parts.push(state.angle);
      if (state.composition) parts.push(state.composition);
    }

    // Lighting — flat, no curly braces
    if (state.lightType.primary) parts.push(state.lightType.primary);
    if (state.lightType.accent) parts.push(state.lightType.accent);
    if (state.timeOfDay.primary) parts.push(state.timeOfDay.primary);
    if (state.timeOfDay.accent) parts.push(state.timeOfDay.accent);

    // Effects
    state.lightFX.forEach(fx => parts.push(fx));
    if (state.colorPalette) parts.push(state.colorPalette);
    if (state.mood) parts.push("Mood: " + state.mood); // NEW

    // Skin
    state.skinDetail.forEach(s => parts.push(s));
    state.hairDetail.forEach(h => parts.push(h));

    // Materials
    state.material.forEach(m => parts.push(m));
  } else {
    // Quick Style active: Allow only limited modifiers or let the style dominate
    // We might want to allow Composition/Angle if strictly needed, but per rule 18 they should be disabled.
    // We'll trust the conflict rule 18 disabling logic, but this double-check ensures clean prompts.
  }

  // Text
  if (state.textContent) parts.push(`text "${state.textContent}"`);
  state.typography.forEach(t => parts.push(t));

  // Modes
  // Styles — ChatGPT: swap author names for descriptions
  var _cg = state.aiModel === "chatgpt-image";
  if (!state.quickStyle) {
    if (state.photoStyle) parts.push(_cg ? (CHATGPT_STYLE_MAP[state.photoStyle] || state.photoStyle) : state.photoStyle);
    if (state.cinemaStyle) parts.push(_cg ? (CHATGPT_STYLE_MAP[state.cinemaStyle] || state.cinemaStyle) : state.cinemaStyle);
    if (state.directorStyle) parts.push(_cg ? (CHATGPT_STYLE_MAP[state.directorStyle] || state.directorStyle) : state.directorStyle);
    if (state.artStyle && window.ART_STYLES_MAP && window.ART_STYLES_MAP[state.artStyle]) parts.push(window.ART_STYLES_MAP[state.artStyle]);
  }

  // Quick Style Preset
  if (state.quickStyle && QUICK_STYLES[state.quickStyle]) parts.push(QUICK_STYLES[state.quickStyle]);
  // Fashion & Food Style
  if (state.fashionFoodStyle && FASHION_FOOD_STYLES[state.fashionFoodStyle]) parts.push(FASHION_FOOD_STYLES[state.fashionFoodStyle]);

  // FIX: Cinematic Presets
  if (state.cinematicPreset && window.CINEMATIC_PRESETS_MAP && window.CINEMATIC_PRESETS_MAP[state.cinematicPreset]) parts.push(window.CINEMATIC_PRESETS_MAP[state.cinematicPreset]);

  // FIX: Audio — Ambience, Foley, Cinematic FX
  if (state.ambience && typeof AMBIENCE !== 'undefined' && AMBIENCE[state.ambience]) parts.push(AMBIENCE[state.ambience]);
  if (state.foley && typeof FOLEY !== 'undefined' && FOLEY[state.foley]) parts.push(FOLEY[state.foley]);
  if (state.cinematicFx && typeof CINE_FX !== 'undefined' && CINE_FX[state.cinematicFx]) parts.push(CINE_FX[state.cinematicFx]);

  // Special modes
  if (state.beforeAfter) parts.push("before and after side-by-side comparison");
  if (state.seamlessPattern) parts.push("seamless tileable pattern");
  // Seed is passed as parameter, not in prompt text

  // 3. Construct Final String
  let finalPrompt = "Generate an image.\n";

  // Add Headers
  if (headers.length > 0) finalPrompt += headers.join(", ") + "\n";

  // Add Subject (on new line with prefix)
  if (state.mainSubject && state.mainSubject.trim()) {
    finalPrompt += `subject: ${state.mainSubject.trim()}\n`;
  }

  // EMOTION
  if (state.emotion && EMOTIONS[state.emotion]) {
    finalPrompt += `emotion: ${EMOTIONS[state.emotion]}\n`;
  }

  const modifiers = parts.filter(Boolean).join(", ");
  if (modifiers) finalPrompt += modifiers;

  // References note (not part of actual prompt, but informational)
  let refs = "";
  if (state.referenceImages.length) {
    refs += "\n\n--- Reference images ---\n";
    refs += `${state.referenceImages.length} image(s), weight: ${state.referenceWeight}%`;
    if (state.referenceType) refs += `, type: ${state.referenceType}`;
    state.referenceImages.forEach((img, i) => {
      if ((img.description || "").trim()) refs += `\nImage ${i + 1}: ${img.description.trim()}`;
    });
  }

  return (finalPrompt + refs).trim() || "Select parameters on the left...";
}

// =============================================
// BUILD PROMPT — STRUCTURED
// =============================================


// =============================================
// BUILD PROMPT — MIDJOURNEY V7
// =============================================


// =============================================
// BUILD JSON
// =============================================


// =============================================
// ACTIVE TAGS
// =============================================
function updateActiveTags() {
  const area = $("activeTags");
  area.innerHTML = "";

  const addTag = (label, value, type, onRemove) => {
    const tag = document.createElement("span");
    tag.className = `tag-item ${type || ""}`.trim();
    tag.innerHTML = `<span>${esc(label)}: <b>${esc(value)}</b></span><span class="remove">×</span>`;
    tag.querySelector(".remove").addEventListener("click", onRemove);
    area.appendChild(tag);
  };

  // Singles
  // Singles
  ["aiModel", "cameraBody", "aspectRatio", "resolution", "purpose", "format", "medium", "lens", "shotSize", "focalLength", "aperture", "angle", "composition", "quality", "colorPalette", "mood", "referenceType", "photoStyle", "cinemaStyle", "directorStyle", "artStyle", "filmStock", "quickStyle", "fashionFoodStyle", "emotion", "cinematicPreset", "ambience", "foley", "cinematicFx"].forEach(k => {
    if (state[k]) {
      addTag(k, state[k], "", () => {
        state[k] = "";
        syncGroup(k);
        if (k === "aspectRatio") { state.resolution = ""; rebuildResolution(); syncGroup("resolution"); }
        if (k === "aiModel") updateModelHint();
        updateAll();
      });
    }
  });

  // PA
  ["lightType", "timeOfDay"].forEach(k => {
    const v = state[k] || { primary: "", accent: "" };
    if (v.primary) addTag(k, v.primary, "primary", () => { state[k].primary = ""; syncPAUI(k); updateAll(); });
    if (v.accent) addTag(k, v.accent, "accent", () => { state[k].accent = ""; syncPAUI(k); updateAll(); });
  });

  // Multi
  ["lightFX", "skinDetail", "hairDetail", "material", "typography"].forEach(k => {
    (state[k] || []).forEach(val => {
      addTag(k, val, "", () => { state[k] = state[k].filter(x => x !== val); syncGroup(k); updateAll(); });
    });
  });

  // Modes
  if (state.generateFourMode) addTag("mode", "Generate 4", "", () => { $("generateFourMode").checked = false; state.generateFourMode = false; updateAll(); });
  if (state.grid3x3Mode) addTag("mode", "3×3 Contact Sheet", "", () => { $("grid3x3Mode").checked = false; state.grid3x3Mode = false; updateAll(); });
  if (state.maxConsistency) addTag("mode", "🔒 Consistency", "", () => { $("maxConsistency").checked = false; state.maxConsistency = false; updateAll(); });
  // Engine params tags
  if (state.aiModel === "midjourney") {
    if (state.mjStyle === "raw") addTag("engine", "--style raw", "", () => { state.mjStyle = ""; syncGroup("mjStyle"); updateAll(); });
    if (state.mjChaos > 0) addTag("engine", "--chaos " + state.mjChaos, "");
    if (state.mjWeird > 0) addTag("engine", "--weird " + state.mjWeird, "");
  }
  if (state.aiModel === "dall-e-3") {
    addTag("engine", state.dalleStyle, "");
    addTag("engine", state.dalleQuality, "");
  }
  if (state.skinRenderBoost) addTag("render", "Skin Boost", "", () => { $("skinRenderBoost").checked = false; state.skinRenderBoost = false; updateAll(); });
  if (state.hairRenderBoost) addTag("render", "Hair Boost", "", () => { $("hairRenderBoost").checked = false; state.hairRenderBoost = false; updateAll(); });
  if (state.beforeAfter) addTag("mode", "before/after", "", () => { $("beforeAfter").checked = false; state.beforeAfter = false; updateAll(); });
  if (state.seamlessPattern) addTag("mode", "seamless", "", () => { $("seamlessPattern").checked = false; state.seamlessPattern = false; updateAll(); });
  if (state.seed) addTag("seed", "seed: " + state.seed, "", () => { $("seedInput").value = ""; state.seed = ""; updateAll(); });

  if (state.referenceImages.length) {
    addTag("refs", `${state.referenceImages.length} image(s)`, "", () => {
      state.referenceImages = []; $("referenceImages").value = "";
      $("imagePreviewContainer").style.display = "none";
      $("referenceOptions").style.display = "none";
      $("referenceWeight").style.display = "none";
      updateAll();
    });
  }

  // FIX: Hide Active Tags section if empty
  const tagSection = area.closest(".section");
  if (tagSection) {
    tagSection.style.display = area.children.length === 0 ? "none" : "block";
  }
}

// =============================================
// COUNT PARAMS
// =============================================
function countParams() {
  let c = 0;
  ["aiModel", "cameraBody", "aspectRatio", "resolution", "purpose", "format", "medium", "lens", "shotSize", "focalLength", "aperture", "angle", "composition", "quality", "referenceType", "photoStyle", "cinemaStyle", "directorStyle", "artStyle", "filmStock", "quickStyle", "fashionFoodStyle", "emotion", "mood", "cinematicPreset", "ambience", "foley", "cinematicFx"].forEach(k => { if (state[k]) c++; });
  ["lightFX", "skinDetail", "hairDetail", "material", "typography"].forEach(k => { if ((state[k] || []).length) c++; });
  if (state.colorPalette) c++;
  if (state.lightType.primary) c++;
  if (state.lightType.accent) c++;
  if (state.timeOfDay.primary) c++;
  if (state.timeOfDay.accent) c++;
  if ((state.mainSubject || "").trim()) c++;
  if ((state.textContent || "").trim()) c++;
  if ((state.negativePrompt || "").trim()) c++;
  if (state.generateFourMode) c++;
  if (state.grid3x3Mode) c++;
  if (state.maxConsistency) c++;
  if (state.skinRenderBoost) c++;
  if (state.hairRenderBoost) c++;
  if (state.mjStyle) c++;
  if (state.dalleStyle) c++;
  if (state.dalleQuality) c++;
  if (state.fluxModel) c++;
  if (state.beforeAfter) c++;
  if (state.seamlessPattern) c++;
  if (state.seed) c++;
  if (state.referenceImages.length) c++;
  return c;
}

// =============================================
// UPDATE ALL
// =============================================

// =============================================
// NEGATIVE — always appended at the very end
// =============================================


// =============================================
// BUILD G4 PROMPT — NANO BANANA PRO
// =============================================





function updateAll() {
  // Sync inputs to state
  state.mainSubject = $("mainSubject").value || "";
  state.textContent = $("textContent").value || "";
  state.negativePrompt = $("negativePrompt").value || "";
  state.generateFourMode = $("generateFourMode").checked;
  // Sync engine-specific button groups
  // (mjVersion, mjStyle, dalleStyle, dalleQuality, fluxModel are synced via handleSelect)
  state.grid3x3Mode = $("grid3x3Mode").checked;
  state.maxConsistency = $("maxConsistency").checked;
  state.beforeAfter = $("beforeAfter").checked;
  state.skinRenderBoost = $("skinRenderBoost").checked;
  state.hairRenderBoost = $("hairRenderBoost").checked;
  state.seamlessPattern = $("seamlessPattern").checked;
  state.seed = $("seedInput").value || "";

  // Normalize mutually exclusive state combinations (legacy presets / stale state).
  if (state.quickStyle && state.fashionFoodStyle) {
    state.fashionFoodStyle = "";
    syncGroup("fashionFoodStyle");
  }
  if (state.generateFourMode && state.grid3x3Mode) {
    state.grid3x3Mode = false;
    $("grid3x3Mode").checked = false;
  }
  if (state.beforeAfter && state.seamlessPattern) {
    state.seamlessPattern = false;
    $("seamlessPattern").checked = false;
  }
  if (state.cinematicPreset) {
    state.cinematicPreset = "";
    syncGroup("cinematicPreset");
  }

  // Sync PA UI
  syncPAUI("lightType");
  syncPAUI("timeOfDay");

  // === Update engine-specific panels ===
  updateRefUI();
  updateGenParamsUI();

  // Auto-switch prompt format when Midjourney selected
  if (state.aiModel === "midjourney" && state.promptFormat !== "midjourney") {
    setPromptFormat("midjourney");
  }
  // Return to flat format when Midjourney is deselected
  if (state.aiModel !== "midjourney" && state.promptFormat === "midjourney") {
    setPromptFormat("flat");
  }

  // === Generate 4 Mode: disable lens section ===
  // === Generate 4 Mode: lens stays enabled (G4 variations use camera params) ===
  // FIX: Only remove disabled-section if 3x3 is not also active
  if (state.generateFourMode && !state.grid3x3Mode) {
    $("lensSectionV2").classList.remove("disabled-section");
  } else if (!state.grid3x3Mode) {
    $("lensSectionV2").classList.remove("disabled-section");
  }

  // === 3x3 Mode: disable lens, aperture, angle, composition (overridden by contact sheet) ===
  if (state.grid3x3Mode) {
    $("lensSectionV2").classList.add("disabled-section");
  }

  // === CONFLICT DISABLING SYSTEM ===
  applyConflictRules();

  // Resolution
  rebuildResolution();

  // Tags
  updateActiveTags();

  // Build prompt based on format
  let promptText;
  if (state.promptFormat === "midjourney") promptText = buildMidjourneyPrompt();
  else if (state.promptFormat === "structured") promptText = buildStructuredPrompt();
  else promptText = buildFlatPrompt();

  // === RENDER BOOST CONFIGS — append after main prompt ===
  if (state.skinRenderBoost) {
    promptText += "\n\n" + SKIN_RENDER_CONFIG;
  }
  if (state.hairRenderBoost) {
    promptText += "\n\n" + HAIR_RENDER_CONFIG;
  }

  // === SPECIAL MODE WRAPPING ===

  // Max Consistency — prepend identity lock protocol (most effective at the very start)
  if (state.maxConsistency) {
    promptText = MAX_CONSISTENCY_PREFIX + "\n" + promptText;
    // FIX: --cw 100 is a Midjourney-only parameter
    if (state.aiModel === "midjourney") {
      promptText = promptText.trimEnd() + " --cw 100";
    }
  }

  // 3x3 Contact Sheet — prepend the block to the beginning of the prompt
  if (state.grid3x3Mode) {
    promptText = GRID_3X3_PREFIX + promptText;
  }

  // Generate 4 — dynamic block based on selected model
  if (state.generateFourMode) {
    const isNBP = ["nano-banana-pro", "nano-banana", "gemini-imagen"].includes(state.aiModel);

    if (isNBP) {
      // NBP: выбираем формат — JSON если structured, flat если flat
      if (state.promptFormat === "structured") {
        promptText = buildG4ForNBP(promptText);
      } else {
        promptText = buildG4FlatForNBP(promptText);
        // В flat-режиме base prompt уже внутри G4 блока, не дублируем
      }
    } else {
      // Standard Legacy Logic for other models
      let g4block = GENERATE_FOUR_PREFIX;
      if (state.mainSubject && state.mainSubject.trim()) {
        g4block = g4block.replace(/of a subject/g, "of " + state.mainSubject.trim());
        g4block = g4block.replace(/the Subject/g, state.mainSubject.trim());
      }
      // Reference AR Logic (Legacy)
      if (state.referenceImages.length && state.referenceImages[0].width && state.referenceImages[0].height) {
        const w = state.referenceImages[0].width;
        const h = state.referenceImages[0].height;
        const ratio = w / h;
        const standardARs = [
          { label: "1:1", val: 1 }, { label: "16:9", val: 16 / 9 }, { label: "21:9", val: 21 / 9 }, { label: "2:3", val: 2 / 3 }, { label: "9:16", val: 9 / 16 }
        ];
        let closest = standardARs[0];
        let minDiff = Math.abs(ratio - closest.val);
        for (const ar of standardARs) {
          const diff = Math.abs(ratio - ar.val);
          if (diff < minDiff) { minDiff = diff; closest = ar; }
        }
        const refAR = closest.label;
        if (refAR !== "21:9") {
          g4block = g4block.replace(/"aspect_ratio": "21:9"/g, '"aspect_ratio": "' + refAR + '"');
          g4block = g4block.replace(/in a 21:9 format/g, "in a " + refAR + " format");
        }
      }
      promptText = g4block + "\n\n" + promptText;
    }
  }

  // Ensure NEGATIVE block is always the very last part of the final prompt (Skip for NBP G4)
  const isNBPG4 = state.generateFourMode && ["nano-banana-pro", "nano-banana", "gemini-imagen"].includes(state.aiModel);
  if (!isNBPG4) {
    promptText = appendNegativeLast(promptText);
  }

  const outBox = $("promptOutput");
  outBox.textContent = promptText;
  outBox.classList.toggle("empty", promptText.includes("Select parameters"));

  // Stats
  $("charCount").textContent = String(promptText.length);
  $("wordCount").textContent = String(wordCount(promptText));
  $("paramCount").textContent = String(countParams());

  // JSON
  $("jsonOutput").textContent = JSON.stringify(buildJson(), null, 2);

  // Check conflicts
  // checkConflicts();
}

// =============================================
// CONFLICT RULES — disables incompatible buttons
// =============================================
function applyPreset(index) {
  state.isStandardPresetActive = true;
  const p = presets[index];
  if (!p) return;
  const v = deepClone(p.values);
  if (window.expandRelatedSections) window.expandRelatedSections(v);

  // Reset all selectable state
  ["aiModel", "cameraBody", "aspectRatio", "resolution", "purpose", "format", "medium", "lens", "focalLength", "shotSize", "aperture", "angle", "composition", "quality", "colorPalette", "mood", "referenceType", "photoStyle", "cinemaStyle", "directorStyle", "artStyle", "filmStock", "quickStyle", "fashionFoodStyle", "emotion", "cinematicPreset", "ambience", "foley", "cinematicFx"].forEach(k => state[k] = "");
  state.lightType = { primary: "", accent: "" };
  state.timeOfDay = { primary: "", accent: "" };
  state.lightFX = []; state.colorPalette = ""; state.skinDetail = []; state.hairDetail = []; state.material = []; state.typography = [];

  // Apply from preset
  Object.entries(v).forEach(([k, val]) => {
    if (k === "lightType" || k === "timeOfDay") {
      state[k] = val && typeof val === "object" ? val : { primary: "", accent: "" };
      return;
    }
    if (!groupConfig[k]) return;
    const mode = groupConfig[k].mode;
    if (mode === "single") state[k] = val || "";
    if (mode === "multi") state[k] = Array.isArray(val) ? val : [];
  });

  // Backward compatibility: legacy presets stored shot-size in `composition`.
  if (!state.shotSize && state.composition) {
    const c = state.composition.toLowerCase();
    if (
      c.includes("close-up") ||
      c.includes("head and shoulders") ||
      c.includes("waist up") ||
      c.includes("full body") ||
      c.includes("extreme wide") ||
      c.includes("wide shot") ||
      c.includes("flat lay") ||
      c.includes("silhouette")
    ) {
      state.shotSize = state.composition;
    }
  }

  // Validate AR exists in buttons
  if (state.aspectRatio && !resolutionMap[state.aspectRatio]) {
    state.aspectRatio = ""; state.resolution = "";
    notify("AR из пресета не найден, сброшен", "warn");
  } else {
    state.resolution = "";
  }

  // Sync all UI buttons
  Object.keys(groupConfig).forEach(syncGroup);
  updateModelHint();
  rebuildResolution();
  updateAll();
  notify("Пресет «" + p.name.replace(/[^\w\sа-яёА-ЯЁ]/gi, "").trim() + "» применён");
}

// =============================================
// ACTIONS
// =============================================
// Reference extract handling
const REF_EXTRACT_OPTIONS = ["Лицо", "Палитру", "Позу", "Стиль", "Текстуру"];

// Conflict checking
function checkConflicts() {
  const warnings = [];
  const isArtistic = ["oil painting", "pencil sketch", "pixel art", "watercolor", "anime style", "vector illustration"].includes(state.format);
  // photoStyle + cinemaStyle + directorStyle + artStyle simultaneously
  const styleCount = [state.photoStyle, state.cinemaStyle, state.directorStyle, state.artStyle].filter(Boolean).length;
  if (state.quickStyle && styleCount > 0) warnings.push("Быстрый стилевой пресет + авторский стиль — конфликт. Рекомендуется оставить что-то одно.");
  if (state.quickStyle && state.fashionFoodStyle) warnings.push("Одновременно выбраны «Быстрые пресеты» и «Fashion/Food» — оставьте только один режим.");
  if (state.quickStyle && (state.cameraBody || state.lens)) warnings.push("Стилевой пресет уже задаёт камеру/оптику — ваш выбор может конфликтовать.");
  if (styleCount > 1) warnings.push("Выбрано несколько авторских стилей одновременно — может быть конфликт. Рекомендуется оставить один.");
  // Negative prompt with DALL-E/Flux
  if ((state.negativePrompt || "").trim() && (state.aiModel === "dall-e-3" || state.aiModel === "flux")) warnings.push("DALL·E 3 и Flux не поддерживают негативные промпты — они будут проигнорированы.");
  // Macro lens + wide composition
  if (state.lens && (state.lens.includes("Macro") || state.lens.includes("105mm")) && state.composition && (state.composition.includes("wide shot") || state.composition.includes("extreme wide"))) warnings.push("Макро-объектив + широкий/дальний план — нетипичная комбинация.");
  // Ultra-wide + close-up
  if (state.lens && (state.lens.includes("14mm") || state.lens.includes("14-24mm") || state.lens.includes("15-35mm")) && state.composition && state.composition.includes("extreme close-up")) warnings.push("Ультра-широкий объектив + экстр. крупный план — возможны сильные искажения.");
  // Anamorphic without cinema purpose
  if (state.lens && state.lens.includes("Anamorphic") && state.purpose && !["Cinematic Still", "Advertising campaign"].includes(state.purpose)) warnings.push("Анаморфотная оптика нетипична для «" + state.purpose + "».");
  // B&W photographer style + neon lighting
  if (state.photoStyle && state.photoStyle.includes("black and white") && ((state.lightType.primary && state.lightType.primary.includes("neon")) || (state.lightType.accent && state.lightType.accent.includes("neon")))) warnings.push("Ч/б стиль + неоновое освещение — неон не виден в ч/б.");
  // Text in MJ/SD
  if ((state.textContent || "").trim() && (state.aiModel === "midjourney" || state.aiModel === "stable-diffusion")) warnings.push("Midjourney и Stable Diffusion плохо рендерят текст. Для текста лучше Ideogram или DALL·E 3.");
  // Artistic format + camera/lens
  if (["oil painting", "pencil sketch", "pixel art", "watercolor", "anime style", "vector illustration"].includes(state.format) && (state.cameraBody || state.lens)) warnings.push(`Формат «${state.format}» + камера/объектив — нетипичная комбинация.`);
  // Pixel art + skin/hair detail
  if ((state.format === "pixel art" || state.format === "anime style") && (state.skinDetail.length || state.hairDetail.length)) warnings.push(`Формат «${state.format}» + фото-детализация кожи/волос — не применимо.`);
  // Abstract purpose + portrait settings
  if (["Logo Design", "UI Design", "Infographic"].includes(state.purpose) && (state.skinDetail.length || state.hairDetail.length || state.photoStyle)) warnings.push(`Назначение «${state.purpose}» + портретные настройки — нетипично.`);
  // Flat lay + wrong angle
  if (state.composition && state.composition.includes("flat lay") && state.angle && !state.angle.includes("drone") && !state.angle.includes("high angle") && !state.angle.includes("slightly high")) warnings.push("Flat Lay обычно снимается сверху — текущий угол несовместим.");
  // Drone + studio light
  if (state.angle && state.angle.includes("drone") && state.lightType.primary && (state.lightType.primary.includes("studio") || state.lightType.primary.includes("softbox") || state.lightType.primary.includes("clamshell"))) warnings.push("Дрон + студийное освещение — нетипичная комбинация.");
  // Night + day conflict
  const todP = state.timeOfDay.primary || "";
  const todA = state.timeOfDay.accent || "";
  const hasNight = todP.includes("night") || todA.includes("night");
  const hasDay = todP.includes("midday") || todA.includes("midday") || todP.includes("golden") || todA.includes("golden") || todP.includes("overcast") || todA.includes("overcast");
  if (hasNight && hasDay) warnings.push("Ночь + дневной свет — конфликтующая комбинация.");
  // f/1.2 + extreme wide
  if (state.aperture && state.aperture.includes("f/1.2") && state.composition && state.composition.includes("extreme wide")) warnings.push("f/1.2 + дальний план — нетипичная комбинация (обычно f/8-f/16).");
  // beforeAfter + seamlessPattern
  if (state.beforeAfter && state.seamlessPattern) warnings.push("Before/After + Seamless Pattern — взаимоисключающие режимы.");
  // Generate4 + 3x3
  if (state.generateFourMode && state.grid3x3Mode) warnings.push("Generate 4 + 3×3 Contact Sheet — взаимоисключающие режимы.");
  // Skin/Hair boost with non-portrait formats
  if (state.skinRenderBoost && isArtistic) warnings.push("Усиленная прорисовка кожи не совместима с форматом «" + state.format + "».");
  if (state.hairRenderBoost && isArtistic) warnings.push("Усиленная прорисовка волос не совместима с форматом «" + state.format + "».");
  // Consistency without reference images
  if (state.maxConsistency && !state.referenceImages.length) warnings.push("🔒 Макс. консистентность работает лучше всего с загруженными референсными изображениями.");
  // 3x3 + custom lens/angle/composition (if somehow still set)
  if (state.grid3x3Mode && (state.lens || state.angle || state.composition || state.aperture)) warnings.push("3×3 Contact Sheet переопределяет объектив, угол, план и диафрагму — ваш выбор будет проигнорирован.");
  // Generate4/3x3 + beforeAfter/seamless
  if ((state.generateFourMode || state.grid3x3Mode) && (state.beforeAfter || state.seamlessPattern)) warnings.push("Режим генерации несовместим с Before/After и Seamless Pattern.");

  const box = $("conflictWarnings");
  if (warnings.length) { box.style.display = "block"; box.innerHTML = "⚠️ <b>Возможные конфликты:</b><br>" + warnings.map(w => "• " + w).join("<br>") }
  else box.style.display = "none";
}

// FIX: safeCopy with visual feedback and fallback
function safeCopy(text, label, btn) {
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

function copyPrompt() {
  var text = $("promptOutput").textContent || "";
  if (!text.trim() || text.indexOf("Select parameters") >= 0 || text.indexOf("Выберите") >= 0) {
    notify("Сначала соберите промпт", "warn"); return;
  }
  safeCopy(text, "Промпт", this);
}

function copyJson() {
  try {
    var jsonData = buildJson();
    var text = JSON.stringify(jsonData, null, 2);
    if (!text || text === "{}" || text === "null") { notify("JSON пуст", "warn"); return; }
    safeCopy(text, "JSON", this);
  } catch (e) {
    notify("Ошибка JSON: " + e.message, "err");
  }
}

window.updatePrompt = updatePrompt; // Expose for verification
function updatePrompt() {
  const flat = buildFlatPrompt();
  $("promptOutput").textContent = flat;
  $("jsonOutput").textContent = JSON.stringify(buildJson(), null, 2);
  // checkConflicts();
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


export function buildJson() {
  return {
    schema: "vpe-prompt-builder-v2",
    model: state.aiModel || null,
    subject: state.mainSubject || "",
    prompt_flat: buildFlatPrompt(),
    prompt_midjourney: state.aiModel === "midjourney" ? buildMidjourneyPrompt() : undefined,
    technical: {
      aspect_ratio: state.aspectRatio || null,
      resolution: state.resolution || null
    },
    parameters: {
      purpose: state.purpose || null,
      format: state.format || null,
      medium: state.medium || null, // NEW
      mood: state.mood || null, // NEW
      camera: {
        body: state.cameraBody || null,
        lens: state.lens || null,
        shot_size: state.shotSize || null, // NEW
        focal_length: state.focalLength || null,
        aperture: state.aperture || null,
        angle: state.angle || null,
        composition: state.composition || null
      },
      lighting: {
        type: { primary: state.lightType.primary || null, accent: state.lightType.accent || null },
        time: { primary: state.timeOfDay.primary || null, accent: state.timeOfDay.accent || null },
        effects: state.lightFX,
        palette: state.colorPalette || null
      },
      materials: { skin: state.skinDetail, hair: state.hairDetail, objects: state.material },
      text: state.textContent ? { content: state.textContent, style: state.typography } : null,
      quality: state.quality || null,
      photo_style: state.photoStyle || null,
      cinema_style: state.cinemaStyle || null,
      director_style: state.directorStyle || null,
      art_style: state.artStyle || null,
      film_stock: state.filmStock || null,
      quick_style: state.quickStyle || null,
      fashion_food_style: state.fashionFoodStyle || null,
      emotion: state.emotion || null,
      cinematic_preset: state.cinematicPreset || null,
      audio: {
        ambience: state.ambience || null,
        foley: state.foley || null,
        cinematic_fx: state.cinematicFx || null
      }

export function applyPreset(index) {
  state.isStandardPresetActive = true;
  const p = presets[index];
  if (!p) return;
  const v = deepClone(p.values);
  if (window.expandRelatedSections) window.expandRelatedSections(v);

  // Reset all selectable state
  ["aiModel", "cameraBody", "aspectRatio", "resolution", "purpose", "format", "medium", "lens", "focalLength", "shotSize", "aperture", "angle", "composition", "quality", "colorPalette", "mood", "referenceType", "photoStyle", "cinemaStyle", "directorStyle", "artStyle", "filmStock", "quickStyle", "fashionFoodStyle", "emotion", "cinematicPreset", "ambience", "foley", "cinematicFx"].forEach(k => state[k] = "");
  state.lightType = { primary: "", accent: "" };
  state.timeOfDay = { primary: "", accent: "" };
  state.lightFX = []; state.colorPalette = ""; state.skinDetail = []; state.hairDetail = []; state.material = []; state.typography = [];

  // Apply from preset
  Object.entries(v).forEach(([k, val]) => {
    if (k === "lightType" || k === "timeOfDay") {
      state[k] = val && typeof val === "object" ? val : { primary: "", accent: "" };
      return;
    }
    if (!groupConfig[k]) return;
    const mode = groupConfig[k].mode;
    if (mode === "single") state[k] = val || "";
    if (mode === "multi") state[k] = Array.isArray(val) ? val : [];
  });

  // Backward compatibility: legacy presets stored shot-size in `composition`.
  if (!state.shotSize && state.composition) {
    const c = state.composition.toLowerCase();
    if (
      c.includes("close-up") ||
      c.includes("head and shoulders") ||
      c.includes("waist up") ||
      c.includes("full body") ||
      c.includes("extreme wide") ||
      c.includes("wide shot") ||
      c.includes("flat lay") ||
      c.includes("silhouette")
    ) {
      state.shotSize = state.composition;
    }
  }

  // Validate AR exists in buttons
  if (state.aspectRatio && !resolutionMap[state.aspectRatio]) {
    state.aspectRatio = ""; state.resolution = "";
    notify("AR из пресета не найден, сброшен", "warn");
  } else {
    state.resolution = "";
  }

  // Sync all UI buttons
  Object.keys(groupConfig).forEach(syncGroup);
  updateModelHint();
  rebuildResolution();
  updateAll();
  notify("Пресет «" + p.name.replace(/[^\w\sа-яёА-ЯЁ]/gi, "").trim() + "» применён");
}

// =============================================
// ACTIONS
// =============================================
// Reference extract handling
const REF_EXTRACT_OPTIONS = ["Лицо", "Палитру", "Позу", "Стиль", "Текстуру"];


export function buildJson() {
  return {
    schema: "vpe-prompt-builder-v2",
    model: state.aiModel || null,
    subject: state.mainSubject || "",
    prompt_flat: buildFlatPrompt(),
    prompt_midjourney: state.aiModel === "midjourney" ? buildMidjourneyPrompt() : undefined,
    technical: {
      aspect_ratio: state.aspectRatio || null,
      resolution: state.resolution || null
    },
    parameters: {
      purpose: state.purpose || null,
      format: state.format || null,
      medium: state.medium || null, // NEW
      mood: state.mood || null, // NEW
      camera: {
        body: state.cameraBody || null,
        lens: state.lens || null,
        shot_size: state.shotSize || null, // NEW
        focal_length: state.focalLength || null,
        aperture: state.aperture || null,
        angle: state.angle || null,
        composition: state.composition || null
      },
      lighting: {
        type: { primary: state.lightType.primary || null, accent: state.lightType.accent || null },
        time: { primary: state.timeOfDay.primary || null, accent: state.timeOfDay.accent || null },
        effects: state.lightFX,
        palette: state.colorPalette || null
      },
      materials: { skin: state.skinDetail, hair: state.hairDetail, objects: state.material },
      text: state.textContent ? { content: state.textContent, style: state.typography } : null,
      quality: state.quality || null,
      photo_style: state.photoStyle || null,
      cinema_style: state.cinemaStyle || null,
      director_style: state.directorStyle || null,
      art_style: state.artStyle || null,
      film_stock: state.filmStock || null,
      quick_style: state.quickStyle || null,
      fashion_food_style: state.fashionFoodStyle || null,
      emotion: state.emotion || null,
      cinematic_preset: state.cinematicPreset || null,
      audio: {
        ambience: state.ambience || null,
        foley: state.foley || null,
        cinematic_fx: state.cinematicFx || null
      }

export function applyPreset(index) {
  state.isStandardPresetActive = true;
  const p = presets[index];
  if (!p) return;
  const v = deepClone(p.values);
  if (window.expandRelatedSections) window.expandRelatedSections(v);

  // Reset all selectable state
  ["aiModel", "cameraBody", "aspectRatio", "resolution", "purpose", "format", "medium", "lens", "focalLength", "shotSize", "aperture", "angle", "composition", "quality", "colorPalette", "mood", "referenceType", "photoStyle", "cinemaStyle", "directorStyle", "artStyle", "filmStock", "quickStyle", "fashionFoodStyle", "emotion", "cinematicPreset", "ambience", "foley", "cinematicFx"].forEach(k => state[k] = "");
  state.lightType = { primary: "", accent: "" };
  state.timeOfDay = { primary: "", accent: "" };
  state.lightFX = []; state.colorPalette = ""; state.skinDetail = []; state.hairDetail = []; state.material = []; state.typography = [];

  // Apply from preset
  Object.entries(v).forEach(([k, val]) => {
    if (k === "lightType" || k === "timeOfDay") {
      state[k] = val && typeof val === "object" ? val : { primary: "", accent: "" };
      return;
    }
    if (!groupConfig[k]) return;
    const mode = groupConfig[k].mode;
    if (mode === "single") state[k] = val || "";
    if (mode === "multi") state[k] = Array.isArray(val) ? val : [];
  });

  // Backward compatibility: legacy presets stored shot-size in `composition`.
  if (!state.shotSize && state.composition) {
    const c = state.composition.toLowerCase();
    if (
      c.includes("close-up") ||
      c.includes("head and shoulders") ||
      c.includes("waist up") ||
      c.includes("full body") ||
      c.includes("extreme wide") ||
      c.includes("wide shot") ||
      c.includes("flat lay") ||
      c.includes("silhouette")
    ) {
      state.shotSize = state.composition;
    }
  }

  // Validate AR exists in buttons
  if (state.aspectRatio && !resolutionMap[state.aspectRatio]) {
    state.aspectRatio = ""; state.resolution = "";
    notify("AR из пресета не найден, сброшен", "warn");
  } else {
    state.resolution = "";
  }

  // Sync all UI buttons
  Object.keys(groupConfig).forEach(syncGroup);
  updateModelHint();
  rebuildResolution();
  updateAll();
  notify("Пресет «" + p.name.replace(/[^\w\sа-яёА-ЯЁ]/gi, "").trim() + "» применён");
}

// =============================================
// ACTIONS
// =============================================
// Reference extract handling
const REF_EXTRACT_OPTIONS = ["Лицо", "Палитру", "Позу", "Стиль", "Текстуру"];


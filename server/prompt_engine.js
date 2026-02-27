import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientLogicPath = path.join(__dirname, "client_logic.js");
const CLIENT_LOGIC = fs.readFileSync(clientLogicPath, "utf8");

/**
 * Create a permissive dummy DOM element that absorbs any property/method usage.
 */
function createDummyElement() {
  const handler = {
    get(target, prop) {
      if (prop === "classList") {
        return { add() { }, remove() { }, toggle() { }, contains() { return false; } };
      }
      if (prop === "style") return {};
      if (prop === "dataset") return {};
      if (prop === "files") return [];
      if (prop === "value") return "";
      if (prop === "checked") return false;
      if (prop === "textContent") return "";
      if (prop === "innerHTML") return "";
      if (prop === "addEventListener") return () => { };
      if (prop === "removeEventListener") return () => { };
      if (prop === "querySelector") return () => createDummyElement();
      if (prop === "querySelectorAll") return () => [];
      if (prop === "appendChild") return () => { };
      if (prop === "removeChild") return () => { };
      if (prop === "setAttribute") return () => { };
      if (prop === "getAttribute") return () => null;
      if (prop === "hasAttribute") return () => false;
      if (prop === "remove") return () => { };
      if (prop === "insertAdjacentElement") return () => { };
      if (prop === "click") return () => { };
      if (prop === "focus") return () => { };
      if (prop === "blur") return () => { };
      return target[prop];
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    }
  };
  return new Proxy({}, handler);
}

/**
 * Minimal DOM stubs to let the original client script define constants and builder functions.
 * We do not rely on any DOM-dependent behavior at runtime.
 */
function createSandbox() {
  const dummy = createDummyElement();

  const documentStub = {
    getElementById() { return dummy; },
    querySelector() { return dummy; },
    querySelectorAll() { return []; },
    createElement() { return dummy; },
    addEventListener() { },
    removeEventListener() { },
    body: dummy
  };

  const windowStub = {
    addEventListener() { },
    removeEventListener() { },
    location: { href: "" }
  };

  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    TextEncoder,
    TextDecoder,
    window: windowStub,
    document: documentStub,
    localStorage: {
      getItem() { return null; },
      setItem() { }
    },
    // Some scripts may refer to these:
    navigator: { userAgent: "node" },
    Intl,
    Math,
    Date,
  };

  // In browser code often assumes window === globalThis
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  return sandbox;
}

const sandbox = createSandbox();
const context = vm.createContext(sandbox);

// Execute the extracted browser logic once at startup.
vm.runInContext(CLIENT_LOGIC, context, { filename: "client_logic.js" });

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

// Snapshot pristine client state once; each compute request must start from this baseline.
const BASE_STATE = deepClone(context.state || {});

/**
 * Compute prompt and json output using the original builder functions (server-side).
 * IMPORTANT: anything that requires real DOM is not used here.
 */
export function computeFromState(stateInput) {
  // Rehydrate state from pristine defaults on each request to prevent cross-request leakage.
  // Important: mutate in-place to preserve references captured by client logic closures.
  if (!context.state) context.state = {};
  for (const key of Object.keys(context.state)) {
    delete context.state[key];
  }
  Object.assign(context.state, deepClone(BASE_STATE), stateInput || {});

  // Choose prompt format
  let promptText = "";
  const fmt = context.state.promptFormat || "flat";
  const model = context.state.aiModel || "";

  if (fmt === "midjourney") promptText = context.buildMidjourneyPrompt?.() ?? "";
  else if (fmt === "structured") promptText = context.buildStructuredPrompt?.() ?? "";
  else promptText = context.buildFlatPrompt?.() ?? "";

  // Append render boosts
  if (context.state.skinRenderBoost && context.SKIN_RENDER_CONFIG) {
    promptText += "\n\n" + context.SKIN_RENDER_CONFIG;
  }
  if (context.state.hairRenderBoost && context.HAIR_RENDER_CONFIG) {
    promptText += "\n\n" + context.HAIR_RENDER_CONFIG;
  }

  // Max consistency wrapper
  if (context.state.maxConsistency && context.MAX_CONSISTENCY_PREFIX) {
    promptText = context.MAX_CONSISTENCY_PREFIX + "\n" + promptText;
    if (model === "midjourney") {
      promptText = (promptText ?? "").trimEnd() + " --cw 100";
    }
  }

  // 3x3 wrapper
  if (context.state.grid3x3Mode && context.GRID_3X3_PREFIX) {
    promptText = context.GRID_3X3_PREFIX + promptText;
  }

  // Generate 4 wrapper (keep original branching, but without client-only bits)
  if (context.state.generateFourMode && context.GENERATE_FOUR_PREFIX) {
    const isNBP = ["nano-banana-pro", "nano-banana", "gemini-imagen"].includes(model);
    if (isNBP) {
      if (fmt === "structured" && context.buildG4ForNBP) {
        promptText = context.buildG4ForNBP(promptText);
      } else if (context.buildG4FlatForNBP) {
        promptText = context.buildG4FlatForNBP(promptText);
      } else {
        promptText = context.GENERATE_FOUR_PREFIX + "\n\n" + promptText;
      }
    } else {
      promptText = context.GENERATE_FOUR_PREFIX + "\n\n" + promptText;
    }
  }

  // JSON output
  const jsonObj = context.buildJson?.() ?? null;

  return { prompt: (promptText || "").trim(), json: jsonObj };
}

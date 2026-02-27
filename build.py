import os

with open('public/js/client_logic_full.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def get(start, end):
    return "".join(lines[start-1:end])

style_js = "import { state, $, notify } from './client_logic.js';\n\n"
style_js += "export " + get(206, 998)
style_js = style_js.replace("const groupConfig", "export const groupConfig")
style_js = style_js.replace("const FILM_STOCKS", "export const FILM_STOCKS")
style_js = style_js.replace("const EMOTIONS", "export const EMOTIONS")
style_js = style_js.replace("const presets", "export const presets")

style_js += "\\nexport " + get(2027, 2443)

iife_vars = get(2971, 3220)
iife_vars = iife_vars.replace("  const CINEMATIC_PRESETS", "export const CINEMATIC_PRESETS")
iife_vars = iife_vars.replace("  const ART_STYLES", "export const ART_STYLES")
iife_vars = iife_vars.replace("  const MEDIUM_OPTIONS", "export const MEDIUM_OPTIONS")
iife_vars = iife_vars.replace("  const MOOD_OPTIONS", "export const MOOD_OPTIONS")
iife_vars = iife_vars.replace("  const LIGHTING_OPTIONS", "export const LIGHTING_OPTIONS")
iife_vars = iife_vars.replace("  const COMPOSITION_OPTIONS", "export const COMPOSITION_OPTIONS")
iife_vars = iife_vars.replace("  const COLOR_PALETTE_OPTIONS", "export const COLOR_PALETTE_OPTIONS")
iife_vars = iife_vars.replace("  const CAMERA_OPTIONS", "export const CAMERA_OPTIONS")
iife_vars = iife_vars.replace("  const LENS_SYSTEMS", "export const LENS_SYSTEMS")
iife_vars = iife_vars.replace("  const FILM_STOCK_PATCH", "export const FILM_STOCK_PATCH")
iife_vars = iife_vars.replace("  const FILM_STOCK_DESCRIPTIONS", "export const FILM_STOCK_DESCRIPTIONS")
iife_vars = iife_vars.replace("  const AMBIENCE", "export const AMBIENCE")
iife_vars = iife_vars.replace("  const FOLEY", "export const FOLEY")
iife_vars = iife_vars.replace("  const CINE_FX", "export const CINE_FX")
iife_vars = iife_vars.replace("  const AMBIENCE_LABELS", "export const AMBIENCE_LABELS")
iife_vars = iife_vars.replace("  const FOLEY_LABELS", "export const FOLEY_LABELS")
iife_vars = iife_vars.replace("  const CINE_FX_LABELS", "export const CINE_FX_LABELS")

style_js += "\\n" + iife_vars

# functions
style_js += "\\nexport " + get(3222, 3320)

merge_iife = get(3323, 3395)
merge_iife = merge_iife.replace("(function mergeArtAndMediumSections() {", "export function mergeArtAndMediumSections() {").replace("})();", "}")
style_js += "\\n" + merge_iife

move_cam_iife = get(3396, 3404)
move_cam_iife = move_cam_iife.replace("(function moveCameraBlocksAfterResolution() {", "export function moveCameraBlocksAfterResolution() {").replace("})();", "}")
style_js += "\\n" + move_cam_iife

with open('public/js/style_manager.js', 'w', encoding='utf-8') as f:
    f.write(style_js)

print("Wrote style_manager.js")

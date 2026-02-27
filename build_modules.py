# build_modules.py
import re
import os

with open("public/js/client_logic_full.js", "r", encoding="utf-8") as f:
    text = f.read()

def extract(start_str, end_str=None):
    start = text.find(start_str)
    if start == -1: raise ValueError(f"Start not found: {start_str[:30]}")
    if end_str:
        end = text.find(end_str, start)
        if end == -1: raise ValueError(f"End not found: {end_str[:30]}")
        return text[start:end]
    return text[start:]

def write_f(path, content):
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

# We have 6 files to create.
# To avoid missing code, we will construct them exactly.

# STYLE_MANAGER
# Needs: groupConfig, FILM_STOCKS, EMOTIONS, presets, application logic for styles.
# Also applyConflictRules, ART_STYLES etc.
style_manager_code = """
// style_manager.js
import { state, $, notify } from './client_logic.js';

""" + extract("const resolutionMap =", "const MAX_CONSISTENCY_PREFIX =") + """
""" + extract("function applyConflictRules() {", "function applyPreset") + """
""" + extract("  const CINEMATIC_PRESETS = {", "ensureConfig();")

# We need to adapt the IIFE logic for ART_STYLES etc.
style_manager_code = style_manager_code.replace("  const CINEMATIC_PRESETS = {", "export const CINEMATIC_PRESETS = {")
style_manager_code = style_manager_code.replace("  const ART_STYLES = {", "export const ART_STYLES = {")
style_manager_code = style_manager_code.replace("  const MEDIUM_OPTIONS =", "export const MEDIUM_OPTIONS =")
style_manager_code = style_manager_code.replace("  const MOOD_OPTIONS =", "export const MOOD_OPTIONS =")
style_manager_code = style_manager_code.replace("  const LIGHTING_OPTIONS =", "export const LIGHTING_OPTIONS =")
style_manager_code = style_manager_code.replace("  const COMPOSITION_OPTIONS =", "export const COMPOSITION_OPTIONS =")
style_manager_code = style_manager_code.replace("  const COLOR_PALETTE_OPTIONS =", "export const COLOR_PALETTE_OPTIONS =")
style_manager_code = style_manager_code.replace("  const CAMERA_OPTIONS =", "export const CAMERA_OPTIONS =")
style_manager_code = style_manager_code.replace("  const LENS_SYSTEMS =", "export const LENS_SYSTEMS =")
style_manager_code = style_manager_code.replace("  const FILM_STOCK_PATCH =", "export const FILM_STOCK_PATCH =")
style_manager_code = style_manager_code.replace("  const FILM_STOCK_DESCRIPTIONS =", "export const FILM_STOCK_DESCRIPTIONS =")
style_manager_code = style_manager_code.replace("  const AMBIENCE =", "export const AMBIENCE =")
style_manager_code = style_manager_code.replace("  const AMBIENCE_LABELS =", "export const AMBIENCE_LABELS =")
style_manager_code = style_manager_code.replace("  const FOLEY =", "export const FOLEY =")
style_manager_code = style_manager_code.replace("  const FOLEY_LABELS =", "export const FOLEY_LABELS =")
style_manager_code = style_manager_code.replace("  const CINE_FX =", "export const CINE_FX =")
style_manager_code = style_manager_code.replace("  const CINE_FX_LABELS =", "export const CINE_FX_LABELS =")

# Convert top level constants
style_manager_code = style_manager_code.replace("const resolutionMap =", "export const resolutionMap =")
style_manager_code = style_manager_code.replace("const groupConfig =", "export const groupConfig =")
style_manager_code = style_manager_code.replace("const FILM_STOCKS =", "export const FILM_STOCKS =")
style_manager_code = style_manager_code.replace("const EMOTIONS =", "export const EMOTIONS =")
style_manager_code = style_manager_code.replace("const presets =", "export const presets =")
style_manager_code = style_manager_code.replace("function applyConflictRules() {", "export function applyConflictRules() {")

# To handle UI injects
style_manager_code += """
export function injectNewSections() {
""" + extract("function injectNewSections() {", "ensureConfig();").replace("function injectNewSections() {\n", "") + """
export function mergeArtAndMediumSections() {
""" + extract("function mergeArtAndMediumSections() {", "(function moveCameraBlocksAfterResolution").replace("function mergeArtAndMediumSections() {\n", "") + """
export function moveCameraBlocksAfterResolution() {
""" + extract("function moveCameraBlocksAfterResolution() {", "})();\n\n\n/* ===== SCRIPT TAG SPLIT ===== */").replace("function moveCameraBlocksAfterResolution() {\n", "")

write_f("public/js/style_manager.js", style_manager_code)

print("Created style_manager.js")

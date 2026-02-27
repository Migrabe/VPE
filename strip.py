import os
import re

with open('public/js/client_logic_full.js', 'r', encoding='utf-8') as f:
    text = f.read()

def extract_and_delete(start_marker, end_marker):
    global text
    start = text.find(start_marker)
    if start == -1: return ""
    end = text.find(end_marker, start)
    if end == -1: end = len(text)
    
    chunk = text[start:end]
    text = text[:start] + text[end:]
    return chunk

# 1. Strip Style Manager
style_consts = extract_and_delete("const resolutionMap =", "const MAX_CONSISTENCY_PREFIX =")
apply_conflicts = extract_and_delete("function applyConflictRules() {", "function applyPreset(index)")

# The IIFE for injectNewSections etc...
iife_start = text.find("  const CINEMATIC_PRESETS = {")
iife_end = text.find("})();\n\n\n/* ===== SCRIPT TAG SPLIT ===== */")
if iife_start != -1 and iife_end != -1:
    iife = text[iife_start:iife_end+4]
    text = text[:iife_start] + text[iife_end+4:]

# 2. Extract Template Manager
def extract_func(func_name):
    global text
    # Support "async function" as well
    match = re.search(r"(async\s+)?function\s+" + func_name + r"\s*\([^)]*\)\s*\{", text)
    if not match: return ""
    start = match.start()
    
    braces = 0
    in_str = False
    escape = False
    str_char = ''
    i = start
    first_brace = False
    
    while i < len(text):
        c = text[i]
        if escape:
            escape = False
        elif c == '\\':
            escape = True
        elif in_str:
            if c == str_char:
                in_str = False
        elif c in "\"'`":
            in_str = True
            str_char = c
        elif c == '{':
            braces += 1
            first_brace = True
        elif c == '}':
            braces -= 1
            if braces == 0 and first_brace:
                chunk = text[start:i+1]
                text = text[:start] + text[i+1:]
                return chunk
        i += 1
    return ""

# TEMPLATE MANAGER
tmpl_funcs = ["setPromptFormat", "buildG4ForNBP", "buildG4FlatForNBP", "buildMidjourneyPrompt", 
              "buildStructuredPrompt", "appendNegativeLast", "buildJson", "buildFlatPrompt", "applyPreset"]

tmpl_code = "import { state, wordCount, countParams, deepClone, $, notify, updateModelHint, updateAll, rebuildResolution, syncGroup } from './client_logic.js';\n"
tmpl_code += "import { groupConfig, presets, resolutionMap, FILM_STOCKS, EMOTIONS } from './style_manager.js';\n\n"

for f_name in tmpl_funcs:
    code = extract_func(f_name)
    if code:
        tmpl_code += "export " + code + "\n\n"
    else:
        print(f"Warning: {f_name} not found")

with open('public/js/template_manager.js', 'w', encoding='utf-8') as f:
    f.write(tmpl_code)

# EXPORT/IMPORT
ei_funcs = ["safeCopy", "fallbackCopy", "copyPrompt", "copyJson", "savePrompt", "enhancePrompt", "callGemini", "callGroq"]

ei_code = "import { state, $, notify } from './client_logic.js';\n"
ei_code += "import { buildJson, buildFlatPrompt } from './template_manager.js';\n\n"

for f_name in ei_funcs:
    code = extract_func(f_name)
    if code:
        ei_code += ("export " if "function" in code else "") + code + "\n\n"
    else:
        print(f"Warning: {f_name} not found")

with open('public/js/export_import.js', 'w', encoding='utf-8') as f:
    f.write(ei_code)
    
# Clean up remaining text to be client_logic.js
prefix = "import { setPromptFormat, applyPreset, buildFlatPrompt, buildStructuredPrompt, buildMidjourneyPrompt, buildJson } from './template_manager.js';\n"
prefix += "import { applyConflictRules } from './style_manager.js';\n"
prefix += "import { copyPrompt, copyJson, savePrompt, enhancePrompt } from './export_import.js';\n\n"

text = text.replace("const $ = ", "export const $ = ")
text = text.replace("const esc = ", "export const esc = ")
text = text.replace("function notify(", "export function notify(")
text = text.replace("function wordCount(", "export function wordCount(")
text = text.replace("function countParams(", "export function countParams(")
text = text.replace("function deepClone(", "export function deepClone(")
text = text.replace("const state = {", "export const state = {")
text = text.replace("function updateAll(", "export function updateAll(")
text = text.replace("function syncGroup(", "export function syncGroup(")
text = text.replace("function rebuildResolution(", "export function rebuildResolution(")
text = text.replace("function updateModelHint(", "export function updateModelHint(")
text = text.replace("function handleImageUpload(", "export function handleImageUpload(")
text = text.replace("function removeImage(", "export function removeImage(")
text = text.replace("function rebuildImageCards(", "export function rebuildImageCards(")

text = prefix + text

with open('public/js/client_logic.js', 'w', encoding='utf-8') as f:
    f.write(text)

print("Split complete!")

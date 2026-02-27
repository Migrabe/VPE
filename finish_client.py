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

def extract_func(func_name):
    global text
    match = re.search(r"(async\s+)?function\s+" + func_name + r"\s*\([^)]*\)\s*\{", text)
    if not match: return ""
    start = match.start()
    
    braces = 0
    in_str = False; escape = False; str_char = ''; i = start; first_brace = False
    while i < len(text):
        c = text[i]
        if escape: escape = False
        elif c == '\\': escape = True
        elif in_str:
            if c == str_char: in_str = False
        elif c in "\"'`": in_str = True; str_char = c
        elif c == '{': braces += 1; first_brace = True
        elif c == '}':
            braces -= 1
            if braces == 0 and first_brace:
                chunk = text[start:i+1]
                text = text[:start] + text[i+1:]
                return chunk
        i += 1
    return ""

def remove_funcs(names):
    for f in names:
        extract_func(f)

# 1. Remove style manager blocks
extract_and_delete("const resolutionMap =", "const MAX_CONSISTENCY_PREFIX =")
extract_and_delete("function applyConflictRules() {", "function applyPreset(index)")
ui_logic_iife = extract_and_delete("  const CINEMATIC_PRESETS = {", "/* ===== SCRIPT TAG SPLIT ===== */")

# 2. Remove template manager blocks
remove_funcs(["setPromptFormat", "buildG4ForNBP", "buildG4FlatForNBP", "buildMidjourneyPrompt", 
              "buildStructuredPrompt", "appendNegativeLast", "buildJson", "buildFlatPrompt", "applyPreset"])

# 3. Remove export/import blocks
remove_funcs(["safeCopy", "fallbackCopy", "copyPrompt", "copyJson", "savePrompt", "enhancePrompt", "callGemini", "callGroq"])

# 4. Remove history manager
remove_funcs(["resetAll"])

# 5. Remove event handlers
remove_funcs(["bindEvents"])
# Note: we already removed the IIFE logic via extract_and_delete

# Now text is what remains for client_logic.js
prefix = """import { setPromptFormat, applyPreset, buildFlatPrompt, buildStructuredPrompt, buildMidjourneyPrompt, buildJson } from './template_manager.js';
import { applyConflictRules } from './style_manager.js';
import { copyPrompt, copyJson, savePrompt, enhancePrompt } from './export_import.js';
import { resetAll } from './history_manager.js';
import { bindEvents, initCollapsible } from './event_handlers.js';

"""

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
text = text.replace("function compactPrompt(", "export function compactPrompt(")
text = text.replace("function handleInput(", "export function handleInput(")
text = text.replace("function handleSelect(", "export function handleSelect(")
text = text.replace("function addNegative(", "export function addNegative(")

text = prefix + text

with open('public/js/client_logic.js', 'w', encoding='utf-8') as f:
    f.write(text)

print("Split logic generated client_logic.js successfully.")

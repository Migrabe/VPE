import os

with open('public/js/client_logic_full.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def get(start, end):
    return "".join(lines[start-1:end])

# --- template_manager.js ---
tmpl = "import { state, wordCount, countParams, deepClone, $, notify, updateModelHint, updateAll, rebuildResolution, syncGroup } from './client_logic.js';\n"
tmpl += "import { presets, groupConfig, FILM_STOCKS, EMOTIONS } from './style_manager.js';\n\n"
tmpl += get(1073, 1084) # setPromptFormat
tmpl = tmpl.replace("function setPromptFormat", "export function setPromptFormat")
tmpl += get(1120, 1421) # some strings mapped, and then buildFlatPrompt starts at 1120? WAIT! Let's check line 1120.

# Wait, I made a mistake in lines. I don't know the exact lines for everything anymore without checking.

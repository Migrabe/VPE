import os

with open('public/js/client_logic_full.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def get(start, end):
    return "".join(lines[start-1:end])

# 1. HISTORY MANAGER
hist_js = "import { state, $, updateAll, notify } from './client_logic.js';\n\n"
hist_js += "export " + get(2649, 2736)

with open('public/js/history_manager.js', 'w', encoding='utf-8') as f:
    f.write(hist_js)
print("Wrote history_manager.js")

# 2. EVENT HANDLERS (fixed bounds)
events_js = "import { state, $, updateAll, notify } from './client_logic.js';\n"
events_js += "import { applyPreset, buildFlatPrompt } from './template_manager.js';\n"
events_js += "import { copyPrompt, copyJson, savePrompt, enhancePrompt } from './export_import.js';\n"
events_js += "import { resetAll } from './history_manager.js';\n\n"

# bindEvents Function
events_code = get(496, 600)
events_code = events_code.replace("function handleImageUpload", "import { handleImageUpload } from './client_logic.js';\n// function handleImageUpload") 
events_js += "export " + events_code

# UI Logic IIFE (lines 2818 to 2962)
ui_logic = get(2818, 2962)
ui_logic = ui_logic.replace("(function () {", "")
ui_logic = ui_logic.replace("})();", "")
ui_logic = ui_logic.replace("function toggleSection", "export function toggleSection")
ui_logic = ui_logic.replace("function initCollapsible", "export function initCollapsible")
ui_logic = ui_logic.replace("window.expandRelatedSections = function", "export function expandRelatedSections")
ui_logic = ui_logic.replace("window.expandSectionsForQuickStyle = function", "export function expandSectionsForQuickStyle")
events_js += ui_logic

with open('public/js/event_handlers.js', 'w', encoding='utf-8') as f:
    f.write(events_js)
print("Wrote event_handlers.js")

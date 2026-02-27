import os

with open('public/js/client_logic_full.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def get(start, end):
    return "".join(lines[start-1:end])

events_js = "import { state, $, updateAll, notify } from './client_logic.js';\n"
events_js += "import { applyPreset, buildFlatPrompt } from './template_manager.js';\n"
events_js += "import { copyPrompt, copyJson, savePrompt, enhancePrompt } from './export_import.js';\n\n"

# bindEvents
events_js += "export " + get(496, 600)

# The IIFE for UI logic
# Includes toggleSection, initCollapsible, window.expandRelatedSections, window.expandSectionsForQuickStyle
# Let's just find them and extract.
# Lines 2848 to 2962
ui_logic = get(2848, 2962)
# Remove the IIFE wrapper
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

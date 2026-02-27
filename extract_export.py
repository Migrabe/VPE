with open('public/js/client_logic_full.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def get(start, end):
    return "".join(lines[start-1:end])

ei_code = "import { state, $, notify } from './client_logic.js';\n"
ei_code += "import { buildJson, buildFlatPrompt } from './template_manager.js';\n\n"
ei_code += "export " + get(2572, 2609) # safeCopy, fallbackCopy
ei_code += "export " + get(2611, 2621) # copyPrompt
ei_code += "export " + get(2623, 2633) # copyJson
ei_code += "export " + get(2635, 2647) # savePrompt

cg = get(2649, 2926) # callGemini, callGroq
cg = cg.replace("async function callGemini", "export async function callGemini")
cg = cg.replace("async function callGroq", "export async function callGroq")
ei_code += "\n" + cg

ei_code += "\nexport " + get(2928, 2969) # enhancePrompt

with open('public/js/export_import.js', 'w', encoding='utf-8') as f:
    f.write(ei_code)
print("Wrote export_import.js")

with open('public/js/template_manager.js', 'a', encoding='utf-8') as f:
    f.write("\nexport " + get(1486, 1533)) # buildJson
    f.write("\nexport " + get(2448, 2511)) # applyPreset
print("Appended missing functions to template_manager.js")

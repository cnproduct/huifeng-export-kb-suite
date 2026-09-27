#!/usr/bin/env python3
"""
scripts/webmcp_annotator.py
Injects WebMCP (Web Model Context Protocol) declarative HTML attributes into forms
and interactive elements for autonomous AI agents (Chrome AI / OpenAI Operator / Google Jarvis).
Enables:
  - toolname="<uniqueActionName>"
  - tooldescription="<natural language explanation for LLMs>"
  - toolautosubmit
  - toolparamdescription="<parameter schema hint on inputs>"
"""

import re
import argparse
from bs4 import BeautifulSoup

def annotate_form(html_path: str, form_id: str, tool_name: str, tool_desc: str, auto_submit: bool = True):
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()

    soup = BeautifulSoup(content, "html.parser")
    form = soup.find("form", id=form_id)
    if not form:
        print(f"❌ Form with id='{form_id}' not found in {html_path}")
        return

    # Add attributes
    form["toolname"] = tool_name
    form["tooldescription"] = tool_desc
    if auto_submit:
        form["toolautosubmit"] = ""

    # Annotate inputs
    for inp in form.find_all(["input", "select", "textarea"]):
        name = inp.get("name") or inp.get("id", "")
        if name and not inp.get("toolparamdescription"):
            label = soup.find("label", attrs={"for": inp.get("id")})
            desc = label.get_text().strip() if label else f"Parameter value for {name}"
            inp["toolparamdescription"] = desc

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(str(soup))

    print(f"✅ Form '{form_id}' annotated with toolname='{tool_name}' and WebMCP metadata!")

def main():
    parser = argparse.ArgumentParser(description="WebMCP Declarative HTML Form Annotator")
    parser.add_argument("--file", required=True, help="HTML file path")
    parser.add_argument("--form-id", required=True, help="ID of form to annotate")
    parser.add_argument("--tool-name", required=True, help="WebMCP Tool Name")
    parser.add_argument("--tool-desc", required=True, help="Natural language description of action")
    args = parser.parse_args()

    annotate_form(args.file, args.form_id, args.tool_name, args.tool_desc)

if __name__ == "__main__":
    main()

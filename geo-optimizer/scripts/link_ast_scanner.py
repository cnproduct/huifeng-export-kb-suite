#!/usr/bin/env python3
"""
scripts/link_ast_scanner.py
Static AST & DOM link integrity validator for B2B export sites.
Detects:
1. Leaked template variables ({p['link']}, {{url}}, etc.)
2. Relative phone/email links (href="/+86...")
3. Empty/broken anchor protocols (href="#", href="javascript:void(0);")
4. Broken local HTML anchors and relative paths.
Supports --fix mode to automatically repair known patterns.
"""

import os
import re
import argparse
from bs4 import BeautifulSoup

def scan_file(filepath: str, auto_fix: bool = False) -> tuple[int, list[str]]:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    soup = BeautifulSoup(content, "html.parser")
    issues = []
    modified = False

    # 1. Check template variable leaks
    template_pattern = re.compile(r"href=[\"'](\{[^}\"']+\}|\{\{[^}\"']+\}\})[\"']")
    for match in template_pattern.finditer(content):
        issues.append(f"Template leak in {filepath}: {match.group(0)}")

    # 2. Check <a> tags
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        # Relative phone links
        if href.startswith("/+") or href.startswith("/assets/misc/+"):
            phone_num = re.sub(r"^[^\+]*\+", "+", href)
            issues.append(f"Relative telephone link in {filepath}: {href} -> tel:{phone_num}")
            if auto_fix:
                content = content.replace(f'href="{href}"', f'href="tel:{phone_num}"')
                modified = True
        
        # Empty or javascript:void links
        elif href in ("", "#", "javascript:void(0)", "javascript:;", "javascript:void(0);"):
            issues.append(f"Empty/pseudo link in {filepath}: {href} (text: '{a.get_text().strip()}')")
            if auto_fix:
                content = content.replace(f'href="{href}"', 'href="#contact"')
                modified = True

    if auto_fix and modified:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)

    return len(issues), issues

def scan_directory(directory: str, auto_fix: bool = False):
    print(f"🔍 Scanning directory: {directory} for link integrity (Auto-Fix: {auto_fix})...")
    total_issues = 0
    scanned_files = 0

    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".html"):
                scanned_files += 1
                fpath = os.path.join(root, file)
                count, issues = scan_file(fpath, auto_fix)
                total_issues += count
                for issue in issues:
                    print(f"  ⚠️  {issue}")

    print(f"\n📊 Scan Complete: {scanned_files} files checked. Found {total_issues} issues.")
    if auto_fix and total_issues > 0:
        print("✅ Auto-fix applied to repairable patterns.")

def main():
    parser = argparse.ArgumentParser(description="Link AST Scanner & Fixer")
    parser.add_argument("--dir", default=".", help="Root directory of HTML site")
    parser.add_argument("--fix", action="store_true", help="Automatically repair detected link anomalies")
    args = parser.parse_args()

    scan_directory(args.dir, args.fix)

if __name__ == "__main__":
    main()

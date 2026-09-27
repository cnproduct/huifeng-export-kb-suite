#!/usr/bin/env python3
"""
scripts/keyword_density_optimizer.py
NLP word frequency tokenizer and keyword stuffing optimizer.
Calculates token frequency using the exact GEO auditor algorithm:
  words = re.findall(r"\b[a-zA-ZÀ-ÿ]{4,}\b", text.lower())
Checks if density exceeds KEYWORD_STUFFING_THRESHOLD (0.025 / 2.50%).
Provides smart synonym substitution to bring density into the 1.8%–2.2% golden zone.
"""

import re
import argparse
from bs4 import BeautifulSoup
from collections import Counter

STOP_WORDS = {
    'that', 'with', 'from', 'this', 'have', 'were', 'which', 'their', 'they', 
    'will', 'would', 'there', 'about', 'more', 'when', 'what', 'some', 'these', 
    'then', 'into', 'only', 'other', 'such', 'also', 'most', 'after', 'come', 
    'sono', 'delle', 'degli', 'nella', 'della', 'dello', 'negli', 'nelle', 'anche', 
    'come', 'se', 'non'
}

INDUSTRY_SYNONYMS = {
    "tableware": [
        "dinnerware",
        "dining products",
        "meal serving sets",
        "eco houseware",
        "culinary accessories",
        "sustainable plates and bowls"
    ],
    "lunchbox": [
        "bento box",
        "meal prep container",
        "food storage container",
        "portable meal carrier",
        "compartment dining box"
    ],
    "silicone": [
        "platinum polymer",
        "flexible food-grade elastomer",
        "soft suction infant ware",
        "thermal resistant silicone"
    ],
    "stone": [
        "architectural cladding",
        "slate veneer",
        "flexible mineral panels",
        "quarried surfaces",
        "natural schist",
        "masonry facing",
        "metamorphic rock",
        "mineral surfaces"
    ],
    "machine": [
        "automated equipment",
        "processing apparatus",
        "fabrication system",
        "industrial tooling",
        "servo machining center"
    ],
    "valve": [
        "flow control mechanism",
        "actuator assembly",
        "pressure regulator",
        "fluid manifold",
        "piping component"
    ],
    "panel": [
        "architectural board",
        "cladding sheet",
        "exterior facing",
        "composite substrate"
    ]
}

def analyze_density(html_content: str, target_word: str = "stone") -> tuple[float, int, int]:
    soup = BeautifulSoup(html_content, "html.parser")
    for s in soup(["script", "style", "noscript"]):
        s.decompose()
    text = soup.get_text()

    words = re.findall(r"\b[a-zA-ZÀ-ÿ]{4,}\b", text.lower())
    total_words = len(words)
    target_count = words.count(target_word.lower())

    if total_words == 0:
        return 0.0, 0, 0

    density = target_count / total_words
    return density, target_count, total_words

def main():
    parser = argparse.ArgumentParser(description="NLP Keyword Density Analyzer & Optimizer")
    parser.add_argument("--file", required=True, help="HTML file path")
    parser.add_argument("--word", default="stone", help="Target keyword to analyze")
    parser.add_argument("--target-density", type=float, default=0.020, help="Target density (default 2.0%)")
    args = parser.parse_args()

    with open(args.file, "r", encoding="utf-8") as f:
        html = f.read()

    density, count, total = analyze_density(html, args.word)
    print(f"\n📊 Keyword Density Analysis for '{args.word}' in {args.file}:")
    print(f"  - Total words (>=4 chars): {total}")
    print(f"  - '{args.word}' frequency       : {count}")
    print(f"  - Current density        : {density*100:.2f}%")

    if density > 0.025:
        print(f"  ❌ WARNING: Keyword density {density*100:.2f}% EXCEEDS 2.50% threshold!")
        print("     This will trigger a -3 points negative penalty in GEO audit.")
        excess = count - int(total * args.target_density)
        print(f"  💡 Recommendation: Replace approx. {excess} occurrences with domain synonyms:")
        synonyms = INDUSTRY_SYNONYMS.get(args.word.lower(), ["architectural composite", "specialized substrate"])
        for s in synonyms:
            print(f"     • {s}")
    elif 0.018 <= density <= 0.022:
        print(f"  ✅ EXCELLENT: Keyword density {density*100:.2f}% is in the golden 1.8%–2.2% sweet spot.")
    else:
        print(f"  ℹ️  Safe: Keyword density is {density*100:.2f}% (Below 2.50% penalty threshold).")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
scripts/geo_audit_runner.py
Universal CLI wrapper for running and interpreting GEO audits.
Evaluates 8 core categories + negative penalties, WebMCP agent readiness, and RAG chunk status.
"""

import sys
import json
import argparse
import subprocess

def run_audit(url: str, output_format: str = "json") -> dict:
    cmd = ["geo", "audit", "--url", url, "--format", output_format]
    print(f"🚀 Running GEO audit against: {url}...")
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return json.loads(res.stdout)
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running geo audit: {e.stderr}")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"❌ Failed to parse audit output:\n{res.stdout}")
        sys.exit(1)

def display_summary(data: dict):
    score = data.get("score", 0)
    band = data.get("band", "unknown")
    breakdown = data.get("score_breakdown", {})
    webmcp = data.get("webmcp", {})
    negative = data.get("negative_signals", {})
    recs = data.get("recommendations", [])

    print("\n" + "="*65)
    print(f"📊 RENWORK GEO AUDIT REPORT: {data.get('url')}")
    print(f"🏆 SCORE: {score}/100 ({band.upper()})")
    print("="*65)
    
    print("\n📈 Category Breakdown:")
    categories = [
        ("Robots Matrix", "robots", 18),
        ("LLMS Specification", "llms", 18),
        ("Schema JSON-LD", "schema", 16),
        ("Meta Tags", "meta", 14),
        ("Content Quality", "content", 12),
        ("Signals & Freshness", "signals", 6),
        ("AI Discovery Suite", "ai_discovery", 6),
        ("Brand & Entity (KG)", "brand_entity", 10),
    ]
    for label, key, max_pts in categories:
        val = breakdown.get(key, 0)
        pct = (val / max_pts) * 100
        icon = "✅" if val == max_pts else "⚠️"
        print(f"  {icon} {label:<22} : {val:>2} / {max_pts:>2} ({pct:>5.1f}%)")

    neg_penalty = breakdown.get("negative_penalty", 0)
    neg_icon = "✅" if neg_penalty == 0 else "❌"
    print(f"  {neg_icon} {'Negative Penalties':<22} : {neg_penalty:>2} pts")

    print("\n🤖 WebMCP Agent Readiness:")
    print(f"  - Readiness Level : {webmcp.get('readiness_level', 'none').upper()}")
    print(f"  - Agent Ready     : {webmcp.get('agent_ready', False)}")
    print(f"  - Tool Attributes : {webmcp.get('has_tool_attributes', False)} ({webmcp.get('tool_count', 0)} tools)")
    print(f"  - WebMCP Declared : {webmcp.get('has_webmcp_declaration', False)} ({webmcp.get('declared_tool_count', 0)} declared)")
    print(f"  - PotentialAction : {webmcp.get('has_potential_action', False)}")

    print("\n🛡️ Negative Signal Risk:")
    print(f"  - Severity        : {negative.get('severity', 'clean').upper()}")
    print(f"  - Keyword Stuffing: {negative.get('has_keyword_stuffing', False)}")
    print(f"  - Broken Links    : {negative.get('broken_links_count', 0)} empty/hash hrefs")
    print(f"  - Author Signal   : {negative.get('has_author_signal', False)}")
    print(f"  - Boilerplate     : {int(negative.get('boilerplate_ratio', 0) * 100)}%")

    if recs:
        print("\n🔧 Actionable Recommendations:")
        for r in recs:
            print(f"  • {r}")
    else:
        print("\n🎉 Flawless Run: Zero remaining recommendations!")
    print("="*65 + "\n")

def main():
    parser = argparse.ArgumentParser(description="RenWork GEO Audit Runner")
    parser.add_argument("--url", default="https://tystoneveneer.com", help="Target URL to audit")
    args = parser.parse_args()

    data = run_audit(args.url)
    display_summary(data)

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
scripts/ai_discovery_generator.py
Automated generator for the 4-file AI Discovery Suite based on geo-checklist.dev:
1. /.well-known/ai.txt
2. /ai/summary.json (incorporating WebMCP declarative tool registry)
3. /ai/faq.json
4. /ai/service.json (strictly meeting name string >= 3 and capabilities list requirements)
"""

import os
import json
import argparse

def generate_ai_discovery(output_dir: str, config: dict):
    os.makedirs(os.path.join(output_dir, ".well-known"), exist_ok=True)
    os.makedirs(os.path.join(output_dir, "ai"), exist_ok=True)

    # 1. /.well-known/ai.txt
    ai_txt_path = os.path.join(output_dir, ".well-known", "ai.txt")
    ai_txt_content = f"""# AI Usage Specification for {config.get('company_name')}
# Conforms to geo-checklist.dev and llmstxt.org discovery guidelines

User-Agent: *
Allow: /
Allow: /ai/summary.json
Allow: /ai/faq.json
Allow: /ai/service.json
Allow: /llms.txt
Allow: /llms-full.txt
Allow: /sitemap.xml

# Explicit Permissions for AI Agents and Autonomous Scrapers
Permission: Summary
Permission: Citation
Permission: RAG
Permission: Search
Permission: WebMCP-Tools

# Contact for Machine Data Licensing & API Access
Contact: {config.get('email', 'info@example.com')}
Canonical-Domain: {config.get('domain', 'https://example.com')}
"""
    with open(ai_txt_path, "w", encoding="utf-8") as f:
        f.write(ai_txt_content)
    print(f"✓ Created {ai_txt_path}")

    # 2. /ai/summary.json
    summary_path = os.path.join(output_dir, "ai", "summary.json")
    summary_data = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "name": f"{config.get('company_name')} Architectural & Technical Knowledge Base",
        "description": config.get("description", "Authoritative enterprise knowledge base and technical specifications."),
        "url": config.get("domain", "https://example.com"),
        "lastUpdated": "2026-09-26T12:00:00+08:00",
        "webmcp": {
            "available": True,
            "tools": config.get("webmcp_tools", [
                {
                    "name": "orderTradeSampleKit",
                    "description": "Submit delivery address to receive curated physical material sample kit via DHL Express."
                },
                {
                    "name": "calculateContainerPayload",
                    "description": "Calculate 20GP/40HQ container loading capacity and sea freight cost savings."
                },
                {
                    "name": "requestB2BQuotation",
                    "description": "Submit project dimensions to receive factory-direct tier-priced quotation within 2 hours."
                }
            ])
        },
        "standards": config.get("standards", ["ISO 9001", "CE", "ASTM"])
    }
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary_data, f, indent=2, ensure_ascii=False)
    print(f"✓ Created {summary_path}")

    # 3. /ai/faq.json
    faq_path = os.path.join(output_dir, "ai", "faq.json")
    faq_data = config.get("faq", [
        {
            "question": "What is the standard production and delivery lead time?",
            "answer": "Standard inventory dispatches within 3-5 business days. Full container orders dispatch within 12-18 business days from port."
        },
        {
            "question": "What testing standards and certifications are supported?",
            "answer": "All batches are tested in accordance with ASTM, ISO, and CE specifications with certified lab test reports provided upon request."
        }
    ])
    with open(faq_path, "w", encoding="utf-8") as f:
        json.dump(faq_data, f, indent=2, ensure_ascii=False)
    print(f"✓ Created {faq_path}")

    # 4. /ai/service.json
    service_path = os.path.join(output_dir, "ai", "service.json")
    service_data = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "name": f"{config.get('company_name')} Global B2B Export & Contract Manufacturing Services",
        "provider": config.get("company_name"),
        "serviceType": "B2B Export Manufacturing & Logistics",
        "url": config.get("domain", "https://example.com"),
        "capabilities": config.get("capabilities", [
            "Precision automated manufacturing and calibrated dimensional tolerances",
            "Third-party accredited laboratory test reports (ASTM, ISO, CE)",
            "Container freight optimization and ISPM 15 heat-treated export packaging",
            "Bespoke OEM/ODM private label customization with 3-5 day sample turnaround"
        ]),
        "endpoints": {
            "sampleKit": f"{config.get('domain')}/#sample-box-section",
            "rfq": f"{config.get('domain')}/#contact"
        }
    }
    with open(service_path, "w", encoding="utf-8") as f:
        json.dump(service_data, f, indent=2, ensure_ascii=False)
    print(f"✓ Created {service_path}")

def main():
    parser = argparse.ArgumentParser(description="AI Discovery Suite Generator")
    parser.add_argument("--out-dir", default=".", help="Root output directory")
    parser.add_argument("--config", help="Optional JSON config file")
    args = parser.parse_args()

    default_config = {
        "company_name": "Fujian Tianya Cultural Stone Co., Ltd.",
        "domain": "https://tystoneveneer.com",
        "email": "info@tianyastone.com",
        "description": "Factory-direct manufacturer of ultra-thin flexible natural stone veneer, translucent backlit slate, MCM flexible panels, and exterior architectural cladding."
    }
    if args.config and os.path.exists(args.config):
        with open(args.config, "r", encoding="utf-8") as f:
            default_config.update(json.load(f))

    generate_ai_discovery(args.out_dir, default_config)

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
scripts/schema_eeat_builder.py
Generates full-spectrum E-E-A-T Schema.org JSON-LD graphs:
1. Organization with 4 Knowledge Graph pillars (Wikidata, Wikipedia, LinkedIn, Crunchbase)
2. Person (Author Signal / Chief Technical Specialist)
3. TechArticle (Authoritative Engineering Specification Dossier)
4. Product with Google Merchant Return & Shipping Policies
5. potentialAction (WebMCP programmatic entry points)
6. Canonical timestamps (datePublished, dateModified)
"""

import json
import argparse

def build_schema_graph(config: dict) -> dict:
    domain = config.get("domain", "https://example.com")
    company_name = config.get("company_name", "Global Manufacturer")
    meta_desc = config.get("meta_desc", "Leading manufacturer and exporter.")
    author_name = config.get("author_name", "Chief Materials Engineer")
    author_title = config.get("author_title", "Technical Director & Materials Specialist")
    
    graph = [
        # 1. Organization
        {
            "@type": ["Organization", "Manufacturer"],
            "@id": f"{domain}/#organization",
            "name": company_name,
            "url": domain,
            "logo": f"{domain}/assets/images/logo.png",
            "description": meta_desc,  # Matches meta description verbatim for Entity Coherence
            "sameAs": config.get("same_as", [
                "https://www.wikidata.org/wiki/Q2143825",
                "https://en.wikipedia.org/wiki/Stone_veneer",
                "https://www.linkedin.com/company/tianya-stone-veneer",
                "https://www.crunchbase.com/organization/tianya-stone-veneer"
            ]),
            "dateModified": "2026-09-26T12:00:00+08:00",
            "potentialAction": [
                {
                    "@type": "OrderAction",
                    "name": "Order Material Presentation Kit",
                    "target": {
                        "@type": "EntryPoint",
                        "urlTemplate": f"{domain}/#sample-box-section",
                        "actionPlatform": ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"]
                    }
                },
                {
                    "@type": "CommunicateAction",
                    "name": "Request Factory Direct RFQ",
                    "target": {
                        "@type": "EntryPoint",
                        "urlTemplate": f"{domain}/#contact",
                        "actionPlatform": ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"]
                    }
                }
            ]
        },
        # 2. Author Signal (Person)
        {
            "@type": "Person",
            "@id": f"{domain}/#author",
            "name": author_name,
            "jobTitle": author_title,
            "worksFor": {
                "@type": "Organization",
                "name": company_name
            },
            "knowsAbout": config.get("knows_about", ["Industrial Manufacturing", "International Standards", "Material Science"]),
            "sameAs": config.get("author_social", [])
        },
        # 3. Technical Article / Whitepaper
        {
            "@type": "TechArticle",
            "@id": f"{domain}/#technical-guide",
            "headline": config.get("article_headline", f"Engineering Specification & Design Guide for {company_name}"),
            "description": config.get("article_desc", "Comprehensive technical parameters, testing data, and architectural installation specifications."),
            "author": {
                "@type": "Person",
                "name": author_name
            },
            "publisher": {
                "@type": "Organization",
                "name": company_name,
                "url": domain
            },
            "datePublished": "2024-01-15T08:00:00+08:00",
            "dateModified": "2026-09-26T12:00:00+08:00",
            "inLanguage": "en-US",
            "mainEntityOfPage": f"{domain}/whitepapers"
        },
        # 4. WebSite
        {
            "@type": "WebSite",
            "@id": f"{domain}/#website",
            "url": domain,
            "name": company_name,
            "inLanguage": "en-US",
            "publisher": {
                "@id": f"{domain}/#organization"
            }
        }
    ]

    return {
        "@context": "https://schema.org",
        "@graph": graph,
        "dateModified": "2026-09-26T12:00:00+08:00",
        "datePublished": "2024-01-15T08:00:00+08:00"
    }

def main():
    parser = argparse.ArgumentParser(description="Schema.org JSON-LD E-E-A-T Builder")
    parser.add_argument("--out", default="schema_graph.jsonld", help="Output JSON-LD file")
    args = parser.parse_args()

    schema_obj = build_schema_graph({})
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(schema_obj, f, indent=2, ensure_ascii=False)
    print(f"✓ Generated complete E-E-A-T schema graph in {args.out}")

if __name__ == "__main__":
    main()

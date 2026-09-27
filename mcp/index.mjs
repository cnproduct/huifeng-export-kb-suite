#!/usr/bin/env node
/**
 * Huifeng Export KB Suite - MCP Server
 * Exposes tools for autonomous AI agents to query Huifeng KB facts and generate website content.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { auditClaimText, auditEvidenceRegister } from '../generators/claim-guard.mjs';

const execAsync = promisify(exec);
import { generateProductPage, generateSolutionPage, generateGuidePage } from '../generators/site-content-generator.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

const SITES_PATH = path.join(ROOT_DIR, 'sites-matrix', 'sites.json');
const PIM_PATH = path.join(ROOT_DIR, 'knowledge-base', '04_product_catalog', 'MASTER_PIM.json');
const EVIDENCE_PATH = path.join(ROOT_DIR, 'knowledge-base', '01_sources_permissions', 'evidence-register.json');

async function getSites() {
  const raw = await fs.readFile(SITES_PATH, 'utf8');
  return JSON.parse(raw).sites;
}

async function getPim() {
  const raw = await fs.readFile(PIM_PATH, 'utf8');
  return JSON.parse(raw).products;
}

async function getEvidenceReadiness() {
  const raw = await fs.readFile(EVIDENCE_PATH, 'utf8');
  return auditEvidenceRegister(JSON.parse(raw));
}

const TOOLS = [
  {
    name: "list_sites",
    description: "List all 20 Huifeng independent export sites with group, priority, domain, and primary keyword.",
    inputSchema: {
      type: "object",
      properties: {
        group: { type: "string", description: "Filter by group: A, B, C, D, or ALL" },
        priority: { type: "string", description: "Filter by priority: P0, P1, P2, P3, or ALL" }
      }
    }
  },
  {
    name: "get_site_details",
    description: "Retrieve complete strategic profile, ICP, keywords, differentiators, and compliance evidence for a specific site.",
    inputSchema: {
      type: "object",
      properties: {
        site_id: { type: "string", description: "The site ID, e.g. 'huifengsanitary', 'mianxiangcare', 'babydiaperfactory'" }
      },
      required: ["site_id"]
    }
  },
  {
    name: "generate_site_page",
    description: "Rapidly generate an SEO-optimized B2B website page (Product, Solution, or Sourcing Guide) for any of the 20 sites.",
    inputSchema: {
      type: "object",
      properties: {
        site_id: { type: "string", description: "Target site ID, e.g. 'huifengsanitary'" },
        page_type: { type: "string", enum: ["product", "solution", "guide"], description: "Type of page to generate" },
        sku_id: { type: "string", description: "Optional specific SKU ID, e.g. 'HF-SN-240-AIR'" },
        format: { type: "string", enum: ["markdown", "html", "json"], default: "markdown" }
      },
      required: ["site_id", "page_type"]
    }
  },
  {
    name: "build_geo_assets",
    description: "Compile 100/100 publication-ready GEO assets (robots.txt with 27 AI crawlers, /.well-known/ai.txt, /ai/summary.json, /ai/service.json, /ai/faq.json, llms.txt, Schema.org @graph) for any Huifeng site.",
    inputSchema: {
      type: "object",
      properties: {
        site_id: { type: "string", description: "Target site ID (e.g. 'huifengsanitary' or 'mianxiangcare')" }
      },
      required: ["site_id"]
    }
  },
  {
    name: "check_keyword_density",
    description: "Audit HTML text to ensure keyword density does not exceed the 2.50% search engine stuffing threshold.",
    inputSchema: {
      type: "object",
      properties: {
        html_file: { type: "string", description: "Path to local HTML file to check" },
        target_keyword: { type: "string", description: "Target keyword to analyze" }
      },
      required: ["html_file", "target_keyword"]
    }
  },
  {
    name: "audit_claim",
    description: "Audit marketing text using ClaimGuard to prevent greenwashing (e.g. 100% biodegradable without industrial cert) and trademark misuse.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text content to audit" }
      },
      required: ["text"]
    }
  },
  {
    name: "get_publication_readiness",
    description: "Check whether company, product, compliance, performance, and commercial claims have approved source evidence for public use.",
    inputSchema: { type: "object", properties: {} }
  }
];

async function handleToolCall(name, args) {
  const sites = await getSites();
  const products = await getPim();

  if (name === "list_sites") {
    let result = sites;
    if (args.group && args.group !== "ALL") {
      result = result.filter(s => s.group === args.group);
    }
    if (args.priority && args.priority !== "ALL") {
      result = result.filter(s => s.priority === args.priority);
    }
    return {
      total: result.length,
      sites: result.map(s => ({
        id: s.id,
        domain: s.domain,
        group: s.group,
        priority: s.priority,
        name: s.name,
        primary_keyword: s.keywords.primary,
        primary_cta: s.primary_cta
      }))
    };
  }

  if (name === "get_site_details") {
    const site = sites.find(s => s.id === args.site_id || s.domain === args.site_id);
    if (!site) throw new Error(`Site not found: ${args.site_id}`);
    return { publication_status: 'draft_unverified', ...site };
  }

  if (name === "generate_site_page") {
    const site = sites.find(s => s.id === args.site_id || s.domain === args.site_id);
    if (!site) throw new Error(`Site not found: ${args.site_id}`);
    
    let product = null;
    if (args.sku_id) {
      product = products.find(p => p.sku_id.toLowerCase() === args.sku_id.toLowerCase());
    } else {
      product = products.find(p => p.applicable_sites.includes(site.id)) || products[0];
    }

    let content = "";
    if (args.page_type === "product") {
      content = generateProductPage(site, product, args.format || "markdown");
    } else if (args.page_type === "solution") {
      content = generateSolutionPage(site, args.format || "markdown");
    } else if (args.page_type === "guide") {
      content = generateGuidePage(site, args.format || "markdown");
    }

    const audit = auditClaimText(typeof content === "string" ? content : JSON.stringify(content));
    const evidence = await getEvidenceReadiness();
    return {
      site_id: site.id,
      domain: site.domain,
      page_type: args.page_type,
      format: args.format || "markdown",
      claim_guard_passed: audit.valid,
      compliance_notes: audit.issues,
      publication_ready: evidence.publication_ready,
      pending_evidence: evidence.pending,
      content
    };
  }

  if (name === "build_geo_assets") {
    const { buildGeoForSite } = await import('../generators/geo-bridge.mjs');
    const outDir = path.join(ROOT_DIR, 'dist', 'geo-sites');
    const res = await buildGeoForSite(args.site_id, outDir);
    return {
      success: true,
      site_id: res.siteId,
      domain: res.domain,
      output_dir: res.outputPath,
      files_generated: ["robots.txt (27 AI crawlers)", ".well-known/ai.txt", "ai/summary.json (WebMCP tools)", "ai/service.json", "ai/faq.json", "schema_graph.jsonld", "llms.txt"]
    };
  }

  if (name === "check_keyword_density") {
    const scriptPath = path.join(ROOT_DIR, 'geo-optimizer', 'scripts', 'keyword_density_optimizer.py');
    const cmd = `python3 "${scriptPath}" --file "${args.html_file}" --word "${args.target_keyword}"`;
    try {
      const { stdout } = await execAsync(cmd);
      return { output: stdout };
    } catch (e) {
      return { error: e.message, stderr: e.stderr };
    }
  }

  if (name === "audit_claim") {
    return auditClaimText(args.text);
  }


  if (name === "get_publication_readiness") {
    return getEvidenceReadiness();
  }

  throw new Error(`Unknown tool: ${name}`);
}

// JSON-RPC stdio protocol loop for MCP
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });

rl.on('line', async (line) => {
  if (!line.trim()) return;
  try {
    const req = JSON.parse(line);
    if (req.method === 'tools/list') {
      console.log(JSON.stringify({ jsonrpc: '2.0', id: req.id, result: { tools: TOOLS } }));
    } else if (req.method === 'tools/call') {
      const result = await handleToolCall(req.params.name, req.params.arguments || {});
      console.log(JSON.stringify({ jsonrpc: '2.0', id: req.id, result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] } }));
    } else {
      console.log(JSON.stringify({ jsonrpc: '2.0', id: req.id, result: {} }));
    }
  } catch (err) {
    console.error('MCP Error:', err);
  }
});

if (process.argv.includes('--test')) {
  console.log('Testing MCP Server tool call: list_sites');
  handleToolCall('list_sites', { group: 'A' }).then(res => {
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  });
}

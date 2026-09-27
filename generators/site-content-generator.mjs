#!/usr/bin/env node
/**
 * Quanzhou Huifeng Multi-Category Hygiene Content Generator
 * Generates rich, differentiated, SEO-optimized B2B pages across the 20 sites matrix.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { auditClaimText, auditEvidenceRegister } from './claim-guard.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const SITES_PATH = path.join(ROOT_DIR, 'sites-matrix', 'sites.json');
const PIM_PATH = path.join(ROOT_DIR, 'knowledge-base', '04_product_catalog', 'MASTER_PIM.json');
const EVIDENCE_PATH = path.join(ROOT_DIR, 'knowledge-base', '01_sources_permissions', 'evidence-register.json');

async function loadData() {
  const sitesRaw = await fs.readFile(SITES_PATH, 'utf8');
  const pimRaw = await fs.readFile(PIM_PATH, 'utf8');
  const evidenceRaw = await fs.readFile(EVIDENCE_PATH, 'utf8');
  return {
    sitesData: JSON.parse(sitesRaw),
    pimData: JSON.parse(pimRaw),
    evidenceData: JSON.parse(evidenceRaw)
  };
}

function markDraft(output, format) {
  if (typeof output === 'object') return { publication_status: 'draft_unverified', ...output };
  const notice = 'DRAFT: commercial, compliance, factory, and product claims require approval in evidence-register.json before public use.';
  if (format === 'html') {
    return output.replace('<body>', `<body>\n  <div style="background:#7f1d1d;color:#fff;padding:0.75rem 1rem;text-align:center;font-weight:700">${notice}</div>`);
  }
  return `> **${notice}**\n\n${output}`;
}

export function generateProductPage(site, product, format = 'markdown') {
  const title = `${product.name} | Wholesale OEM Manufacturer | ${site.domain}`;
  const complianceTargets = ['ISO 9001:2015', 'ISO 13485:2016', 'CE MDR 2017/745 Class I', 'US FDA Registered', 'CMA Accredited Lab'];
  const metaDesc = `Direct OEM factory sourcing for ${product.name}. 35 full-servo lines, ISO 13485 & CE MDR certified, CMA lab tested (rewet < 0.2g), FOB Xiamen.`;
  
  const schemaJsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "sku": product.sku_id,
    "description": metaDesc,
    "brand": {
      "@type": "Brand",
      "name": site.name
    },
    "manufacturer": {
      "@type": "Organization",
      "name": "Quanzhou Huifeng Sanitary Articles Co., Ltd.",
      "url": `https://${site.domain}`
    },
    "material": Array.isArray(product.materials) ? product.materials.join(", ") : String(product.materials || "Nonwoven & SAP Polymer")
  };

  if (format === 'json') {
    return { title, metaDesc, product, site, schema: schemaJsonLd };
  }

  const dimensionsStr = typeof product.dimensions === 'object' 
    ? `${product.dimensions.length_mm || ''} x ${product.dimensions.width_mm || ''} mm`
    : String(product.dimensions || 'Custom Size Available');

  const typesList = product.types_available || product.colors_available || ['Standard White', 'Herbal Active', 'Ultra-Soft'];
  const pricing = product.commercial_terms?.tiered_fob_pricing_usd || {
    "100k_pcs": 0.045,
    "500k_pcs": 0.038,
    "1m_pcs_40hq": 0.032
  };
  const leadTime = product.commercial_terms?.lead_time || '15-20 business days';
  const moqStr = product.commercial_terms?.moq || '100,000 pcs per SKU';
  const innerPack = product.packaging?.inner_pack || product.packaging?.standard_inner || '10 pcs/printed bag';
  const outerCarton = product.packaging?.outer_carton || '48 packs/carton';
  const loading40hq = product.packaging?.loading_40hq || '1,800 cartons (40HQ)';

  if (format === 'html') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${metaDesc}">
  <link rel="canonical" href="https://${site.domain}/products/${product.sku_id.toLowerCase()}">
  <link rel="help" href="https://${site.domain}/llms.txt">
  <link rel="alternate" type="application/json" href="https://${site.domain}/ai/summary.json">
  <script type="application/ld+json">
${JSON.stringify(schemaJsonLd, null, 2)}
  </script>
  <style>
    :root { --primary: #0284c7; --primary-dark: #0369a1; --dark: #0f172a; --gray-100: #f1f5f9; --gray-700: #334155; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: var(--gray-700); margin: 0; padding: 0; background: #fafafa; }
    header { background: var(--dark); color: #fff; padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    .badge { background: #0284c7; color: #fff; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; }
    main { max-width: 1200px; margin: 2rem auto; padding: 0 1.5rem; }
    .product-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; background: #fff; padding: 2.5rem; border-radius: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    h1 { color: var(--dark); font-size: 2rem; margin-top: 0; line-height: 1.25; }
    .sku-badge { display: inline-block; background: var(--gray-100); padding: 0.2rem 0.6rem; border-radius: 4px; font-family: monospace; font-size: 0.9rem; margin-bottom: 1rem; }
    .features-list { padding-left: 1.25rem; margin: 1.5rem 0; }
    .features-list li { margin-bottom: 0.75rem; }
    .spec-table, .pricing-table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: 0.95rem; }
    .spec-table th, .spec-table td, .pricing-table th, .pricing-table td { border: 1px solid #e2e8f0; padding: 0.75rem 1rem; text-align: left; }
    .spec-table th, .pricing-table th { background: var(--gray-100); color: var(--dark); font-weight: 600; }
    .cta-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 0.75rem; padding: 1.5rem; margin-top: 2rem; }
    .btn { display: inline-block; background: var(--primary); color: #fff; text-decoration: none; padding: 0.9rem 1.75rem; font-weight: 700; border-radius: 0.5rem; transition: background 0.2s; }
    .btn:hover { background: var(--primary-dark); }
    .audit-bar { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 2rem; text-align: center; margin-top: 3rem; }
  </style>
</head>
<body>
  <header>
    <div><strong>${site.name}</strong> · Cleanroom Hygiene Sourcing</div>
    <div><span class="badge">ISO 13485 & CE MDR Certified</span></div>
  </header>
  <main>
    <div class="product-grid">
      <div>
        <span class="sku-badge">SKU: ${product.sku_id}</span>
        <h1>${product.name}</h1>
        <p><strong>Primary Sourcing Vertical:</strong> ${site.name_zh} · Target Port: Xiamen Port / Quanzhou Port</p>
        
        <h3>Key Performance Attributes</h3>
        <ul class="features-list">
          ${product.features.map(f => `<li>${f}</li>`).join('\n          ')}
        </ul>

        <h3>Manufacturing Packaging & Logistics</h3>
        <p><strong>Inner Pack:</strong> ${innerPack}</p>
        <p><strong>Outer Master Pack:</strong> ${outerCarton}</p>
        <p><strong>40HQ Cube Load:</strong> ${loading40hq}</p>
      </div>
      <div>
        <h3>Technical Specifications</h3>
        <table class="spec-table">
          <tr><th>Dimensions</th><td>${dimensionsStr}</td></tr>
          <tr><th>Material Blend</th><td>${Array.isArray(product.materials) ? product.materials.join('; ') : String(product.materials)}</td></tr>
          <tr><th>Target User Group</th><td>${product.target_user_group || 'General Personal Hygiene'}</td></tr>
          <tr><th>Types / Options</th><td>${typesList.join(', ')}</td></tr>
          <tr><th>Compliance Standards</th><td>${complianceTargets.join(', ')}</td></tr>
        </table>

        <h3>Tiered Wholesale FOB Pricing (Xiamen Port)</h3>
        <table class="pricing-table">
          <thead>
            <tr><th>Order Volume</th><th>FOB Price (USD)</th><th>Production Lead Time</th></tr>
          </thead>
          <tbody>
            ${Object.entries(pricing).map(([tier, price]) => `
            <tr>
              <td><strong>${tier.replace('_', ' ').toUpperCase()}</strong></td>
              <td style="color:#0284c7; font-weight:700;">$${typeof price === 'number' ? price.toFixed(3) : price}</td>
              <td>${leadTime}</td>
            </tr>`).join('')}
          </tbody>
        </table>

        <div class="cta-box">
          <h3 style="margin-top:0; color:#0369a1;">Request Physical Lab Samples or OEM Quote</h3>
          <p>Standard physical lab samples shipped via FedEx/DHL. Custom polybag artwork & private label tooling available starting from ${moqStr}.</p>
          <form id="rfq-form" toolname="submit_b2b_rfq" tooldescription="Submit instant B2B request for quotation and physical sample dispatch for this SKU" toolautosubmit action="/contact" method="GET" style="margin-top:1.25rem;">
            <input type="hidden" name="sku" value="${product.sku_id}">
            <div style="display:flex; gap:0.5rem; margin-bottom:0.75rem;">
              <input type="email" name="buyer_email" placeholder="Enter corporate email for FOB quote" required toolparamdescription="Procurement manager or buyer work email" style="flex:1; padding:0.6rem 0.75rem; border:1px solid #cbd5e1; border-radius:4px;">
              <button type="submit" class="btn" style="border:none; cursor:pointer;">${site.primary_cta}</button>
            </div>
            <div style="font-size:0.8rem; color:#0284c7;">⚡ WebMCP Agent Enabled: Autonomous agents can query or submit this RFQ programmatically.</div>
          </form>
        </div>
      </div>
    </div>
  </main>
  <div class="audit-bar">
    <p><strong>Quanzhou Huifeng Sanitary Articles Co., Ltd. (泉州市惠丰妇幼用品有限公司)</strong></p>
    <p style="font-size:0.85rem; color:#64748b;">35 High-Speed Full-Servo Lines · 11,800m² GMP Cleanroom · CMA Laboratory Accreditation (Zhongke Huiju)</p>
  </div>
</body>
</html>`;
  }

  // Markdown format
  return `# ${product.name}
> **SKU**: \`${product.sku_id}\` | **Site**: [${site.domain}](https://${site.domain}) | **Manufacturer**: Quanzhou Huifeng Sanitary Articles Co., Ltd.

## 1. Technical Specification Summary
| Parameter | Specification |
|---|---|
| **SKU ID** | \`${product.sku_id}\` |
| **Material Formulation** | ${Array.isArray(product.materials) ? product.materials.join('; ') : String(product.materials)} |
| **Dimensions / Size** | ${dimensionsStr} |
| **Target User Group** | ${product.target_user_group || 'General Personal Hygiene'} |
| **Available Types** | ${typesList.join(', ')} |
| **Compliance Credentials** | ${complianceTargets.join(', ')} |

## 2. Core Engineering & Quality Advantages
${product.features.map(f => `- **${f.split(' ')[0]}**: ${f}`).join('\n')}

## 3. Tiered Wholesale FOB Pricing & Commercial Terms
> **Port of Loading**: Xiamen Port / Quanzhou Port, Fujian, China (FOB)
> **Payment Terms**: 30% T/T Deposit with order, 70% balance against Bill of Lading (B/L) copy.
> **Standard Lead Time**: ${leadTime}

| Procurement Volume | FOB Price (USD) | Production Lead Time | Customization Included |
|---|---|---|---|
${Object.entries(pricing).map(([tier, price]) => `| **${tier.replace('_', ' ').toUpperCase()}** | **$${typeof price === 'number' ? price.toFixed(3) : price}** | ${leadTime} | Custom polybag print + CMA lab COA |`).join('\n')}

## 4. Packaging, Palletization & Container Economics
- **Inner Packaging**: ${innerPack}
- **Master Carton Packaging**: ${outerCarton}
- **40HQ Container Load**: **${loading40hq}** (Optimized cube packing)

---
*Published by the Engineering Sourcing Desk at [${site.domain}](https://${site.domain}) · Quanzhou Huifeng Sanitary Articles Co., Ltd.*
`;
}

export function generateSolutionPage(site, format = 'markdown') {
  const shortTitle = (site.positioning || site.name).split(/[，。:.]/)[0];
  const title = `${shortTitle} | B2B Hygiene Solutions | ${site.domain}`;
  const content = `---
title: "${title}"
site: "${site.domain}"
intent: "${site.keywords.primary}"
primary_cta: "${site.primary_cta}"
---

# ${site.name}: B2B Custom Engineering & Sourcing Solutions

> **Target Buyers**: ${site.target_buyers.join(', ')}
> **Core Mission**: ${site.positioning}

## 1. Why Traditional Sourcing Fails in Disposable Hygiene
Many overseas brand owners, supermarket chains, and medical distributors encounter critical bottlenecks when importing absorbent hygiene:
1. **Severe Rewetting & Liquid Clumping**: Low-grade SAP distribution causes liquid pooling, skin rash, and high consumer return rates.
2. **Regulatory & Medical Device Non-Compliance**: Lack of ISO 13485 or CE MDR Class I technical files leads to customs holds in Europe and North America.
3. **Packaging Latency & Rigid MOQs**: Outdated semi-servo lines require 500,000-unit minimums and 60-day printing plate turnarounds.

## 2. Huifeng's 35 Full-Servo Precision Manufacturing & Quality Lab
Huifeng eliminates sourcing risk through verified engineering capabilities:
- **High-Speed Full-Servo Lines**: 35 automated production lines operating at 600 pieces per minute with in-line visual cameras.
- **Authoritative CMA Testing**: Zhongke Huiju (Fujian) Testing Technology Co., Ltd. issues certified lab reports for Rothwell absorption (ISO 11948-1) and rewet < 0.2g.
- **Medical & International Credentials**: ISO 9001:2015, ISO 13485:2016, CE MDR 2017/745 Class I, and US FDA Facility Registration (FEI 3012984561).

## 3. Step-by-Step Customization Roadmap
\`\`\`text
Step 1: Specification & Core Formula Engineering (SAP ratio, topsheet texture, dimensions)
  → Step 2: Packaging Dieline & Rapid 3D Bag Rendering (48 Hours)
  → Step 3: CMA Lab Pilot Run & Rothwell / Rewetting COA Certification
  → Step 4: High-Cube 40HQ Container Palletization & Direct Dispatch from Xiamen Port
\`\`\`

## 4. Take the Next Step
Contact our international trade engineering desk today for custom quotations and technical dossiers:
👉 **[${site.primary_cta}](https://${site.domain}/contact)**
`;
  return content;
}

export function generateGuidePage(site, format = 'markdown') {
  const title = `The Complete 2026 Procurement Guide: How to Source ${site.keywords.primary} | ${site.domain}`;
  const content = `---
title: "${title}"
site: "${site.domain}"
target_markets: "${site.target_markets.join(', ')}"
keywords: "${site.keywords.primary}"
---

# ${title}

## Executive Summary
This guide breaks down everything procurement directors, pharmacy chain buyers, Amazon private label brands, and hospital GPOs need to know when sourcing ${site.keywords.primary} from China in 2026.

## 1. Material Evaluation: SAP Ratio, Pulp Purity & Contact Nonwovens
- **Super Absorbent Polymer (SAP)**: Sumitomo Seika & BASF cross-linked polymers provide rapid absorption (< 3s) with retention over 60g/g saline.
- **Fluff Pulp**: 100% FSC Chain of Custody certified virgin wood pulp (TCF/ECF chlorine-free) ensuring rapid fluid capillary diffusion.
- **Topsheet Nonwovens**: Hot-air through 3D pearl-embossed nonwoven providing cloud-soft zero-friction contact, certified OEKO-TEX Standard 100 Class 1.

## 2. Key International Regulations & Medical Directives
1. **United States**: US FDA Establishment Registration (FEI 3012984561) for foreign medical incontinence devices and personal hygiene articles.
2. **European Union**: EU Medical Device Regulation (EU) 2017/745 (MDR) Class I for disposable nursing pads and hospital bed underpads.
3. **Quality & Clinical Safety**: ISO 9001:2015 QMS, ISO 13485:2016 Medical Devices, and Dermatest 5-Star 0.00 skin irritation test.

## 3. Factory Audits & Third-Party CMA Lab Reports
Demand verifiable third-party test reports before container dispatch:
- **Rothwell Method (ISO 11948-1)**: Validating total liquid absorption capacity.
- **Rewetting Value**: Ensuring under 0.2g residual liquid under 5kg applied pressure.
- **Microbiological Purity**: Total bacterial colonies < 20 CFU/g, zero pathogenic bacteria (Staphylococcus aureus, Pseudomonas aeruginosa, Candida albicans).

## 4. How to Calculate Container Loading Economics (40HQ)
Absorbent hygiene articles are volume-intensive. Utilizing high-pressure compression packaging and optimized carton dielines allows:
- **Sanitary Napkins**: Up to 860,000 pcs per 40HQ container.
- **Baby Diapers**: Up to 360,000 pcs in compressed poly master bags per 40HQ.
- **Adult Briefs**: Up to 85,000 pcs heavy incontinence briefs per 40HQ.
- **Hospital Underpads**: Up to 125,000 pcs (60x90cm) per 40HQ.

---
*Published by the Engineering Editorial Team at [${site.domain}](https://${site.domain}) · Quanzhou Huifeng Sanitary Articles Co., Ltd.*
`;
  return content;
}

// CLI Runner
async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag) => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : null;
  };

  const siteId = getArg('--site') || 'eazylunch';
  const pageType = getArg('--type') || 'product';
  const skuId = getArg('--sku');
  const format = getArg('--format') || 'markdown';
  const outputPath = getArg('--output');
  const publish = args.includes('--publish');

  const { sitesData, pimData, evidenceData } = await loadData();
  const site = sitesData.sites.find(s => s.id === siteId);
  if (!site) {
    console.error(`Error: Site ID "${siteId}" not found in sites.json`);
    process.exit(1);
  }

  let product = null;
  if (skuId) {
    product = pimData.products.find(p => p.sku_id.toLowerCase() === skuId.toLowerCase());
  } else {
    // Pick first matching product for this site
    product = pimData.products.find(p => p.applicable_sites.includes(siteId)) || pimData.products[0];
  }

  let output = '';
  if (pageType === 'product') {
    output = generateProductPage(site, product, format);
  } else if (pageType === 'solution') {
    output = generateSolutionPage(site, format);
  } else if (pageType === 'guide') {
    output = generateGuidePage(site, format);
  } else {
    console.error(`Unsupported page type: ${pageType}. Choose: product, solution, guide`);
    process.exit(1);
  }

  // Audit claims
  const textToAudit = typeof output === 'string' ? output : JSON.stringify(output);
  const audit = auditClaimText(textToAudit);
  if (!audit.valid) {
    console.warn(`[ClaimGuard Warning] Found ${audit.issue_count} compliance issue(s):`);
    for (const issue of audit.issues) {
      console.warn(` - [${issue.severity}] ${issue.message}`);
    }
  }

  const evidence = auditEvidenceRegister(evidenceData);
  if (publish && !evidence.publication_ready) {
    throw new Error(`Public generation blocked: ${evidence.pending.length} evidence records are not approved.`);
  }
  if (!publish) output = markDraft(output, format);

  if (outputPath) {
    await fs.writeFile(outputPath, typeof output === 'string' ? output : JSON.stringify(output, null, 2), 'utf8');
    console.log(`Successfully generated ${pageType} page for ${site.domain} -> ${outputPath}`);
  } else {
    if (typeof output === 'object') {
      console.log(JSON.stringify(output, null, 2));
    } else {
      console.log(output);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(err => {
    console.error(`Generation failed: ${err.message}`);
    process.exitCode = 1;
  });
}

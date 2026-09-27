#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const SITES_PATH = path.join(ROOT_DIR, 'sites-matrix', 'sites.json');

export async function generateLlmsTxt(siteId) {
  const sitesRaw = await fs.readFile(SITES_PATH, 'utf8');
  const sites = JSON.parse(sitesRaw).sites;
  const site = sites.find(s => s.id === siteId);
  if (!site) throw new Error(`Site not found: ${siteId}`);

  const shortTxt = `# ${site.name} (${site.domain})
> B2B sourcing portal planned for ${site.keywords.primary}; commercial and compliance claims remain verified under Huifeng evidence register.

This file is a concise navigation index. Certified technical specifications, CMA testing reports, certifications, prices, lead times, and capacity are verified by Quanzhou Huifeng Sanitary Articles Co., Ltd.

## Core pages

- [Products](https://${site.domain}/products): Product catalogue and hygiene SKU pages.
- [Solutions](https://${site.domain}/solutions): Buyer-specific sourcing and cleanroom manufacturing workflows.
- [Evidence centre](https://${site.domain}/certifications): Approved ISO 9001/13485, CE MDR, FDA dossiers, and CMA lab reports.
- [Buying guides](https://${site.domain}/buying-guides): Absorbency testing, Rothwell ISO 11948, packaging, and container logistics.
- [Contact](https://${site.domain}/contact): Request current COA dossiers, free physical lab samples, and proforma quotations.

## Optional

- [About](https://${site.domain}/about): Company identity and 35 full-servo lines factory profile.
- [FAQ](https://${site.domain}/faq): Common international hygiene procurement questions.
`;

  const evidenceRequired = site.evidence_required || [
    'ISO 9001:2015 Quality Management System Certificate',
    'ISO 13485:2016 Medical Device QMS Certificate',
    'CE MDR 2017/745 Class I EU Declaration of Conformity',
    'US FDA Foreign Establishment Registration (FEI 3012984561)',
    'Zhongke Huiju CMA Laboratory Test Reports (Absorption & Rewet < 0.2g)'
  ];

  const fullTxt = `${shortTxt}

## Strategy context

- Primary: ${site.keywords.primary}
- Intent Cluster: ${site.keywords.intent_cluster || site.keywords.primary}
- Target Buyers: ${site.target_buyers.join(', ')}
- Target Markets: ${site.target_markets.join(', ')}
- Planned Primary Action: ${site.primary_cta}

## Verification requirements

${evidenceRequired.map(item => `- ${item}`).join('\n')}
`;

  return { shortTxt, fullTxt };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const siteId = process.argv[2] || 'huifengsanitary';
  generateLlmsTxt(siteId).then(({ shortTxt }) => {
    console.log(shortTxt);
  });
}

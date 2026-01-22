import fs from 'node:fs/promises';
import path from 'node:path';

function normalizeText(s) {
  return (s || '')
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .trim();
}

function tokenize(text) {
  const normalized = normalizeText(text)
    .toLowerCase()
    .replace(/[^a-z0-9àâäçéèêëîïôöùûüÿœæ\s-]/gi, ' ')
    .replace(/-/g, ' ');

  const parts = normalized.split(/\s+/g).filter(Boolean);

  const stop = new Set([
    'le','la','les','un','une','des','de','du','d','et','ou','a','à','au','aux','en','dans','sur','pour','par','avec','sans',
    'ce','cet','cette','ces','mon','ma','mes','ton','ta','tes','son','sa','ses','notre','nos','votre','vos','leur','leurs',
    'je','tu','il','elle','on','nous','vous','ils','elles','se','s','ne','pas','plus','moins','très','tres',
    'the','a','an','and','or','to','of','in','on','for','with','without','this','that','these','those','is','are','was','were','be'
  ]);

  return parts.filter(t => t.length >= 2 && !stop.has(t));
}

function chunkText(md, opts = {}) {
  const maxLen = opts.maxLen ?? 1200;
  const overlap = opts.overlap ?? 120;

  const text = normalizeText(md);
  if (!text) return [];

  const blocks = text
    .split(/\n{2,}/g)
    .map(b => b.trim())
    .filter(Boolean);

  const chunks = [];
  let current = '';

  const flush = () => {
    if (!current.trim()) return;
    chunks.push(current.trim());
    current = '';
  };

  for (const b of blocks) {
    if ((current + '\n\n' + b).length <= maxLen) {
      current = current ? (current + '\n\n' + b) : b;
      continue;
    }

    flush();

    if (b.length <= maxLen) {
      current = b;
      continue;
    }

    for (let i = 0; i < b.length; i += (maxLen - overlap)) {
      const part = b.slice(i, i + maxLen);
      chunks.push(part.trim());
      if (i + maxLen >= b.length) break;
    }
  }

  flush();
  return chunks;
}

function computeTf(tokens) {
  const tf = Object.create(null);
  for (const t of tokens) tf[t] = (tf[t] ?? 0) + 1;
  return tf;
}

async function findDefaultDocs() {
  const root = process.cwd();
  const docPattern = /^PRODUCT_DOC_LOCAGUEST-.*\.md$/i;

  const candidates = [];

  try {
    const entries = await fs.readdir(root, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isFile()) continue;
      if (!docPattern.test(e.name)) continue;
      candidates.push(e.name);
    }
  } catch {
    // ignore
  }

  try {
    const docsDir = path.join(root, 'Docs', 'product');
    const entries = await fs.readdir(docsDir, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isFile()) continue;
      if (!docPattern.test(e.name)) continue;
      candidates.push(path.join('Docs', 'product', e.name));
    }
  } catch {
    // ignore
  }

  return candidates.sort((a, b) => a.localeCompare(b));
}

async function main() {
  const args = process.argv.slice(2);

  const outFlagIndex = args.indexOf('--out');
  const outPath = outFlagIndex >= 0 ? args[outFlagIndex + 1] : 'src/assets/chatbot/chatbot.index.json';

  const maxLenFlagIndex = args.indexOf('--chunk');
  const maxLen = maxLenFlagIndex >= 0 ? Number(args[maxLenFlagIndex + 1]) : 1200;

  const overlapFlagIndex = args.indexOf('--overlap');
  const overlap = overlapFlagIndex >= 0 ? Number(args[overlapFlagIndex + 1]) : 120;

  const mdFiles = args.filter((a, i) => {
    if (i === outFlagIndex || i === outFlagIndex + 1) return false;
    if (i === maxLenFlagIndex || i === maxLenFlagIndex + 1) return false;
    if (i === overlapFlagIndex || i === overlapFlagIndex + 1) return false;
    return a.endsWith('.md');
  });

  const resolvedMdFiles = mdFiles.length ? mdFiles : await findDefaultDocs();

  if (resolvedMdFiles.length === 0) {
    throw new Error('No .md files provided and none found matching PRODUCT_DOC_LOCAGUEST-*.md in project root.');
  }

  const docs = [];
  const chunks = [];

  for (const file of resolvedMdFiles) {
    const abs = path.resolve(process.cwd(), file);
    const name = path.basename(file);
    const md = await fs.readFile(abs, 'utf8');
    const parts = chunkText(md, { maxLen, overlap });

    docs.push({
      name,
      sourcePath: file,
      chunkCount: parts.length
    });

    for (let i = 0; i < parts.length; i++) {
      const text = parts[i];
      const tokens = tokenize(text);
      chunks.push({
        docName: name,
        chunkIndex: i,
        text,
        tokens,
        tf: computeTf(tokens)
      });
    }
  }

  const df = Object.create(null);
  for (const c of chunks) {
    const uniq = new Set(c.tokens);
    for (const t of uniq) df[t] = (df[t] ?? 0) + 1;
  }

  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    chunking: { maxLen, overlap },
    docs,
    stats: {
      totalDocs: docs.length,
      totalChunks: chunks.length
    },
    df,
    chunks
  };

  const outAbs = path.resolve(process.cwd(), outPath);
  await fs.mkdir(path.dirname(outAbs), { recursive: true });
  await fs.writeFile(outAbs, JSON.stringify(payload), 'utf8');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

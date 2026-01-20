export function createId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function normalizeText(input: string): string {
  return (input || '')
    .toLowerCase()
    .replace(/\r\n/g, '\n')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOPWORDS = new Set([
  'le','la','les','un','une','des','du','de','d','et','ou','a','à','au','aux','en','dans','sur','pour','par','avec','sans',
  'ce','cet','cette','ces','mon','ma','mes','ton','ta','tes','son','sa','ses','notre','nos','votre','vos','leur','leurs',
  'je','tu','il','elle','on','nous','vous','ils','elles','que','qui','quoi','dont','où','est','sont','etre','être'
]);

export function tokenize(input: string): string[] {
  const n = normalizeText(input);
  if (!n) return [];
  return n
    .split(' ')
    .map(t => t.trim())
    .filter(t => t.length >= 2)
    .filter(t => !STOPWORDS.has(t));
}

export function chunkText(markdown: string, maxChars: number = 1200): string[] {
  const text = (markdown || '').replace(/\r\n/g, '\n');
  const paragraphs = text
    .split(/\n\n+/g)
    .map(p => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = '';

  for (const p of paragraphs) {
    if (!current) {
      current = p;
      continue;
    }

    if ((current.length + 2 + p.length) <= maxChars) {
      current = `${current}\n\n${p}`;
      continue;
    }

    chunks.push(current);
    current = p;
  }

  if (current) chunks.push(current);
  return chunks;
}

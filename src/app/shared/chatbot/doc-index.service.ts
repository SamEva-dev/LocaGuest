import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ChatbotSource } from './chatbot.types';
import { chunkText, tokenize } from './chatbot.util';

interface DocDescriptor {
  url: string;
  name: string;
}

interface IndexedChunk {
  docUrl: string;
  docName: string;
  chunkIndex: number;
  text: string;
  tokens: string[];
  tf: Map<string, number>;
}

interface PrebuiltIndexChunk {
  docName: string;
  chunkIndex: number;
  text: string;
  tokens: string[];
  tf: Record<string, number>;
}

interface PrebuiltIndex {
  version: number;
  docs: { name: string; sourcePath?: string; chunkCount?: number }[];
  stats?: { totalDocs?: number; totalChunks?: number };
  df: Record<string, number>;
  chunks: PrebuiltIndexChunk[];
}

@Injectable({ providedIn: 'root' })
export class DocIndexService {
  private http = inject(HttpClient);

  private indexed = false;
  private chunks: IndexedChunk[] = [];
  private df = new Map<string, number>();
  private chunkCount = 0;

  async ensureIndexed(docs: DocDescriptor[], indexUrl?: string): Promise<void> {
    if (this.indexed) return;

    if (indexUrl) {
      const loaded = await this.tryLoadPrebuiltIndex(docs, indexUrl);
      if (loaded) {
        this.indexed = true;
        return;
      }
    }

    const allChunks: IndexedChunk[] = [];

    for (const doc of docs) {
      const md = await firstValueFrom(this.http.get(doc.url, { responseType: 'text' }));
      const parts = chunkText(md);

      for (let i = 0; i < parts.length; i++) {
        const text = parts[i];
        const tokens = tokenize(text);
        const tf = this.computeTf(tokens);
        allChunks.push({
          docUrl: doc.url,
          docName: doc.name,
          chunkIndex: i,
          text,
          tokens,
          tf
        });
      }
    }

    this.chunks = allChunks;
    this.chunkCount = allChunks.length;
    this.df = this.computeDf(allChunks);
    this.indexed = true;
  }

  private async tryLoadPrebuiltIndex(docs: DocDescriptor[], indexUrl: string): Promise<boolean> {
    try {
      const payload = await firstValueFrom(this.http.get<PrebuiltIndex>(indexUrl));
      if (!payload || !Array.isArray(payload.chunks) || payload.chunks.length === 0) return false;

      const docUrlByName = new Map<string, string>();
      for (const d of docs) docUrlByName.set(d.name, d.url);

      const allChunks: IndexedChunk[] = payload.chunks.map((c) => {
        return {
          docUrl: docUrlByName.get(c.docName) || '',
          docName: c.docName,
          chunkIndex: c.chunkIndex,
          text: c.text,
          tokens: Array.isArray(c.tokens) ? c.tokens : tokenize(c.text),
          tf: new Map(Object.entries(c.tf || {}).map(([k, v]) => [k, Number(v) || 0]))
        };
      });

      this.chunks = allChunks;
      this.chunkCount = allChunks.length;
      this.df = new Map(Object.entries(payload.df || {}).map(([k, v]) => [k, Number(v) || 0]));

      return true;
    } catch {
      return false;
    }
  }

  search(query: string, maxSources: number): ChatbotSource[] {
    if (!this.indexed || this.chunkCount === 0) return [];

    const qTokens = tokenize(query);
    if (qTokens.length === 0) return [];

    const qTf = this.computeTf(qTokens);

    const scored = this.chunks
      .map((c) => {
        const score = this.cosineTfidf(qTf, c.tf);
        return { c, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSources)
      .map(({ c, score }) => ({
        docUrl: c.docUrl,
        docName: c.docName,
        chunkIndex: c.chunkIndex,
        score,
        excerpt: this.makeExcerpt(c.text, 700)
      }));

    return scored;
  }

  private computeTf(tokens: string[]): Map<string, number> {
    const tf = new Map<string, number>();
    for (const t of tokens) {
      tf.set(t, (tf.get(t) || 0) + 1);
    }
    return tf;
  }

  private computeDf(chunks: IndexedChunk[]): Map<string, number> {
    const df = new Map<string, number>();
    for (const c of chunks) {
      const uniq = new Set(c.tokens);
      for (const t of uniq) {
        df.set(t, (df.get(t) || 0) + 1);
      }
    }
    return df;
  }

  private idf(term: string): number {
    const df = this.df.get(term) || 0;
    // Smooth IDF
    return Math.log(1 + (this.chunkCount / (1 + df)));
  }

  private cosineTfidf(qTf: Map<string, number>, dTf: Map<string, number>): number {
    let dot = 0;
    let qNorm = 0;
    let dNorm = 0;

    for (const [t, qCount] of qTf.entries()) {
      const wq = qCount * this.idf(t);
      qNorm += wq * wq;

      const dCount = dTf.get(t) || 0;
      if (dCount > 0) {
        const wd = dCount * this.idf(t);
        dot += wq * wd;
      }
    }

    // dNorm computed on overlapping terms is enough for ranking here
    for (const [t, dCount] of dTf.entries()) {
      if (!qTf.has(t)) continue;
      const wd = dCount * this.idf(t);
      dNorm += wd * wd;
    }

    const denom = Math.sqrt(qNorm) * Math.sqrt(dNorm);
    if (!denom) return 0;
    return dot / denom;
  }

  private makeExcerpt(text: string, maxLen: number): string {
    const trimmed = (text || '').trim();
    if (trimmed.length <= maxLen) return trimmed;
    return trimmed.slice(0, maxLen - 1).trimEnd() + '…';
  }
}

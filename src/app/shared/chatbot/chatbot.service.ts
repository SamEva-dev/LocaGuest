import { Injectable, inject } from '@angular/core';
import { ChatbotAskResult, ChatbotConfig } from './chatbot.types';
import { DocIndexService } from './doc-index.service';
import { OpenAiClientService } from './openai-client.service';

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private docIndex = inject(DocIndexService);
  private openai = inject(OpenAiClientService);

  async ask(config: ChatbotConfig, userQuestion: string): Promise<ChatbotAskResult> {
    await this.docIndex.ensureIndexed(config.docs, config.indexUrl);

    const sources = this.docIndex.search(userQuestion, config.maxSources);

    if (!config.ai.enabled) {
      return {
        answer: this.buildFallbackAnswer(config, userQuestion, sources),
        sources
      };
    }

    const system = this.buildSystemPrompt(config);
    const context = this.buildContextPrompt(sources);

    const answer = await this.openai.chatCompletion({
      baseUrl: config.ai.baseUrl,
      apiKey: config.ai.apiKey,
      model: config.ai.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `${context}\n\nQuestion: ${userQuestion}` }
      ]
    });

    const finalAnswer = answer || this.buildFallbackAnswer(config, userQuestion, sources);

    return {
      answer: finalAnswer,
      sources
    };
  }

  private buildSystemPrompt(config: ChatbotConfig): string {
    return [
      `Tu es un assistant d'aide intégré à ${config.appName}.`,
      `Tu dois répondre en français.`,
      `Tu dois être précis et opérationnel: indique où cliquer (chemin d'écran), les règles métier, et les prérequis.`,
      `Tu n'inventes pas de fonctionnalités. Si l'information n'est pas dans le contexte fourni, dis-le clairement et propose une piste.`,
      `Quand tu utilises le contexte, cite tes sources sous forme [DOC#chunk].`,
      `Si la question est ambiguë, pose 1-2 questions de clarification.`
    ].join('\n');
  }

  private buildContextPrompt(sources: { docName: string; chunkIndex: number; excerpt: string }[]): string {
    if (sources.length === 0) {
      return 'Contexte: (aucun extrait de documentation pertinent trouvé)';
    }

    const blocks = sources.map(s => {
      return `---\n[${s.docName}#${s.chunkIndex}]\n${s.excerpt}`;
    });

    return `Contexte (extraits de documentation):\n${blocks.join('\n')}`;
  }

  private buildFallbackAnswer(config: ChatbotConfig, userQuestion: string, sources: { docName: string; chunkIndex: number; excerpt: string }[]): string {
    if (sources.length === 0) {
      return [
        `Je n'ai pas trouvé de passage pertinent dans la documentation chargée pour répondre à: "${userQuestion}".`,
        `Essaie de reformuler (ex: "où trouver...", "comment faire...", "je veux..."), ou ajoute une documentation plus spécifique.`
      ].join('\n\n');
    }

    const lines = sources.map(s => `- [${s.docName}#${s.chunkIndex}] ${s.excerpt}`);

    return [
      `Je n'ai pas pu appeler l'IA externe. Voici les passages les plus pertinents trouvés dans la documentation:`,
      lines.join('\n')
    ].join('\n\n');
  }
}

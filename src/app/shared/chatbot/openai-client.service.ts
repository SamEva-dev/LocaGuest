import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIChatCompletionRequest {
  model: string;
  messages: OpenAIChatMessage[];
  temperature?: number;
}

interface OpenAIChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

@Injectable({ providedIn: 'root' })
export class OpenAiClientService {
  private http = inject(HttpClient);

  async chatCompletion(params: {
    baseUrl: string;
    apiKey?: string;
    model: string;
    messages: OpenAIChatMessage[];
    temperature?: number;
  }): Promise<string> {
    const url = `${params.baseUrl.replace(/\/$/, '')}/v1/chat/completions`;

    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (params.apiKey) {
      headers = headers.set('Authorization', `Bearer ${params.apiKey}`);
    }

    const body: OpenAIChatCompletionRequest = {
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.2
    };

    const res = await firstValueFrom(
      this.http.post<OpenAIChatCompletionResponse>(url, body, { headers })
    );

    const content = res?.choices?.[0]?.message?.content;
    return (content || '').trim();
  }
}

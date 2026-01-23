import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { RentabilityApi } from '../api/rentability.api';
import { RentabilityInput, RentabilityResult } from '../models/rentability.models';
import { RentabilityScenariosService } from './rentability-scenarios.service';
import { ConnectivityService } from './connectivity.service';
import { RentabilityDraft, RentabilityDraftStore } from './rentability-draft.store';

function uuid(): string {
  // good enough for local drafts
  return (crypto as any)?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

@Injectable({ providedIn: 'root' })
export class RentabilityHybridService {
  private readonly api = inject(RentabilityApi);
  private readonly scenarios = inject(RentabilityScenariosService);
  private readonly connectivity = inject(ConnectivityService);
  private readonly drafts = inject(RentabilityDraftStore);

  async saveHybrid(params: {
    input: Partial<RentabilityInput>;
    name: string;
    scenarioId?: string;
    localResult?: RentabilityResult | null;
  }): Promise<{ scenarioId?: string; draftId?: string; synced: boolean; warnings?: string[] }> {
    const now = new Date().toISOString();

    if (!this.connectivity.isOnline()) {
      const draft: RentabilityDraft = {
        id: uuid(),
        scenarioId: params.scenarioId,
        name: params.name,
        input: params.input,
        localResult: params.localResult,
        createdAt: now,
        updatedAt: now,
        pendingSync: true,
      };

      await this.drafts.upsert(draft);
      return { scenarioId: params.scenarioId, draftId: draft.id, synced: false };
    }

    // Online: compute authoritative then save scenario (backend ignores resultsJson anyway)
    const fullInput = params.input as RentabilityInput;
    const computed = await firstValueFrom(this.api.compute({ inputs: fullInput }));

    const saved = await firstValueFrom(
      this.scenarios.saveScenario(params.input, params.name, false, computed.results, params.scenarioId)
    );

    return { scenarioId: saved.id, synced: true, warnings: computed.warnings };
  }

  async syncPending(): Promise<void> {
    if (!this.connectivity.isOnline()) return;

    const pending = await this.drafts.listPending();
    for (const d of pending) {
      try {
        const fullInput = d.input as RentabilityInput;
        const computed = await firstValueFrom(this.api.compute({ inputs: fullInput }));
        const saved = await firstValueFrom(this.scenarios.saveScenario(d.input, d.name, false, computed.results, d.scenarioId));

        d.scenarioId = saved.id;
        d.pendingSync = false;
        d.lastError = undefined;
        d.updatedAt = new Date().toISOString();
        await this.drafts.upsert(d);
      } catch (e: any) {
        d.lastError = e?.message ?? 'sync failed';
        d.updatedAt = new Date().toISOString();
        await this.drafts.upsert(d);
      }
    }
  }
}

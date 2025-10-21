import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environnements/environment.prod';
import { PropertyDto } from '../models/models';
import { PropertyApi } from '../core/api/property.api';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private readonly api = inject(PropertyApi);

  readonly loading = signal(false);
  readonly properties = signal<PropertyDto[]>([]);
  readonly selected = signal<PropertyDto | null>(null);

  async loadAll() {
    this.loading.set(true);
    const list = await firstValueFrom(this.api.getAll());
    this.properties.set(list);
    this.loading.set(false);
  }

  async loadById(id: string) {
    const prop = await firstValueFrom(this.api.getById(id));
    this.selected.set(prop);
    return prop;
  }

  async create(property: PropertyDto) {
    const newProp = await firstValueFrom(this.api.create(property));
    this.properties.update(list => [newProp, ...list]);
    return newProp;
  }

  async update(property: PropertyDto, etag: string) {
    const updated = await firstValueFrom(this.api.update(property.id!, property, etag));
    this.selected.set(updated);
    this.properties.update(list =>
      list.map(p => (p.id === property.id ? updated : p))
    );
  }

  async delete(id: string, etag?: string) {
    await firstValueFrom(this.api.delete(id, etag));
    this.properties.update(list => list.filter(p => p.id !== id));
  }
}


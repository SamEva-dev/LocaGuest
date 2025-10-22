import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DocumentsService } from '../../../services/documents.service';
import { DocumentTemplate } from '../../../models/documents.models';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'use-template',
  standalone: true,
  imports: [CommonModule, TranslateModule,FormsModule],
  templateUrl: './use-template.html'
})
export class UseTemplate implements OnInit {
  private readonly service = inject(DocumentsService);

  @Input() template!: DocumentTemplate;
  @Output() close = new EventEmitter<void>();

  loading = this.service.loading;
  vars = signal<Record<string, string>>({});

  ngOnInit() {
    const v: Record<string, string> = {};
    (this.template.placeholders ?? [
      'landlord.name','landlord.address','tenant.name','tenant.address',
      'tenant.birthDate','property.address','property.type','property.surface',
      'lease.start','lease.end','lease.duration','lease.rent','lease.charges',
      'lease.deposit','city','today'
    ]).forEach(k => v[k] = '');
    this.vars.set(v);
  }

  readonly keys = computed(() => Object.keys(this.vars()));


  async preview() {
    const doc = await this.service.openPreview(this.template.id, this.vars());
    // la modale preview globale sera ouverte depuis le parent
  }

  async generate() {
    const doc = await this.service.generateDoc(this.template.id, this.vars(), 'pdf');
    if (doc.id) await this.service.download(doc.id);
  }

  updateVar(key: string, value: string) {
  this.vars.update(v => ({ ...v, [key]: value }));
}

}

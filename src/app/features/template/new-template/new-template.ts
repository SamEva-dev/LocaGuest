import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TemplateUpsert } from '../../../models/documents.models';
import { DocumentsService } from '../../../services/documents.service';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';


@Component({
  selector: 'new-template',
  standalone: true,
  imports: [CommonModule, TranslateModule,FormsModule],
  templateUrl: './new-template.html'
})
export class NewTemplate {
  private readonly service = inject(DocumentsService);

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  loading = this.service.loading;
  readonly moustaches = '{{ variable }}';


  form: TemplateUpsert = {
    name: 'Bail de location (non meublé)',
    description: 'Contrat de location pour logement vide conforme loi 89',
    category: 'contracts',
    content: defaultLeaseTemplate
  };

  async save() {
    await this.service.createTemplate(this.form);
    this.saved.emit();
    this.close.emit();
  }
}

// ---- Contenu HTML pro avec variables moustaches ----
const defaultLeaseTemplate = `
<h1 style="text-align:center">Bail de location – Logement non meublé</h1>
<p><b>Bailleur :</b> {{landlord.name}}, demeurant {{landlord.address}}</p>
<p><b>Locataire :</b> {{tenant.name}}, né(e) le {{tenant.birthDate}}, demeurant {{tenant.address}}</p>
<p><b>Bien loué :</b> {{property.address}}, {{property.type}}, surface {{property.surface}} m²</p>
<p><b>Durée :</b> {{lease.duration}} (début {{lease.start}}, fin {{lease.end}})</p>
<p><b>Loyer mensuel :</b> {{lease.rent}} € hors charges – <b>Charges :</b> {{lease.charges}} €</p>

<h3>1. Destination des lieux</h3>
<p>Le logement est destiné à l’habitation principale du locataire.</p>

<h3>2. Dépôt de garantie</h3>
<p>Le locataire verse un dépôt de garantie d’un montant de {{lease.deposit}} €.</p>

<h3>3. Obligations du locataire</h3>
<ul>
  <li>Occuper paisiblement les lieux et respecter le règlement intérieur.</li>
  <li>Répondre des dégradations et pertes survenant pendant le bail.</li>
  <li>Souscrire une assurance multirisque habitation.</li>
</ul>

<h3>4. Révision du loyer</h3>
<p>Le loyer pourra être révisé annuellement selon l’indice applicable (IRL).</p>

<h3>5. État des lieux</h3>
<p>Un état des lieux d’entrée et de sortie sera établi contradictoirement.</p>

<h3>6. Résiliation</h3>
<p>Selon les dispositions de la loi du 6 juillet 1989 et ses décrets d’application.</p>

<p style="margin-top:24px">Fait à {{city}}, le {{today}}.<br>
Signature du bailleur&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Signature du locataire</p>
`;

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

interface Language {
  code: string
  label: string
  flag: string // peut être un emoji ou un path d’image
}


@Component({
  selector: 'language-switch',
  imports: [CommonModule, FormsModule],
  templateUrl: './language-switch.html',
  styleUrl: './language-switch.scss',
   changeDetection: ChangeDetectionStrategy.OnPush,
})

export class LanguageSwitch {

  //private translate = inject(TranslateService)

  languages: Language[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' }
  ]

  selectedLang = this.languages[0].code

  constructor(private translate: TranslateService) {
      translate.setDefaultLang('fr');
      translate.use('fr'); // 
  }

  onLangChange(code: string) {
    this.translate.use(code)
    this.selectedLang = code
  }

}

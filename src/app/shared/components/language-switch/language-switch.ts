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

  private translate = inject(TranslateService)

  languages: Language[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' }
  ]

  selectedLang = this.languages[0].code

  constructor() {
    const currentLang = this.translate.currentLang || this.translate.defaultLang || 'en'
    const lang = this.languages.find(l => l.code === currentLang)
    this.selectedLang = lang ? lang.code : this.languages[0].code
  }

  onLangChange(code: string) {
    this.translate.use(code)
    this.selectedLang = code
  }

}

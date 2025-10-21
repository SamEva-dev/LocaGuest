import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'welcome',
  imports: [RouterOutlet,TranslatePipe],
  templateUrl: './welcome.html',
  styleUrl: './welcome.scss'
})
export class Welcome {

  constructor(private translate: TranslateService) {
      translate.setDefaultLang('fr');
      translate.use('fr'); // 
  }
}

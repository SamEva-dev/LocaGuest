import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'welcome',
  imports: [RouterOutlet],
  templateUrl: './welcome.html',
  styleUrl: './welcome.scss'
})
export class Welcome {

  constructor(private translate: TranslateService) {
      translate.setDefaultLang('fr');
      translate.use('fr'); // 
  }
}

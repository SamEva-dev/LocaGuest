import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './help.component.html'
})
export class HelpComponent {
  expandedIndex = signal<number | null>(null);

  faqCategories = [
    {
      key: 'GETTING_STARTED',
      icon: 'ph-rocket-launch',
      questions: ['Q1', 'Q2', 'Q3']
    },
    {
      key: 'PROPERTIES',
      icon: 'ph-buildings',
      questions: ['Q1', 'Q2', 'Q3']
    },
    {
      key: 'TENANTS',
      icon: 'ph-users',
      questions: ['Q1', 'Q2']
    },
    {
      key: 'PAYMENTS',
      icon: 'ph-credit-card',
      questions: ['Q1', 'Q2', 'Q3']
    },
    {
      key: 'DOCUMENTS',
      icon: 'ph-folder-open',
      questions: ['Q1', 'Q2']
    },
    {
      key: 'ACCOUNT',
      icon: 'ph-gear',
      questions: ['Q1', 'Q2', 'Q3']
    }
  ];

  toggleQuestion(categoryIndex: number, questionIndex: number) {
    const index = categoryIndex * 10 + questionIndex;
    if (this.expandedIndex() === index) {
      this.expandedIndex.set(null);
    } else {
      this.expandedIndex.set(index);
    }
  }

  isExpanded(categoryIndex: number, questionIndex: number): boolean {
    return this.expandedIndex() === categoryIndex * 10 + questionIndex;
  }
}

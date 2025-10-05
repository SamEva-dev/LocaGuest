import { Component, HostListener, inject, input, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavBar } from '../../shared/components/nav-bar/nav-bar';
import { SideBar } from '../../shared/components/side-bar/side-bar';
import { FooterBar } from '../../shared/components/footer-bar/footer-bar';
import { MenuItem } from '../../models/menu';
import { CommonModule } from '@angular/common';
import { Theme } from '../../models/theme';
import { TranslatePipe } from '@ngx-translate/core';

type MainTab = 'dashboard' | 'contacts' | 'parametre';

@Component({
  selector: 'app-main-layout',
  imports: [CommonModule, RouterOutlet, NavBar, FooterBar],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout {

   private router = inject(Router);

 activeMainTab = signal<MainTab>('dashboard');

  tabs = ['dashboard','contacts','parametre'] as const; 

  navigate(tab: MainTab) {
    this.activeMainTab.set(tab);
    console.log(`Navigation vers ${tab}`);
    this.router.navigate([`/${tab}`]); // 🔥 navigation réelle
  }

  themes = [
    // Thème Gris
    {
      name: 'Gray',
      header: 'bg-gray-900',
      sidebar: 'bg-gray-800',
      footer: 'bg-gray-900',
      body: 'bg-gray-100',
    },
    // Thème Bleu
    {
      name: 'Blue',
      header: 'bg-blue-900',
      sidebar: 'bg-blue-800',
      footer: 'bg-blue-900',
      body: 'bg-blue-100',
    },
    // Thème Vert
    {
      name: 'Green',
      header: 'bg-green-900',
      sidebar: 'bg-green-800',
      footer: 'bg-green-900',
      body: 'bg-green-100',
    },
    // Thème Violet
    {
      name: 'Purple',
      header: 'bg-purple-900',
      sidebar: 'bg-purple-800',
      footer: 'bg-purple-900',
      body: 'bg-purple-100',
    },
    // Thème Rouge
    {
      name: 'Red',
      header: 'bg-red-900',
      sidebar: 'bg-red-800',
      footer: 'bg-red-900',
      body: 'bg-red-100',
    },
    // Thème Jaune
    {
      name: 'Yellow',
      header: 'bg-yellow-700',
      sidebar: 'bg-yellow-600',
      footer: 'bg-yellow-700',
      body: 'bg-yellow-100',
    },
    // Thème Rose
    {
      name: 'Pink',
      header: 'bg-pink-900',
      sidebar: 'bg-pink-800',
      footer: 'bg-pink-900',
      body: 'bg-pink-100',
    },
    // Thème Indigo
    {
      name: 'Indigo',
      header: 'bg-indigo-900',
      sidebar: 'bg-indigo-800',
      footer: 'bg-indigo-900',
      body: 'bg-indigo-100',
    },
    // Thème Cyan
    {
      name: 'Cyan',
      header: 'bg-cyan-900',
      sidebar: 'bg-cyan-800',
      footer: 'bg-cyan-900',
      body: 'bg-cyan-100',
    },
    // Thème Teal (Turquoise)
    {
      name: 'Teal',
      header: 'bg-teal-900',
      sidebar: 'bg-teal-800',
      footer: 'bg-teal-900',
      body: 'bg-teal-100',
    },
    // Thème Orange
    {
      name: 'Orange',
      header: 'bg-orange-900',
      sidebar: 'bg-orange-800',
      footer: 'bg-orange-900',
      body: 'bg-orange-100',
    },
  ];
  

  selectedTheme = signal(this.themes[0]); // Thème par défaut = Gray

  changeTheme(theme: any) {
    this.selectedTheme.set(theme);
  }

}

import { Component, HostListener, input, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBar } from '../../shared/components/nav-bar/nav-bar';
import { SideBar } from '../../shared/components/side-bar/side-bar';
import { FooterBar } from '../../shared/components/footer-bar/footer-bar';
import { MenuItem } from '../../models/menu';
import { CommonModule } from '@angular/common';
import { Theme } from '../../models/theme';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-main-layout',
  imports: [CommonModule, RouterOutlet, NavBar, SideBar, FooterBar],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout {

  constructor() {
    this.checkScreenSize();
  }

   @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }
  theme = input<Theme>();
  protected readonly title = signal('tailwind-sidebar');

  opened = signal(false);
  mobileSidebar = signal(false);
  isMobile = signal(false); 
  menuInHeader = signal(false);
  mobileHeaderMenu = signal(false);

  Menus: MenuItem[] = [
  {
    title: 'SIDEBAR.DASHBOARD',
    icon: 'ph ph-house',
    route: '/dashboard',
    submenu: true,
    submenuItems: [
      { title: 'Submenu 1', icon: 'ph ph-circle' },
      { title: 'Submenu 2', icon: 'ph ph-circle' },
      { title: 'Submenu 3', icon: 'ph ph-circle' },
    ],
    open: false,
  },
  { 
    title: 'SIDEBAR.CONTRACTS', 
    icon: 'ph ph-envelope', 
    route: '/contacts', 
   },
   { title: 'SIDEBAR.FILES',  
    route: '/documents',
    icon: 'ph ph-folder' },
  { 
    title: 'SIDEBAR.FINANCIALS', 
    route: '/financial', 
    icon: 'ph ph-bank' 
  },
  { 
    title: 'SIDEBAR.SETTINGS', 
    route: '/settings', 
    spacing: true,
    icon: 'ph ph-gear' 
  },
  { title: 'SIDEBAR.ACCOUNTS', icon: 'ph ph-user', spacing: true },
  { title: 'SIDEBAR.SCHEDULE', icon: 'ph ph-calendar' },
  { title: 'SIDEBAR.SEARCH_MENU', icon: 'ph ph-magnifying-glass' },
  { title: 'SIDEBAR.ANALYTICS', icon: 'ph ph-chart-bar' },
  
];


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


  toggleSidebar() {
    this.opened.set(!this.opened());
  }

  toggleSubmenu(menu: MenuItem) {
    this.Menus.forEach(m => {
    if (m !== menu) m.open = false;
  });
    menu.open = !menu.open;
  }

  checkScreenSize() {
    this.isMobile.set(window.innerWidth < 768); // md = 768px
    if (this.isMobile()) {
      this.opened.set(false); // désactive sidebar desktop
    }
  }

}

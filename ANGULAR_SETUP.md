# 🎨 LocaGuest Frontend - Angular 20 Setup

## ✅ Ce qui a été créé (Sprint 0 - Partie 1)

### 1. Configuration Base
- **Angular 20** avec zoneless change detection activé
- **Tailwind CSS 4** configuré avec thème personnalisable
- **Phosphor Icons** intégrés
- **ngx-translate** pour i18n (FR/EN)
- **Standalone components** (pas de NgModule)

### 2. Design System Sexy 🎨

**Fichier**: `tailwind.config.js`
- Variables CSS personnalisables (primary, secondary, accent)
- Couleurs par type de tab (property/tenant/relation)
- Animations modernes (fade-in, slide-up, scale-in, shimmer)
- Glassmorphism, gradients, hover effects

**Fichier**: `src/styles/themes.scss`
- Thème Light + Dark avec CSS variables
- Scrollbar custom
- Classes utilitaires (.glass, .gradient-primary, .hover-lift, etc.)
- Animations globales (pulse-glow)

### 3. Core Services (Signals)

#### ThemeService (`core/services/theme.service.ts`)
```typescript
// Signals
readonly theme = signal<Theme>('auto'); // 'light' | 'dark' | 'auto'
readonly isDark = signal<boolean>(false);
readonly customColors = signal<CustomColors | null>(null);

// Methods
toggle(): void // Toggle light/dark
setTheme(theme: Theme): void
setCustomColors(colors: CustomColors): void // USER can customize!
resetColors(): void
```

Fonctionnalités:
- Détection auto système (prefers-color-scheme)
- Sauvegarde localStorage
- **Personnalisation couleurs par l'utilisateur** (dans Paramètres)
- Application immédiate via CSS variables

#### TabManagerService (`core/services/tab-manager.service.ts`)
```typescript
// Signals
readonly tabs = signal<DynamicTab[]>([...]);
readonly activeTabId = signal<string>('summary');
readonly activeTab = computed(() => ...);

// Methods
openTab(tab): void // Ouvre ou active tab existant
openProperty(id, name, data): void
openTenant(id, name, data): void
openRelation(propertyId, tenantId, title, data): void
closeTab(tabId): void
activateTab(tabId): void
closeAll(): void
getTabColorClass(type): string // Couleur selon type
```

Gestion complète des tabs dynamiques avec:
- Tab "Sommaire" non-closable
- Tabs propriété (emerald)
- Tabs locataire (amber)
- Tabs relation (indigo)
- Détection doublons (n'ouvre pas 2x la même tab)

#### AuthService (`core/services/auth.service.ts`)
```typescript
// Signals
readonly user = signal<User | null>(null);
readonly isAuthenticated = computed(() => ...);
readonly permissions = computed(() => ...);
readonly roles = computed(() => ...);

// Methods
login(credentials): Observable<LoginResponse>
logout(): void
refreshAccessToken(): Observable<LoginResponse | null>
hasPermission(permission): boolean
hasRole(role): boolean
getAccessToken(): string | null
```

Fonctionnalités:
- Login via AuthGate (RS256 JWT)
- Parsing token JWT (extraction user, roles, permissions, tenant_id)
- Sauvegarde localStorage
- Computed signals pour réactivité
- Auto-refresh token (via interceptor)

### 4. HTTP Interceptor

**Fichier**: `core/interceptors/auth.interceptor.ts`
- Ajoute automatiquement `Authorization: Bearer {token}` sur toutes les requêtes
- **Auto-refresh** si 401 Unauthorized
- Retry automatique après refresh réussi

### 5. Guards

**Fichier**: `core/guards/auth.guard.ts`
- `authGuard`: Protège routes authentifiées
- `guestGuard`: Protège routes publiques (login/register)
- `permissionGuard(permission)`: Protège par permission

Usage:
```typescript
{
  path: 'dashboard',
  canActivate: [authGuard],
  loadComponent: () => import('./features/dashboard/dashboard.component')
}
```

### 6. Traductions i18n

**Fichier**: `src/assets/i18n/fr.json` (déjà rempli)
- Toutes les clés traduites
- Sections: AUTH, DASHBOARD, CONTRACTS, FINANCIAL, ANALYTICS, SETTINGS, etc.

Usage:
```html
<h1>{{ 'DASHBOARD.TITLE' | translate }}</h1>
```

---

## 🎨 Thème Personnalisable

### Couleurs par défaut

**Light Mode**:
- Primary: Amber/Orange (#f59e0b)
- Secondary: Emerald (#10b981) → Biens
- Accent: Indigo (#6366f1) → Relations

**Dark Mode**:
- Fond: Slate sombre (#0f172a, #1e293b)
- Couleurs ajustées pour contraste

### Personnalisation utilisateur

Dans **Paramètres → Thème** (à implémenter):
```typescript
themeService.setCustomColors({
  primary: '#ff6b6b', // Rouge custom
  secondary: '#4ecdc4', // Teal custom
  accent: '#ffe66d' // Jaune custom
});
```

CSS variables mises à jour dynamiquement !

---

## 🚀 Prochaines étapes (Sprint 0 - Partie 2)

### À créer immédiatement:
1. **Layout principal** (`layout/main-layout.component.ts`):
   - Header fixe (logo, lang switcher, user menu, theme toggle)
   - TabBar sticky (tabs horizontaux scrollables)
   - Body avec scroll (contenu tab active)
   - Footer fixe (copyright, version)

2. **Composants Auth** (`features/auth/`):
   - Login component (sexy animations, i18n)
   - Register component (facultatif MVP)

3. **Dashboard Sommaire** (`features/dashboard/`):
   - Switch "Mes Biens" / "Locataires"
   - Grid/List toggle
   - Filtres + Search bar
   - Cards biens/locataires
   - Boutons "Voir détail" → ouvre tab dynamique

4. **Composants UI réutilisables** (`shared/ui/`):
   - Button (variants: primary, secondary, ghost, danger)
   - Card (glass effect, hover lift)
   - Input, Select, Checkbox
   - Badge, Tag
   - Modal, Tooltip
   - Loader, Skeleton

5. **Routes** (`app.routes.ts`):
```typescript
export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes')
  },
  {
    path: '',
    canActivate: [authGuard],
    component: MainLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component')
      },
      // ... autres routes
    ]
  }
];
```

---

## 🧪 Test rapide

```bash
cd "e:\Gestion Immobilier\locaGuest"

# Install dependencies (si pas fait)
npm install

# Start dev server
npm start

# App disponible sur http://localhost:4200
```

---

## 📊 Stack Technique Complète

| Couche | Technologie |
|--------|-------------|
| **Framework** | Angular 20 (standalone, zoneless) |
| **State** | Signals (computed, effect) |
| **Styling** | Tailwind CSS 4 + SCSS |
| **Icons** | Phosphor Icons |
| **i18n** | ngx-translate |
| **HTTP** | HttpClient + Interceptors |
| **Routing** | Angular Router + Guards |
| **Auth** | JWT RS256 (AuthGate) |

---

## 🎯 Résumé des fonctionnalités modernes

✅ **Zoneless**: Pas de NgZone, performances maximales  
✅ **Signals**: Réactivité fine-grained, computed automatiques  
✅ **Standalone**: Pas de NgModule, tree-shakable  
✅ **Control Flow**: `@if`, `@for`, `@switch` (pas `*ngIf`)  
✅ **Thème Dark/Light**: Auto + toggle + personnalisable  
✅ **Tabs dynamiques**: Gestion complète avec colors  
✅ **Auth RS256**: Validation JWT via JWKS AuthGate  
✅ **Auto-refresh token**: Transparent pour l'user  
✅ **i18n**: FR/EN, extensible  
✅ **Animations**: Fade, slide, scale, shimmer, glassmorphism  
✅ **Responsive**: Mobile-first avec Tailwind  

---

## 🔥 Ce qui rend le design SEXY

1. **Glassmorphism** (.glass class):
   - Fond semi-transparent
   - Backdrop blur
   - Border subtil
   - Shadow élégante

2. **Gradients dynamiques**:
   - `.gradient-primary`, `.gradient-secondary`, `.gradient-accent`
   - `.gradient-mesh` (multiple radial gradients)
   - `.text-gradient` (texte avec gradient)

3. **Hover effects**:
   - `.hover-lift`: Translate-Y + shadow
   - `.hover-glow`: Box-shadow colorée
   - Transitions smooth (0.2-0.3s)

4. **Animations**:
   - Fade-in (apparition douce)
   - Slide-up/down (entrées/sorties)
   - Scale-in (zoom subtle)
   - Shimmer (loading skeleton)
   - Pulse-glow (attention sur éléments)

5. **Scrollbar custom**: Fine, colorée, hover feedback

6. **Couleurs par type**:
   - Property: Emerald (nature, stabilité)
   - Tenant: Amber (chaleur, humain)
   - Relation: Indigo (connexion, lien)

---

## ✅ Checklist avant Sprint 1

- [x] Config Angular 20 zoneless
- [x] Tailwind 4 + thème personnalisable
- [x] Phosphor Icons
- [x] i18n (ngx-translate)
- [x] ThemeService (signals)
- [x] TabManagerService (signals)
- [x] AuthService (signals + RS256)
- [x] Auth interceptor (auto-refresh)
- [x] Guards (auth, guest, permission)
- [ ] Layout principal (header/tabbar/body/footer)
- [ ] Login component
- [ ] Dashboard Sommaire (switch biens/locataires)
- [ ] Composants UI de base (Button, Card, Input)

**On est prêt à créer l'UI ! 🚀**

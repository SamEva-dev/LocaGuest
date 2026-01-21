# LocaGuest — Documentation Produit (Front)

Version: *générée depuis le code front Angular (LocaGuest)*

Ce document décrit **le produit LocaGuest** (expérience utilisateur et fonctionnalités) tel qu’implémenté côté front, ainsi que les **parcours**, les **écrans**, les **règles métier visibles**, et les **points d’intégration API** utilisés. Il sert de base à la documentation officielle et à une base de connaissance pour un chatbot “front-only”.

---

## 1) Vision du produit

LocaGuest est un logiciel SaaS de gestion locative destiné à :

- **Propriétaires particuliers**
- **Investisseurs multi-biens**
- **Petits gestionnaires immobiliers** (≈ 20–50 biens)

Le différenciateur produit est une expérience **simple**, **moderne** et orientée **automatisation** (contrats, documents, suivi des paiements, tableaux de bord, alertes/notifications, analyses).

---

## 2) Glossaire (termes métiers)

- **Bien / Propriété**: logement (appartement/maison/…), éventuellement en colocation (multi-chambres) ou en Airbnb.
- **Locataire**: occupant rattaché à un bien via un **contrat**.
- **Contrat**: bail (meublé/non-meublé) avec dates, loyer, charges, dépôt de garantie, statut.
- **Avenant**: modification contractuelle (loyer/charges/dates/chambre/occupants…), avec un statut de signature.
- **EDL (État des lieux)**: document d’entrée/sortie, pouvant être **brouillon** ou **finalisé**.
- **Paiement**: encaissement (mensuel) lié à un contrat/bien/locataire.
- **Quittance**: PDF téléchargeable pour certains paiements payés.
- **Caution / Dépôt de garantie**: montant attendu/reçu/restant, reçu PDF téléchargeable.
- **Facture (échéance)**: “RentInvoice” visible côté locataire (PDF téléchargeable).
- **Organisation**: “tenant/organization” au sens SaaS (entreprise / groupe / propriétaire), issu du token.
- **Permissions**: autorisations (lecture/écriture/génération documents/analytics, etc.).

---

## 3) Architecture UI & Navigation

### 3.1 Routes principales

Routes publiques :

- `/` : landing
- `/login` : connexion (prelogin, password, 2FA)
- `/register` : inscription (création organisation) ou acceptation invitation
- `/forgot-password`
- `/privacy`, `/terms`, `/imprint`
- `/features`, `/contact`, `/help`

Routes “app” (protégées par authentification) :

- `/app/dashboard`
- `/app/mon-locaguest`
- `/app/contracts`
- `/app/documents`
- `/app/profitability`
- `/app/rentability`
- `/app/settings`

### 3.2 Layout global

Dans l’espace `/app`, l’utilisateur dispose :

- **Header** :
  - logo / nom d’organisation
  - toggle thème (clair/sombre)
  - menu notifications (actuellement utilisé pour le sondage satisfaction)
  - menu utilisateur (accès “Mon abonnement”, déconnexion)
- **Barre d’onglets (tabs fixes)** :
  - Tableau de bord
  - Mon LocaGuest
  - Contrats
  - Documents
  - Rentabilité (Analytics)
  - Calcul rentabilité (simulateur)
  - Paramètres

### 3.3 “Mon LocaGuest” = navigation interne par onglets

`/app/mon-locaguest` utilise un gestionnaire d’onglets internes :

- Onglet **Résumé** (toujours présent)
- Onglets dynamiques **Bien** et **Locataire** (ouvrables/fermables)
- Onglet “Relation” (propriété ↔ locataire) prévu

Ces onglets internes permettent de travailler “comme un logiciel de gestion”, en gardant plusieurs fiches ouvertes.

---

## 4) Authentification & Sécurité

### 4.1 Connexion (Login)

Parcours :

1. **Prelogin** avec email
   - si l’utilisateur existe → étape password
   - sinon → redirection vers inscription
2. **Login email/mot de passe**
3. Si le backend répond `requiresMfa` + `mfaToken` :
   - saisie **code 2FA (6 chiffres)** ou **recovery code**
   - option “remember device” (mémoriser l’appareil)
4. Stockage des tokens via `AuthService.applyLogin`.

Fonctionnalités notables :

- Gestion d’erreurs UI : invalid credentials, compte verrouillé, erreurs réseau.
- Gestion de “remember me”.
- OAuth : Google / Facebook (selon config backend), avec possibilité “requiresRegistration”.

### 4.2 Permissions / contrôles d’accès

Certaines routes et sous-onglets sont protégés par **permissions** (exemples)

- ContractsRead
- DocumentsRead / DocumentsUpload / DocumentsDelete / DocumentsGenerate
- AnalyticsRead
- PropertiesRead
- TenantsRead
- BillingRead
- UsersRead
- TenantSettingsRead

Effet UI : un utilisateur peut voir moins de sous-onglets / actions selon les permissions.

---

## 5) Tableau de bord (`/app/dashboard`)

Objectif : donner une vue d’ensemble rapide de l’activité.

### 5.1 Filtres

- **Mois** (1–12)
- **Année** (liste fournie par API)
- bouton “Actualiser”

### 5.2 Statistiques (cards)

Cartes principales (selon données disponibles) :

- Nombre de biens
- Nombre de locataires actifs
- Taux d’occupation
- Revenu mensuel
- **Taux de collection** (paiements) + payé/total
- **En retard** + montant total en retard

### 5.3 Graphiques

- Occupancy chart (par mois/année)
- Revenue chart (par mois/année)

### 5.4 Activités récentes

- feed d’événements (type info/success/warning)

### 5.5 Actions rapides

Raccourcis :

- Biens
- Locataires
- Contrats
- Rentabilité

---

## 6) Mon LocaGuest (`/app/mon-locaguest`)

### 6.1 Onglet Résumé (Summary)

Fonctions :

- **Basculer** entre vue “Biens” et “Locataires”
- **Mode d’affichage** : cartes ou tableau
- **Recherche** (debounce)
- **Filtres** :
  - Biens : type d’utilisation (location complète / colocation / airbnb)
  - Biens : statut (Occupied/Vacant/PartiallyOccupied/Reserve)
  - Locataires : statut (Active/Reserved/Inactive)
- **Pagination** (page/pageSize/total)

Actions sur items (menu “…”):

- Biens : voir détail / modifier / supprimer (suppression bloquée si occupé/réservé)
- Locataires : voir détail / modifier / supprimer (suppression bloquée si contrat actif)

Création :

- Boutons **Ajouter un locataire** et **Ajouter un bien** (ouvre des formulaires “AddTenantForm / AddPropertyForm”).

### 6.2 Fiche Bien (Property Detail Tab)

La fiche bien est un onglet interne avec sous-onglets :

- Informations
- Locataires
- Contrats

Données chargées :

- Détails bien
- Paiements du bien
- Contrats du bien
- Locataires associés
- Résumé financier
- Documents du bien (catégorisés)

#### 6.2.1 Sous-onglet Informations

Fonctions typiques (selon UI) :

- Visualiser / modifier les informations du bien
- Gestion du statut
- Gestion de caractéristiques (surface, équipements, diagnostics, etc.)
- Champs “financiers” (loyer/charges/dépôt…)
- Colocation : nombre de chambres, taux d’occupation, etc.
- Téléchargement/impression “fiche bien” (PDF)

#### 6.2.2 Sous-onglet Locataires (Property Tenants)

Objectif : gérer les occupants actuels et l’historique.

Concepts clés :

- **Locataire actuel** = contrat `Active`
- **Futur occupant** = contrat `Signed` (réservé)
- **Historique** = contrat `Terminated` ou endDate dépassée

Informations enrichies affichées par locataire :

- Préavis en cours (noticeEndDate)
- Statut dossier : contrat signé, EDL entrée, CNI, assurance, etc.
- Statut paiement : payé/en attente/en retard

Actions possibles :

- Ouvrir fiche locataire (en passant `fromProperty` pour afficher le badge “Associé à …”)
- Ouvrir locataire directement sur l’onglet “documents” (pour EDL)
- Créer EDL entrée (wizard)
- Créer EDL sortie (wizard, nécessite EDL entrée)
- Renouveler contrat (wizard)
- Créer un avenant (wizard)
- Dissocier un locataire (bloqué si contrat Signed/Active)

Règles importantes visibles :

- **EDL entrée requis** avant EDL sortie.
- **Dissociation bloquée** si contrat encore Signé/Actif ou documents liés (selon message).

#### 6.2.3 Sous-onglet Contrats (Property Contracts)

Objectif : gérer le cycle de vie du bail, documents, avenants et EDL.

Statuts de contrat (cycle affiché) :

- Draft (Brouillon)
- Pending (En attente)
- Signed (Signé / Réservé)
- Active
- Expiring
- Terminated
- Expired
- Cancelled

Actions clés :

- Créer un contrat (wizard)
- Ajouter un “contrat papier” (wizard)
- Générer PDF contrat (DocumentsService.generateContractPdf)
- Upload d’une version signée (upload document PDF)
- Marquer comme signé (modal)
- Envoyer pour signature électronique (prévu, selon intégration future)

Avenants :

- Liste/chargement par contrat
- Télécharger PDF de l’avenant (doc attaché)
- Marquer avenant comme signé
- Envoyer avenant pour signature (multi-occupants possible)
- Éditer / supprimer avenant

EDL (inventaires) :

- Chargement EDL par contrat (getByContract)
- Distinction **brouillon** vs **finalisé**
- Finaliser EDL (irréversible)
- Suppression EDL (interdite si finalisé ou contrat actif)

### 6.3 Fiche Locataire (Tenant Detail Tab)

La fiche locataire est un onglet interne avec sous-onglets :

- Contrats
- Paiements
- Historique paiements
- Documents

Données affichées :

- Informations personnelles : naissance, nationalité, pièce d’identité…
- Adresse
- Situation professionnelle
- Contact d’urgence
- Garant
- Dossier administratif (fileStatus, documents manquants, etc.)
- Statut locatif : occupation courante (bien + dates + loyer + charges)
- Situation financière (partiellement calculée côté front)
- Caution (dépôt) + badge payé/restant

Actions majeures :

- Imprimer “fiche locataire” (PDF)
- Ouvrir la fiche bien depuis un contrat
- Voir le contrat via viewer modal
- Télécharger le PDF du contrat
- Créer contrat (si locataire non actif)

Actions contractuelles (selon statut) :

- Renouveler (si Active/Expiring et <= 60 jours de fin)
- Avenant (si Active/Signed)
- Préavis (si Active/Signed) : annulation possible si déjà en préavis
- EDL entrée (si Signed et date début >= aujourd’hui)
- EDL sortie (si Active/Terminated)

Documents & signatures :

- Gestionnaire de documents
- Statut documents de contrat (draft/partial/fully signed)

Factures/échéances :

- Liste “rent invoices” par locataire
- Téléchargement PDF par facture

Caution (deposit) :

- Récupération dépôt par contrat
- Téléchargement reçu de caution PDF

Avatar locataire :

- Upload d’une image (stockée côté navigateur via `AvatarStorageService`)

---

## 7) Contrats (page globale `/app/contracts`)

Cette page fournit une vue transverse de tous les contrats.

Fonctions :

- Statistiques (actifs, expirent bientôt, revenu mensuel, total locataires…)
- Liste des contrats + filtres (search / statut / type)
- Création de contrat
- Enregistrement de paiements
- Résiliation
- Consultation du contrat (viewer)

Modules liés :

- Avenants
- Inventaires entrée/sortie (wizards)
- Documents

---

## 8) Documents (page globale `/app/documents`)

Objectif : gestion documentaire transverse.

### 8.1 Chargement

- Charge **tous les documents** via `GET /api/Documents/all`

### 8.2 Filtres

- Recherche full-text (nom fichier, tenantName, propertyName, description)
- Filtre catégorie
- Filtre type
- Tri par date desc

### 8.3 Actions

- Télécharger
- Visualiser (ouvre un nouvel onglet avec Blob URL)

---

## 9) Paiements, quittances & dépôts

### 9.1 Paiements (locataire)

- Liste des paiements du locataire
- Statistiques (total attendu/payé/restant, etc. selon API)
- Filtre année + statut
- Ajout de paiement (modal)
- Ajout de dépôt (modal)
- Téléchargement quittance : uniquement si status = Paid / PaidLate

### 9.2 Paiements (bien)

- Liste des paiements du bien
- Statistiques
- Filtre année + statut

### 9.3 Dépôt de garantie

- Statut attendu/reçu/restant
- Badge “paid/unpaid/remaining”
- Reçu PDF téléchargeable

---

## 10) Analytique — Rentabilité (page `/app/profitability`)

Objectif : pilotage financier global.

- Statistiques de rentabilité (revenus/dépenses/profit/ratio)
- Évolution revenus/dépenses sur N mois (3/6/9/12)
- Performance par bien (ROI etc.)
- Sélection d’année

UI : graphique Chart.js.

---

## 11) Simulateur “Calcul de rentabilité” (`/app/rentability`)

Objectif : réaliser des simulations d’investissement par scénarios.

Fonctions :

- Gestion de scénarios (liste, sauvegarde auto)
- Assistant par étapes :
  1. Contexte
  2. Revenus
  3. Charges
  4. Financement
  5. Fiscalité
  6. Résultats
  7. Analyse

Caractéristiques :

- Auto-save (debounce)
- Export : PDF / Excel / JSON
- Pré-remplissage à partir d’un **bien existant** (mapping des champs)

---

## 12) Paramètres (`/app/settings`)

Sous-onglets :

- Profil
- Organisation
- Équipe
- Sécurité
- Notifications
- Facturation
- Préférences
- Interface

### 12.1 Profil

- Données profil (nom, email, téléphone, company, role, bio)
- Upload photo (limite taille/type)
- Sauvegarder / reset

### 12.2 Notifications

Paramètres de notification (exemples) :

- paymentReceived, paymentOverdue, paymentReminder
- contractSigned, contractExpiring, contractRenewal
- maintenanceRequest, maintenanceCompleted
- systemUpdates, marketingEmails

### 12.3 Sécurité

- Changement mot de passe
- 2FA (composant dédié)

### 12.4 Facturation

- Abonnement en cours, trial
- Factures
- Portail client (Stripe) pour moyens de paiement
- Annulation abonnement

### 12.5 Préférences

- Dark mode
- Langue
- Timezone, format date, devise

### 12.6 Zone dangereuse

- Désactivation/suppression compte (confirmation texte `SUPPRIMER`)

---

## 13) Guides “comment faire” (parcours utilisateurs)

### 13.1 Créer un bien

- Aller dans `Mon LocaGuest` → bouton “Ajouter un bien”
- Remplir les informations générales
- Définir type d’usage :
  - Location complète
  - Colocation (rooms)
  - Airbnb
- Enregistrer

### 13.2 Ajouter un locataire

- `Mon LocaGuest` → “Ajouter un locataire”
- Renseigner identité / contact

### 13.3 Associer un locataire à un bien (créer un contrat)

- Ouvrir fiche bien → sous-onglet Locataires ou Contrats
- Ajouter un locataire disponible
- Créer un contrat avec : dates, loyer, charges, dépôt

### 13.4 Générer et télécharger un contrat PDF

- Fiche bien → Contrats → action “Générer PDF”

### 13.5 Signer un contrat

Deux stratégies :

- **Papier** : upload du PDF signé puis “marquer comme signé”
- **Électronique** : prévu (workflow existant pour avenants)

### 13.6 Créer un EDL d’entrée / sortie

- EDL Entrée : contrat Signed (avant entrée)
- EDL Sortie : nécessite EDL entrée + contrat Active (ou Terminated)
- Finaliser EDL : action irréversible

### 13.7 Enregistrer un paiement & générer une quittance

- Fiche locataire → Paiements
- Ajouter paiement
- Si payé, télécharger quittance PDF

### 13.8 Gérer la caution

- Fiche locataire → Paiements → “Ajouter dépôt”
- Télécharger reçu de caution

### 13.9 Calculer la rentabilité d’un bien

- Aller sur `Calcul rentabilité`
- Optionnel : sélectionner un bien pour pré-remplissage
- Compléter étapes 1–5
- Lancer calcul → résultats + analyse
- Sauvegarde auto et export

---

## 14) Erreurs & messages fréquents (UX)

- Accès refusé : permissions insuffisantes (redirect `/forbidden` ou toast)
- Suppression bien : bloquée si occupé / réservé / chambres occupées
- Suppression locataire : bloquée si contrats actifs
- Dissociation locataire : bloquée si contrat Signed/Active ou documents liés
- EDL sortie : bloqué si aucun EDL entrée
- Quittance : disponible uniquement pour paiements “Paid / PaidLate”

---

## 15) Base de connaissance — Chatbot (front-only)

Cette section est conçue pour un chatbot côté front. Elle donne des “intents” (thèmes), des synonymes, et des exemples de formulations.

### 15.1 Règles chatbot (produit)

- Le chatbot doit répondre avec :
  - **chemin d’écran** (où cliquer)
  - **règles métier** (ce qui est autorisé/bloqué)
  - **termes** (définition rapide)
- Il doit comprendre le langage courant (synonymes ci-dessous).

### 15.2 Entités (à extraire)

- `property` (bien): nom, code, ville
- `tenant` (locataire): nom, code, email
- `contract`: statut, dates, type
- `document`: type, catégorie, nom de fichier
- `payment`: mois, année, statut, montant
- `deposit`: attendu/reçu/restant
- `inventory`: entrée/sortie, finalisé/brouillon
- `period`: mois/année, “ce mois-ci”, “l’an dernier”, etc.

### 15.3 Synonymes / expressions courantes

- “bien” = logement, appart, appartement, maison, studio, propriété
- “locataire” = occupant
- “bail” = contrat
- “avenant” = modification de bail
- “état des lieux” = EDL
- “quittance” = reçu de loyer
- “caution” = dépôt de garantie
- “retard” = impayé, en souffrance, pas payé
- “résilier” = terminer, rompre, mettre fin
- “préavis” = départ, notification de départ

### 15.4 Intents (thèmes) + exemples d’utterances

#### Intent: `NAVIGATE_DASHBOARD`

- “où je vois mes stats ?”
- “je veux le tableau de bord”
- “c’est où l’occupation et les revenus ?”

Réponse attendue : `Onglet Tableau de bord` + rappel filtres mois/année.

#### Intent: `CREATE_PROPERTY`

- “ajouter un appartement”
- “créer un bien”
- “enregistrer une maison”

Réponse attendue : `Mon LocaGuest` → `Ajouter un bien`.

#### Intent: `CREATE_TENANT`

- “ajouter un locataire”
- “créer un occupant”

Réponse attendue : `Mon LocaGuest` → `Ajouter un locataire`.

#### Intent: `ASSIGN_TENANT_TO_PROPERTY`

- “associer un locataire à un bien”
- “mettre un locataire dans l’appartement”
- “faire un contrat pour ce locataire”

Réponse attendue : fiche bien → Locataires/Contrats → associer → créer contrat.

#### Intent: `GENERATE_CONTRACT_PDF`

- “générer le bail en pdf”
- “télécharger le contrat”

Réponse attendue : fiche bien → Contrats → Générer PDF.

#### Intent: `UPLOAD_SIGNED_CONTRACT`

- “j’ai signé le bail, comment je l’ajoute ?”
- “mettre le contrat signé”

Réponse attendue : fiche bien → Contrats → Upload PDF signé → Marquer signé.

#### Intent: `CREATE_INVENTORY_ENTRY`

- “faire l’état des lieux d’entrée”
- “edl entrée”

Règle : contrat `Signed` + date début >= aujourd’hui.

#### Intent: `CREATE_INVENTORY_EXIT`

- “faire l’état des lieux de sortie”
- “edl sortie”

Règle : nécessite EDL entrée.

#### Intent: `RECORD_PAYMENT`

- “enregistrer un loyer”
- “ajouter un paiement”

Réponse attendue : fiche locataire → Paiements → Ajouter paiement.

#### Intent: `DOWNLOAD_RECEIPT`

- “je veux la quittance”
- “télécharger le reçu du loyer”

Règle : paiement status Paid / PaidLate.

#### Intent: `DEPOSIT`

- “enregistrer la caution”
- “télécharger le reçu de caution”

Réponse attendue : fiche locataire → Paiements → Dépôt.

#### Intent: `DOCUMENTS_SEARCH`

- “retrouver un document”
- “où est le pdf de …”

Réponse attendue : Onglet Documents → recherche + filtres.

#### Intent: `PROFITABILITY_ANALYTICS`

- “voir la rentabilité globale”
- “mes revenus et dépenses”

Réponse attendue : Onglet Rentabilité (analytics) + filtre année/période.

#### Intent: `RENTABILITY_SIMULATOR`

- “simuler un investissement”
- “calculer la rentabilité d’un bien”

Réponse attendue : Onglet Calcul rentabilité + étapes + exports.

#### Intent: `SETTINGS`

- “changer la langue”
- “activer le mode sombre”
- “changer mon mot de passe”
- “gérer mon abonnement”

Réponse attendue : Onglet Paramètres + sous-onglet adapté.

---

## 16) Notes d’implémentation (pour intégration chatbot)

- Les libellés sont majoritairement dans `assets/i18n/fr.json` via `@ngx-translate/core`.
- Le chatbot peut exploiter les mêmes clés (ex: `PROPERTY.STATUS_OCCUPIED`) pour des réponses i18n.
- Navigation recommandée : le chatbot doit proposer des actions (“ouvrir l’onglet Documents”, “aller à Mon LocaGuest”, etc.).

---

## 17) Éléments encore “à confirmer” côté produit

Certains comportements semblent partiellement “stub” ou dépendants backend :

- Envoi contrat pour signature électronique (mention “en cours d’implémentation”).
- Certains calculs financiers (solde mois/arriérés) sont marqués TODO côté UI.

---

Fin du document.

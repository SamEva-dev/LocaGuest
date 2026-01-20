# LocaGuest - Documentation produit (reference officielle)

Version: v1.0 (brouillon base produit)

> Objectif: ce document decrit en detail LocaGuest (front Angular) afin de servir a la fois:
> - de documentation officielle (help center)
> - de base de connaissance pour un chatbot integre au front (assistance utilisateur)
>
> Notes:
> - Cette documentation se base sur les fonctionnalites et ecrans observes dans le front Angular (standalone components, routing, onglets, modales, wizards) et sur les contrats d'API appeles par le front.
> - Certaines fonctionnalites peuvent etre en cours de finalisation (indiquees comme "en preparation" ou "selon configuration back").

---

## Table des matieres

1. [Vue d'ensemble](#vue-densemble)
2. [Concepts et glossaire](#concepts-et-glossaire)
3. [Acces, comptes et securite](#acces-comptes-et-securite)
4. [Navigation et interface](#navigation-et-interface)
5. [Dashboard](#dashboard)
6. [Mon LocaGuest (coeur metier)](#mon-locaguest-coeur-metier)
7. [Contrats](#contrats)
8. [Documents](#documents)
9. [Profitabilite](#profitabilite)
10. [Calcul de rentabilite (simulateur)](#calcul-de-rentabilite-simulateur)
11. [Parametres](#parametres)
12. [Abonnement et plans](#abonnement-et-plans)
13. [Permissions et roles](#permissions-et-roles)
14. [Regles metier importantes](#regles-metier-importantes)
15. [FAQ + formulations en langage courant](#faq--formulations-en-langage-courant)
16. [Annexes](#annexes)

---

## Vue d'ensemble

LocaGuest est un SaaS de gestion locative structure autour de 3 piliers:

1) **Pilotage**: Dashboard + statistiques (occupation, revenus, collection des loyers, retards, activites).

2) **Operationnel**: gestion des biens, locataires, contrats, paiements, depot de garantie (caution), etats des lieux, documents.

3) **Decisionnel**: onglet Profitabilite (KPI et evolution) + onglet Calcul de rentabilite (simulateur multi-scenarios avec TRI/NPV, etc.).

Le produit est concu en **multi-organisation (multi-tenant)**: l'utilisateur appartient a une organisation (equipe), avec un branding (logo, couleurs) et des permissions.

---

## Concepts et glossaire

### Entites principales

- **Organisation**: votre "compte entreprise" dans LocaGuest. Elle a un nom, un email, un telephone, un site web (optionnel) et un branding (logo + couleurs). L'abonnement est associe a l'organisation.

- **Bien (Property)**: logement (appartement, maison, studio, etc.). LocaGuest gere:
  - informations administratives (code interne, adresse)
  - caracteristiques (type, surface, pieces)
  - informations financieres (prix d'achat, charges, taxes, taux de vacance, etc.)
  - usage (long terme, courte duree, mixte)

- **Locataire (Tenant)**: personne (ou groupe) occupant un bien. Contient profil, contacts, documents, et historique des paiements.

- **Relation**: vue "croisee" Bien <-> Locataire (quand un locataire occupe un bien). Permet un suivi consolide.

- **Contrat**: bail / contrat de location (meuble, non-meuble). Contient dates, loyer, charges, depot, statut.

- **Avenant (Addendum)**: modification formelle d'un contrat (loyer, dates, colocataires/occupants, etc.). Peut etre "draft" puis "signed".

- **Preavis / Rupture**: processus de fin de contrat (terminaison) avec date et motif.

- **Renouvellement**: prolongation du contrat avec nouvelle date de fin.

- **Paiement**: enregistrement d'un paiement (montant, methode, date). Peut etre lie a une echeance.

- **Quittance / Facture de loyer**: document genere (PDF) correspondant a une periode.

- **Depot de garantie (Caution)**: somme attendue, recu, reste du, statut.

- **Etat des lieux (EDL)**: entree / sortie, avec checklist, photos, signatures.

- **Document**: piece jointe (PDF, image, etc.) classee par categorie/type.

### Statuts (principaux)

- Statut d'un **bien**: par exemple Occupied / Vacant / Archived (selon back).
- Statut d'un **contrat**: Active / Terminated / Expired / Pending, etc. (selon back).
- Statut d'un **paiement**: Paid / Due / Overdue, etc. (selon back).
- Statut d'un **avenant**: Draft / Signed (en pratique, le front verifie sur `signatureStatus`).

### Termes usuels (synonymes utiles)

- Bien = logement = appartement = maison = propriete
- Locataire = occupant = resident
- Depot = caution
- EDL = etat des lieux
- Quittance = recu de loyer
- Rentabilite (simulateur) = calcul ROI = projection

---

## Acces, comptes et securite

### Pages publiques (non connecte)

- Accueil / Landing
- A propos
- Contact
- Terms (conditions)
- Privacy (confidentialite)
- Security (securite)

### Authentification

LocaGuest utilise un service d'authentification (AuthGate) expose via des endpoints type `/api/Auth`.

Fonctionnalites:

- **Inscription (Register)**
  - Creation de compte utilisateur.
  - Selon configuration, activation via email (verification).

- **Connexion (Login)**
  - Email + mot de passe.
  - Gestion d'erreurs: identifiants invalides, compte non verifie, etc.

- **Mot de passe oublie (Forgot Password)**
  - Demande de lien de reinitialisation.

- **Reinitialisation mot de passe (Reset Password)**
  - Nouveau mot de passe via token.

- **Verification email (Verify Email)**
  - Validation d'un email via token.

- **Invitation**
  - Un utilisateur peut etre invite dans une organisation (team). Il accepte via un token.

### Securite du compte

Dans Parametres > Securite:

- Changement de mot de passe
- Activation / desactivation 2FA (TOTP)
  - Setup (QR code / secret)
  - Verification du code

Bonnes pratiques recommandees (a afficher dans la doc UI):

- Mot de passe long (12+), unique.
- Activer 2FA pour les profils admin.

---

## Navigation et interface

### Structure generale

Une fois connecte, l'utilisateur arrive sur un layout principal:

- **Header**: logo + nom organisation, theme toggle, notifications, menu utilisateur (abonnement, deconnexion).
- **Tab bar** (onglets fixes):
  - Dashboard
  - Mon LocaGuest
  - Contrats
  - Documents
  - Profitabilite
  - Calcul Rentabilite
  - Parametres
- **Zone centrale**: contenu de l'onglet actif.
- **Footer**: copyright.

### Theme (clair / sombre)

Le theme est basculable (moon/sun). Le branding de l'organisation adapte les couleurs principales (CSS variables).

### Notifications

Le menu de notifications est utilise notamment pour:

- Lancer le questionnaire de satisfaction (modal).

### Toast & Confirm

Le front utilise:

- **Toast**: messages success/info/warning/error.
- **Confirm modal**: confirmation d'actions sensibles (suppression, termination, etc.).

### Tours / Guides interactifs

LocaGuest integre des parcours guides (Driver.js) pour:

- le layout principal
- la page Mon LocaGuest
- la page Profitabilite

Objectif: faciliter l'onboarding et expliquer les zones d'interface.

---

## Dashboard

Le Dashboard synthesize l'activite de l'organisation sur une periode (mois/annee).

### Filtres

- Mois (1..12)
- Annee (liste d'annees disponibles depuis l'API)

### Cartes KPI (exemples)

- Nombre de biens
- Nombre de locataires actifs
- Taux d'occupation
- Revenu mensuel
- Taux de collection (loyers payes / total)
- Retards (count) + total en retard

### Graphiques

- **Occupancy chart**: occupation sur la periode (selon API)
- **Revenue chart**: revenus sur la periode (selon API)

### Activites recentes

Liste d'evenements recents (info/success/warning) fournis par l'API.

### Actions rapides

Raccourcis vers Biens, Locataires, Contrats, Rentabilite.

---

## Mon LocaGuest (coeur metier)

Mon LocaGuest est l'espace principal de gestion.

Il fonctionne avec un **gestionnaire d'onglets internes** (InternalTabManager):

- onglet "Summary" (vue globale)
- fiches Bien (Property)
- fiches Locataire (Tenant)
- fiches Relation (Property+Tenant)

### 1) Onglet Summary

#### Objectif

Donner une vision globale et servir de point d'entree pour:

- creer un bien
- creer un locataire
- ouvrir des fiches
- surveiller les alertes (deadlines, documents manquants, retards)

#### Contenus

- Statistiques de portefeuille: nb biens, nb locataires, taux occupation, revenus
- Liste de biens (avec filtres)
- Liste de locataires (avec filtres)
- Alertes / activites
- Graphiques (occupation / revenus)

#### Filtres

Biens:

- statut (occupied/vacant/archived...)
- type (apartment/house/...)
- usage (long-term/short-term/mixed)

Locataires:

- statut (active/inactive)
- completude de dossier (si exposee)

#### Actions

- Ajouter un bien
- Ajouter un locataire
- Ouvrir la fiche d'un bien
- Ouvrir la fiche d'un locataire
- Ouvrir la relation (bien + locataire)
- Supprimer un bien (avec regles: blocage si un contrat actif ou un locataire associe)

### 2) Fiche Bien (Property)

Acces depuis Summary ou depuis une recherche.

#### Sous-onglets

- Informations
- Locataires
- Contrats

#### 2.1 Informations (Property Info)

Gere les donnees du bien:

- Identification
  - code interne
  - nom
  - adresse, ville, code postal
- Caracteristiques
  - type (apartment/house/room/...)
  - surface, nb pieces, etc.
- Donnees financieres
  - purchasePrice, purchaseDate
  - propertyTax (taxe fonciere)
  - condoFees (charges copro)
  - insurance
  - managementFeesRate
  - maintenanceRate
  - vacancyRate
  - nightsBookedPerMonth (utile courte duree)
- Usage
  - longTerm / shortTerm / mixed

Photos / medias:

- Upload d'images
- Gestion de categories (photos, diagnostics, etc. selon implementation)

#### 2.2 Locataires (Property Tenants)

Permet de:

- voir les locataires associes au bien
- associer / dissocier un locataire

L'UI peut demander une "raison" lors d'une dissociation.

#### 2.3 Contrats (Property Contracts)

Sous-section operationnelle tres riche:

- liste des contrats du bien
- creation de contrat (wizard)
- actions sur contrat:
  - telecharger / visualiser PDF
  - marquer comme signe
  - enregistrer paiements
  - termination / preavis
  - renouvellement
  - avenants
  - etats des lieux entree/sortie

### 3) Fiche Locataire (Tenant)

Acces depuis Summary ou depuis fiche Bien.

#### Sous-onglets

- Contrats
- Paiements
- Historique Paiements
- Documents

#### Informations locataire

- identite: fullName, email, phone, address
- infos complementaires: employmentStatus, income, etc. (selon back)

#### Completeness / documents manquants

Le front prevoit des indicateurs de dossier incomplet (missingDocuments).

#### Actions frequentes

- ouvrir les contrats du locataire
- creer un contrat pour ce locataire (si un bien est associe)
- telecharger quittances/factures
- telecharger recu de caution
- voir statistiques de paiement

### 4) Fiche Relation (Bien + Locataire)

Vue consolidee pour un couple (propertyId, tenantId).

Sous-onglets:

- Overview
- Paiements
- Documents
- Performance

Permet de suivre:

- contrat actif
- progression des paiements
- resume financier
- KPI et graphiques

---

## Contrats

L'onglet Contrats (global) centralise la gestion des contrats (tous biens confondus).

### KPI contrats

L'API expose des stats (ContractStats) utilisees pour:

- nb contrats actifs
- nb termines
- etc.

### Recherche et filtres

- recherche texte
- filtre statut
- filtre type

### Creation de contrat (modal)

Champs typiques:

- propertyId (bien)
- tenantId (locataire)
- type: Furnished / Unfurnished
- startDate / endDate
- rent
- deposit

### Paiement (enregistrement)

- amount
- paymentDate
- method: BankTransfer / Cash / Card / Other

### Termination / rupture

- terminationDate
- reason

L'interface peut verifier l'eligibilite via `ContractTerminationEligibility`.

### Avenants

Gestion d'avenants par contrat:

- liste avenants
- edition de champs (effectiveDate, reason, description, notes)
- telechargement PDF (si document attache)
- marquer comme signe
- envoi pour signature electronique (si service de signature configure)
  - option "signer tous les occupants" (colocation)

### Etats des lieux (EDL)

Acces rapide depuis contrat:

- lancer wizard EDL entree
- lancer wizard EDL sortie

### Documents lies au contrat

- generation bail / avenant / EDL
- recuperation status de documents
- telechargement
- marquage signe

---

## Documents

L'onglet Documents donne une vision "bibliotheque" de tous les documents.

### Chargement

- un seul appel API recupere tous les documents de l'organisation

### Filtres

- recherche (fileName, tenantName, propertyName, description)
- filtre categorie
- filtre type

### Statistiques

- total documents
- docs du mois
- repartition par categorie
- repartition par type

### Categories

- Identite
- Contrats
- EtatsDesLieux
- Justificatifs
- Quittances
- Autres

### Types (exemples)

- PieceIdentite
- Bail
- Avenant
- EtatDesLieuxEntree
- EtatDesLieuxSortie
- Assurance
- BulletinSalaire
- AvisImposition
- Quittance
- Autre

### Actions

- telecharger
- visualiser (viewer PDF/image) via DocumentViewerService

---

## Profitabilite

L'onglet Profitabilite est un cockpit KPI/analytics (Chart.js).

### Donnees

- ProfitabilityStats: revenus, depenses, net, variations
- RevenueEvolution: evolution sur N mois
- PropertyPerformance: performance par bien

### Filtres

- Annee
- Periode (3, 6, 9, 12 mois)

### Graphique

- courbe revenus vs depenses

### Usage

- Identifier les biens les plus performants
- Visualiser tendance sur plusieurs mois

---

## Calcul de rentabilite (simulateur)

Cet onglet est un simulateur detaille avec sauvegarde de scenarios.

### Objectif

- Simuler un achat (ou une situation) avec parametres financiers
- Projeter cashflows
- Calculer rendement brut/net, cashflow, TRI (IRR), NPV
- Comparer plusieurs scenarios

### Concepts

- **Scenario**: ensemble de parametres + resultats.
- **Autosave**: le front peut enregistrer automatiquement (option).

### Wizard / Etapes (logique)

Le simulateur suit des etapes (ex. 1..7). Les champs exacts peuvent varier, mais couvrent:

1) Achat / prix
   - prix d'achat
   - frais notaire
   - travaux
   - apport

2) Financement
   - montant emprunt
   - taux
   - duree
   - assurance

3) Revenus
   - loyer mensuel
   - charges recuperables
   - taux occupation / vacance

4) Charges
   - taxe fonciere
   - charges copro
   - assurance
   - gestion
   - maintenance

5) Fiscalite (selon option)
   - parametres simplifies (a completer si back propose)

6) Revente
   - horizon
   - appreciation annuelle
   - frais revente

7) Analyse
   - cashflows
   - KPI
   - recommandations

### Formules principales (selon service front)

Le front calcule notamment:

- monthlyLoanPayment (mensualite)
- monthlyNetCashflow
- annualNetIncome
- capRate
- cashOnCash
- debtServiceCoverage
- breakevenOccupancy

Revente:

- exitPrice = purchasePrice * (1 + appreciationRate)^holdingYears
- netExitProceeds = exitPrice * (1 - sellingCostsRate)

NPV:

- NPV = sum( cashflow_t / (1 + discountRate)^t ) - initialInvestment

IRR (TRI):

- calcule par iteration sur les cashflows (fonction interne)

### Scenarios

Fonctionnalites:

- creer scenario
- renommer
- dupliquer
- supprimer
- selectionner scenario actif

Quotas (selon plan): nombre de scenarios et sauvegardes.

### Suggestions "IA"

Le front propose un service de suggestions (regles heuristiques) base sur:

- cashflow negatif
- vacance elevee
- charges trop hautes

L'objectif est de guider l'utilisateur vers des optimisations (augmenter apport, ajuster loyer, reduire charges, etc.).

---

## Parametres

La page Parametres est organisee en sections (tabs internes).

### 1) Profil

- prenom/nom
- email
- telephone
- photo de profil

### 2) Organisation / Equipe

- infos organisation (nom, email, telephone, site)
- branding:
  - logo
  - couleurs (primary/secondary/accent)

### 3) Equipe (Team)

- liste des membres
- invitation par email
- gestion des roles (selon permissions)

### 4) Securite

- changement mot de passe
- 2FA (TOTP)
- deconnexion globale (selon back)

### 5) Notifications

- preferences de notifications (email/in-app)

### 6) Facturation

- plan actuel
- upgrade/downgrade
- informations d'abonnement (expire date)

### 7) Preferences

- langue (si exposee)
- unite/format

### 8) Suppression compte

- suppression du compte utilisateur (action sensible)

---

## Abonnement et plans

LocaGuest propose plusieurs plans (ex: Free, Pro, Business, Enterprise).

Le front manipule une structure de plan avec:

- id, name, price, billingCycle
- features
- quotas:
  - maxProperties
  - maxTenants
  - maxContracts
  - maxDocuments
  - maxUsers
  - maxScenarios
  - maxExports
  - aiSuggestionsQuota
  - advancedAnalytics
  - apiAccess
  - prioritySupport

### Ecran "Pricing"

Permet de:

- visualiser les plans
- comparer
- demarrer un essai / souscrire

---

## Permissions et roles

Les permissions sont utilisees pour:

- afficher/masquer des onglets
- autoriser des actions (create/update/delete)
- proteger certaines zones (logs, billing)

### Liste de permissions (front)

Organisation:

- TenantSettingsRead / TenantSettingsWrite
- BillingRead / BillingWrite

Utilisateurs/roles:

- UsersRead / UsersWrite
- RolesRead / RolesWrite

Metier:

- PropertiesRead / PropertiesWrite / PropertiesDelete
- TenantsRead / TenantsWrite / TenantsDelete
- ContractsRead / ContractsWrite / ContractsDelete
- DocumentsRead / DocumentsWrite / DocumentsDelete

Analytics & Export:

- AnalyticsRead
- AnalyticsExport

Audit & Logs:

- AuditLogsRead
- SystemLogsRead

### Roles recommandes (exemple)

- SuperAdmin (platform): tout
- TenantOwner (owner org): tout metier + team + billing
- Manager (gestion): biens, locataires, contrats, docs, analytics
- Accountant (compta): analytics + export + paiements
- ReadOnly (lecture): read only

---

## Regles metier importantes

### Suppression d'un bien

Regle front:

- suppression refusee si:
  - un contrat actif existe pour le bien
  - un locataire est encore associe

### Association bien-locataire

- un locataire peut etre associe/dissocie d'un bien
- la dissociation peut etre accompagnee d'une raison (UI)

### Contrat

- un contrat definit une periode (start/end)
- il peut etre termine (termination)
- il peut etre renouvelle
- il peut avoir des avenants

### Paiements

- paiements enregistres avec methode et date
- retards et taux de collection visibles sur dashboard

### Depot (caution)

- montant attendu
- montant recu
- reste du
- recu PDF telechargeable

### Etats des lieux

- entree/sortie
- checklist + photos
- signatures des parties

### Documents

- categorie + type
- rattachement possible a un contrat, locataire, bien
- export ZIP possible (selon API)

---

## FAQ + formulations en langage courant

Cette section est concue pour alimenter un chatbot (intents + synonymes).

### Onboarding / navigation

- "Ou je trouve mes biens ?"
  - Onglet Mon LocaGuest > Summary ou ouvrir une fiche Bien.

- "Je veux changer le theme"
  - Bouton soleil/lune en haut a droite.

- "Je veux faire le tour de l'application"
  - Bouton "?" / "Demarrer le tour" dans la barre d'onglets.

### Biens

- "Ajouter un appartement"
  - Mon LocaGuest > Summary > Ajouter un bien.

- "Modifier l'adresse du logement"
  - Ouvrir fiche Bien > Informations > modifier champs.

- "Supprimer un bien"
  - Ouvrir fiche Bien ou Summary > action supprimer.
  - Si refuse: verifier qu'il n'y a plus de contrat actif ni de locataire associe.

### Locataires

- "Ajouter un locataire"
  - Mon LocaGuest > Summary > Ajouter un locataire.

- "Dossier locataire incomplet"
  - Ouvrir fiche Locataire > Documents > verifier pieces manquantes.

### Contrats

- "Faire un bail"
  - Contrats (onglet global) ou fiche Bien > Contrats.

- "Mettre fin au bail"
  - Contrat > Terminer / Preavis.

- "Renouveler le bail"
  - Contrat > Renouvellement.

- "Faire un avenant"
  - Contrat > Avenants.

- "Envoyer pour signature"
  - Sur un document lie (bail/avenant/EDL), action signature (si configure).

### Paiements

- "Enregistrer un paiement"
  - Contrat ou fiche Locataire > Paiements > enregistrer.

- "Voir les retards"
  - Dashboard (carte Retards) + Contrats/Relation.

### Depot

- "La caution"
  - Fiche Locataire > verifier info depot/caution.

- "Telecharger recu de caution"
  - Fiche Locataire > action telecharger recu.

### Documents

- "Ou sont mes documents ?"
  - Onglet Documents (bibliotheque) ou fiches (locataire/bien/contrat).

- "Telecharger une quittance"
  - Fiche Locataire > Quittances / Factures (si active) ou Documents.

### Profitabilite / rentabilite

- "Voir la performance"
  - Onglet Profitabilite.

- "Calculer la rentabilite d'un achat"
  - Onglet Calcul Rentabilite.

- "Comparer deux scenarios"
  - Simulateur > liste des scenarios.

### Parametres

- "Inviter un collaborateur"
  - Parametres > Equipe > Inviter.

- "Changer le logo de mon agence"
  - Parametres > Organisation > Logo.

- "Activer la double authentification"
  - Parametres > Securite > 2FA.

---

## Annexes

### A) Routes principales (front)

Public:

- /
- /about
- /contact
- /terms
- /privacy
- /security

Auth:

- /login
- /register
- /forgot-password
- /reset-password
- /verify-email
- /invitation

App:

- /app/dashboard
- /app/mon-locaguest
- /app/contracts
- /app/documents
- /app/profitability
- /app/rentability
- /app/settings

### B) Categories/type de documents (rappel)

- Categories: Identite, Contrats, EtatsDesLieux, Justificatifs, Quittances, Autres
- Types: PieceIdentite, Bail, Avenant, EtatDesLieuxEntree, EtatDesLieuxSortie, Assurance, BulletinSalaire, AvisImposition, Quittance, Autre

### C) Checklist support (diagnostic rapide)

- Je ne vois pas un onglet/action
  - Verifier permissions/role.

- Les KPI sont vides
  - Verifier periode (mois/annee) + existence de donnees.

- Impossible de supprimer un bien
  - Verifier contrats actifs + association locataire.

- Document introuvable
  - Verifier category/type et rattachement (bien/locataire/contrat).

---

Fin du document.

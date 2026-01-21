# LocaGuest — Documentation Produit & Guide Utilisateur (v1)

**Dernière mise à jour**: 21 January 2026  
**Audience**: utilisateurs finaux (propriétaires / gestionnaires), équipe support, onboarding, et base de connaissance du chatbot Front.

---

## 1. Vision produit

LocaGuest est une application SaaS de gestion locative orientée “opérations” : centraliser les biens, les occupants (locataires), les contrats, les documents, les paiements, et les indicateurs de rentabilité, avec une UX guidée (tour / assistants) et une traçabilité (audit logs).

Le produit est composé de plusieurs applications/services :

- **LocaGuest (Front)** : application Web (Angular, SPA) accessible via `locaguest.com`
- **LocaGuest.API (Métier)** : API .NET exposant le domaine (biens, contrats, paiements, documents, etc.)
- **AuthGate (AuthN/AuthZ)** : service d’authentification/identité (login, register, MFA, invitations, rôles/permissions, JWKS)
- **Access-Manager-Pro** : front d’administration avancée des utilisateurs/rôles/permissions (réservé SuperAdmin/TenantOwner)

---

## 2. Environnements & URLs

Vous exploitez 3 environnements (au minimum) + local :

- **Production**
  - Front : `locaguest.com`
  - API : `api.locaguest.com`
  - Auth : `auth.locaguest.com`
  - Access Manager : `access.manager.locaguest.com`
- **Préproduction**
  - Front : `preprod.locaguest.com`
  - API : `api.preprod.locaguest.com`
  - Auth : `auth.preprod.locaguest.com`
  - Access Manager : `access-manager.preprod.locaguest.com`
- **Staging**
  - Front : `staging.locaguest.com`
  - API : `api.staging.locaguest.com`
  - Auth : `auth.staging.locaguest.com`
  - Access Manager : `access-manager.staging.locaguest.com`
- **Local**
  - Généralement via `http://localhost:<port>` (selon Docker Compose / Angular)

### 2.1. Concepts de configuration (tags, secrets, env vars)

Les déploiements sont pilotés par des tags d’images Docker + secrets (DB, JWT, etc.) déclinés par environnement (Staging/Preprod/Prod) fileciteturn0file0.

---

## 3. Rôles, permissions et périmètre d’accès

### 3.1. Rôles “métier” (au niveau produit)
- **SuperAdmin** : administration globale (tenants/organisations, facturation, audit, support).
- **TenantOwner** : propriétaire/administrateur d’une organisation (tenant), gère utilisateurs, droits, biens, contrats.
- **User** (ou équivalent) : utilisateur standard au sein d’une organisation (accès restreint selon permissions).

> Les permissions sont consommées côté Front via des guards (ex: `permissionGuard`) et côté back via des politiques/attributs.

### 3.2. Permissions côté Front
Le front utilise un guard de permission et un enum `Permissions` pour ouvrir/fermer certaines pages et certaines “tabs internes” (ex: ouverture d’un bien, d’un occupant, etc.).

### 3.3. Access-Manager-Pro
Access-Manager-Pro sert à configurer finement :
- les rôles
- les permissions par rôle
- l’affectation des utilisateurs aux rôles
- et la gouvernance par tenant (scopes).

---

## 4. Parcours utilisateur (UX)

### 4.1. Accès public (non connecté)
Routes publiques principales :
- `/` : Landing page
- `/features` : page de présentation
- `/pricing` : tarifs
- `/contact` : contact
- `/help` : aide
- `/privacy`, `/terms`, `/imprint` : mentions & politique
- `/login` : connexion
- `/register` : création de compte
- `/forgot-password` : mot de passe oublié
- `/accept-invitation` : acceptation d’invitation

### 4.2. Accès applicatif (connecté)
Espace applicatif sous `/app` :
- `/app/dashboard`
- `/app/mon-locaguest`
- `/app/contracts`
- `/app/documents`
- `/app/profitability`
- `/app/rentability`
- `/app/settings`

---

## 5. Authentification, sécurité compte et invitations

Cette partie est gérée par **AuthGate**.

### 5.1. Connexion
- Login par identifiants
- Pré-login (étape préparatoire possible : MFA, vérifs)
- Gestion de session (JWT)

### 5.2. Enregistrement (register)
- Création de compte
- Association à un “tenant” (register-with-tenant)
- Possibilité d’invitation / onboarding via lien

### 5.3. Mot de passe oublié
- Demande de reset
- Validation token
- Changement de mot de passe

### 5.4. MFA (authentification multi-facteurs)
- Activation/désactivation
- Vérification de code

### 5.5. Invitations
- Invitation d’un utilisateur (souvent par email)
- Acceptation via lien (`/accept-invitation`)
- Attribution d’un rôle/permissions à l’arrivée (selon implémentation)

### 5.6. JWKS
AuthGate expose un endpoint JWKS pour validation de tokens côté services et/ou front.

---

## 6. Modules fonctionnels LocaGuest (Front)

### 6.1. Dashboard
Objectif : donner une vision “pilotage” :
- alertes (retards de paiement, contrats à renouveler, documents manquants)
- indicateurs de portefeuille (occupation, revenus attendus/encaissés)
- accès rapide (ouvrir un bien, un occupant, un contrat)

### 6.2. Mon LocaGuest (cockpit opérationnel)
C’est l’espace central orienté productivité, avec des **tabs internes** (type navigateur) :

- **Résumé** : synthèse globale (raccourcis, KPIs, derniers événements)
- **Bien (Property)** : détails d’un bien + sous-sections
- **Occupant (Tenant)** : fiche locataire/occupant + historique
- **Relation** : relation Bien ↔ Occupant ↔ Contrat (vision croisée)

Un “tour” (guidage) est disponible depuis la barre interne, pour aider l’utilisateur à découvrir les fonctionnalités.

#### 6.2.1. Bien (Property)
Données typiques d’un bien :
- `Code`: `string`
- `Name`: `string`
- `Address`: `string`
- `City`: `string`
- `PostalCode`: `string?`
- `Country`: `string?`
- `Type`: `PropertyType`
- `UsageType`: `PropertyUsageType`
- `Status`: `PropertyStatus`
- `Rent`: `decimal`
- `TotalRooms`: `int?`
- `OccupiedRooms`: `int`
- `ReservedRooms`: `int`
- `AirbnbSettings`: `PropertyAirbnbSettings`
- `Diagnostics`: `PropertyDiagnostics`
- `Bedrooms`: `int`
- `Bathrooms`: `int`
- `Surface`: `decimal?`
- `HasElevator`: `bool`
- `HasParking`: `bool`
- `HasBalcony`: `bool`
- `Floor`: `int?`
- `IsFurnished`: `bool`
- `Charges`: `decimal?`
- `Deposit`: `decimal?`
- `Description`: `string?`
- `ImageUrls`: `List<string>`
- `EnergyClass`: `string?`
- … (13 autres champs)

Cas d’usage :
- créer/modifier un bien
- consulter diagnostics/paramètres
- associer occupants
- gérer paiements et documents du bien
- importer des photos (inventaire / état des lieux)

#### 6.2.2. Occupant (locataire)
Données typiques d’un occupant :
- `Code`: `string`
- `FullName`: `string`
- `Email`: `string`
- `Phone`: `string?`
- `MoveInDate`: `DateTime?`
- `Status`: `OccupantStatus`
- `Notes`: `string?`
- `DateOfBirth`: `DateTime?`
- `Address`: `string?`
- `City`: `string?`
- `PostalCode`: `string?`
- `Country`: `string?`
- `Nationality`: `string?`
- `IdNumber`: `string?`
- `EmergencyContact`: `string?`
- `EmergencyPhone`: `string?`
- `Occupation`: `string?`
- `MonthlyIncome`: `decimal?`
- `PropertyId`: `Guid?`
- `PropertyCode`: `string?`

Cas d’usage :
- créer/modifier un occupant
- associer à un bien/contrat
- suivre documents et paiements

#### 6.2.3. Relation
Vue “métier” :
- quel occupant occupe quel bien
- quel contrat est actif
- quelle échéance de paiement
- quels documents manquent

### 6.3. Contrats
Gestion du cycle de vie des contrats :
- création (assistant/wizard)
- statut (pending/signed/active/expired/terminated…)
- renouvellement / avenants
- documents associés (contrat, annexes)
- suivi des signatures et des pièces

Champs typiques :
- `Code`: `string`
- `PropertyId`: `Guid`
- `RenterOccupantId`: `Guid`
- `Type`: `ContractType`
- `StartDate`: `DateTime`
- `EndDate`: `DateTime`
- `Rent`: `decimal`
- `Charges`: `decimal`
- `Deposit`: `decimal?`
- `PaymentDueDay`: `int`
- `Status`: `ContractStatus`
- `Notes`: `string?`
- `TerminationDate`: `DateTime?`
- `TerminationReason`: `string?`
- `NoticeDate`: `DateTime?`
- `NoticeEndDate`: `DateTime?`
- `NoticeReason`: `string?`
- `RoomId`: `Guid?`
- `IsConflict`: `bool`
- `RenewedContractId`: `Guid?`
- `CustomClauses`: `string?`
- `PreviousIRL`: `decimal?`
- `CurrentIRL`: `decimal?`
- `Type`: `DocumentType`
- … (3 autres champs)

### 6.4. Documents
Objectif : centraliser tous les documents :
- documents occupant (pièce d’identité, justificatifs, etc.)
- documents bien (diagnostics, assurances, taxes, etc.)
- documents contrat (contrat signé, annexes)
- quittances / factures

### 6.5. Paiements
Gestion des paiements (loyer, charges, dépôt, etc.) :
- échéances attendues (ExpectedDate)
- montants dus vs payés
- statut (paid/partial/late/…)
- mode de paiement
- génération éventuelle de quittance/facture

Champs typiques :
- `RenterOccupantId`: `Guid`
- `PropertyId`: `Guid`
- `ContractId`: `Guid`
- `PaymentType`: `PaymentType`
- `AmountDue`: `decimal`
- `AmountPaid`: `decimal`
- `PaymentDate`: `DateTime?`
- `ExpectedDate`: `DateTime`
- `Status`: `PaymentStatus`
- `PaymentMethod`: `PaymentMethod`
- `Note`: `string?`
- `Month`: `int`
- `Year`: `int`
- `ReceiptId`: `Guid?`
- `InvoiceDocumentId`: `Guid?`

### 6.6. Profitability / Rentability
Deux espaces complémentaires :
- **Profitability** : vision revenus/dépenses opérationnelles (cashflow, rentrées, retards, etc.)
- **Rentability** : analyse investissement et scénarios (prix d’achat, charges, vacance, travaux, etc.)

Ces espaces s’appuient sur des scénarios et versions (templates, commentaires, partages, notifications).

### 6.7. Settings (paramètres)
- profil utilisateur
- préférences (langue, UX)
- sécurité (MFA)
- organisation/tenant (si rôle admin)
- plan/abonnement (si exposé)

---

## 7. API LocaGuest — Contrats d’interface (vue fonctionnelle)

> Les routes ci-dessous sont générées depuis les contrôleurs. Les payloads exacts (DTO) se trouvent dans l’API.

### 7.1. Domaines principaux
- **Organizations** : gestion tenant/organisation
- **Properties** : gestion des biens
- **Occupants** : gestion locataires/occupants
- **Contracts / Addendums** : contrats & avenants
- **Documents / Images / Inventories** : gestion documentaire & médias
- **Payments / Deposits / Invoices** : paiements, dépôts, quittances/factures
- **Dashboard / Analytics** : synthèses et statistiques
- **Billing / Subscription / Checkout** : abonnement, usage, paiement SaaS
- **AuditLogs** : traçabilité

### 7.2. Index des endpoints (LocaGuest.API)

> Extrait lisible pour support et intégration. Pour l’exhaustif, utilisez Swagger.

Controller
Documents                    21
Contracts                    20
Properties                   13
Organizations                11
Inventories                  11
Payments                      9
Users                         9
Rooms                         8
Invoices                      8
Occupants                     8
Addendums                     6
ProvisioningOrganizations     6
Dashboard                     6
RentabilityScenarios          6
Team                          5
Subscriptions                 5
Analytics                     5
Billing                       4
Tracking                      4
AuditLogs                     3

#### Endpoints (table)
| Domaine | Verbe | Route | Action |
|---|---:|---|---|
| Addendums | GET | `api/Addendums` | `GetAll` |
| Addendums | POST | `api/Addendums` | `Create` |
| Addendums | DELETE | `api/Addendums/{id:guid}` | `Delete` |
| Addendums | GET | `api/Addendums/{id:guid}` | `GetById` |
| Addendums | PUT | `api/Addendums/{id:guid}` | `Update` |
| Addendums | PUT | `api/Addendums/{id:guid}/mark-signed` | `MarkSigned` |
| Admin | DELETE | `api/admin/clean-database` | `CleanDatabase` |
| Admin | GET | `api/admin/database-stats` | `GetDatabaseStats` |
| Analytics | GET | `api/Analytics/available-years` | `GetAvailableYears` |
| Analytics | GET | `api/Analytics/occupancy-trend` | `GetOccupancyTrend` |
| Analytics | GET | `api/Analytics/profitability-stats` | `GetProfitabilityStats` |
| Analytics | GET | `api/Analytics/property-performance` | `GetPropertyPerformance` |
| Analytics | GET | `api/Analytics/revenue-evolution` | `GetRevenueEvolution` |
| AuditLogs | GET | `api/AuditLogs` | `GetAll` |
| AuditLogs | DELETE | `api/AuditLogs/{id:guid}` | `Delete` |
| AuditLogs | GET | `api/AuditLogs/{id:guid}` | `GetById` |
| Billing | POST | `api/Billing/cancel` | `CancelSubscription` |
| Billing | POST | `api/Billing/checkout` | `CreateCheckoutSession` |
| Billing | GET | `api/Billing/invoices` | `GetInvoices` |
| Billing | GET | `api/Billing/portal-url` | `GetCustomerPortalUrl` |
| Checkout | POST | `api/Checkout/create-portal-session` | `CreatePortalSession` |
| Checkout | POST | `api/Checkout/create-session` | `CreateCheckoutSession` |
| Checkout | GET | `api/Checkout/session/{sessionId}` | `GetSession` |
| CommandAuditLogs | GET | `api/CommandAuditLogs` | `GetAll` |
| CommandAuditLogs | DELETE | `api/CommandAuditLogs/{id:guid}` | `Delete` |
| CommandAuditLogs | GET | `api/CommandAuditLogs/{id:guid}` | `GetById` |
| Contact | POST | `api/Contact` | `SendMessage` |
| Contracts | GET | `api/Contracts` | `GetContracts` |
| Contracts | POST | `api/Contracts` | `CreateContract` |
| Contracts | GET | `api/Contracts/all` | `GetAllContracts` |
| Contracts | GET | `api/Contracts/stats` | `GetContractStats` |
| Contracts | GET | `api/Contracts/tenant/{OccupantId}` | `GetContractsByTenant` |
| Contracts | DELETE | `api/Contracts/{id:guid}` | `DeleteContract` |
| Contracts | GET | `api/Contracts/{id:guid}` | `GetContract` |
| Contracts | PUT | `api/Contracts/{id:guid}` | `UpdateContract` |
| Contracts | PUT | `api/Contracts/{id:guid}/activate` | `ActivateContract` |
| Contracts | POST | `api/Contracts/{id:guid}/addendum` | `CreateAddendum` |
| Contracts | PUT | `api/Contracts/{id:guid}/cancel` | `CancelContract` |
| Contracts | GET | `api/Contracts/{id:guid}/effective-state` | `GetEffectiveState` |
| Contracts | PUT | `api/Contracts/{id:guid}/mark-expired` | `MarkContractAsExpired` |
| Contracts | PUT | `api/Contracts/{id:guid}/mark-signed` | `MarkContractAsSigned` |
| Contracts | PUT | `api/Contracts/{id:guid}/notice` | `GiveNotice` |
| Contracts | PUT | `api/Contracts/{id:guid}/notice/cancel` | `CancelNotice` |
| Contracts | POST | `api/Contracts/{id:guid}/payments` | `RecordPayment` |
| Contracts | POST | `api/Contracts/{id:guid}/renew` | `RenewContract` |
| Contracts | PUT | `api/Contracts/{id:guid}/terminate` | `TerminateContract` |
| Contracts | GET | `api/Contracts/{id:guid}/termination-eligibility` | `GetTerminationEligibility` |
| Dashboard | GET | `api/Dashboard/activities` | `GetActivities` |
| Dashboard | GET | `api/Dashboard/available-years` | `GetAvailableYears` |
| Dashboard | GET | `api/Dashboard/charts/occupancy` | `GetOccupancyChart` |
| Dashboard | GET | `api/Dashboard/charts/revenue` | `GetRevenueChart` |
| Dashboard | GET | `api/Dashboard/deadlines` | `GetDeadlines` |
| Dashboard | GET | `api/Dashboard/summary` | `GetSummary` |
| Deposits | GET | `api/Deposits/contract/{contractId:guid}` | `GetByContract` |
| Deposits | GET | `api/Deposits/contract/{contractId:guid}/receipt` | `GetReceipt` |
| Deposits | POST | `api/Deposits/contract/{contractId:guid}/receive` | `Receive` |
| Documents | GET | `api/Documents/all` | `GetAllDocuments` |
| Documents | GET | `api/Documents/contract/{contractId:guid}/status` | `GetContractDocumentStatus` |
| Documents | GET | `api/Documents/contract/{contractId:guid}/viewer` | `GetContractViewer` |
| Documents | GET | `api/Documents/download/{documentId}` | `DownloadDocument` |
| Documents | POST | `api/Documents/generate` | `GenerateDocument` |
| Documents | POST | `api/Documents/generate-contract` | `GenerateContract` |
| Documents | POST | `api/Documents/generate-quittance` | `GenerateQuittance` |
| Documents | GET | `api/Documents/occupant/{occupantId:guid}/sheet` | `GenerateOccupantSheet` |
| Documents | GET | `api/Documents/occupant/{occupantId}` | `GetOccupantDocuments` |
| Documents | GET | `api/Documents/occupant/{occupantId}/export-zip` | `ExportDocumentsZip` |
| Documents | GET | `api/Documents/property/{propertyId:guid}/sheet` | `GeneratePropertySheet` |
| Documents | GET | `api/Documents/property/{propertyId}` | `GetPropertyDocuments` |
| Documents | GET | `api/Documents/recent` | `GetRecentDocuments` |
| Documents | GET | `api/Documents/stats` | `GetDocumentStats` |
| Documents | GET | `api/Documents/templates` | `GetTemplates` |
| Documents | POST | `api/Documents/upload` | `UploadDocument` |
| Documents | GET | `api/Documents/view/{documentId}` | `ViewDocument` |
| Documents | DELETE | `api/Documents/{documentId}/dissociate` | `DissociateDocument` |
| Documents | GET | `api/Documents/{id:guid}` | `GetDocument` |
| Documents | PUT | `api/Documents/{id:guid}/mark-signed` | `MarkDocumentAsSigned` |
| Documents | POST | `api/Documents/{id:guid}/send-for-signature` | `SendDocumentForElectronicSignature` |
| Images | POST | `api/Images/upload` | `UploadImages` |
| Images | DELETE | `api/Images/{imageId:guid}` | `DeleteImage` |
| Images | GET | `api/Images/{imageId:guid}` | `GetImage` |
| Inventories | GET | `api/Inventories/contract/{contractId:guid}` | `GetByContract` |
| Inventories | POST | `api/Inventories/entry` | `CreateEntry` |
| Inventories | DELETE | `api/Inventories/entry/{id:guid}` | `DeleteEntry` |
| Inventories | GET | `api/Inventories/entry/{id:guid}` | `GetEntry` |
| Inventories | PUT | `api/Inventories/entry/{id:guid}/finalize` | `FinalizeEntry` |
| Inventories | POST | `api/Inventories/exit` | `CreateExit` |
| Inventories | DELETE | `api/Inventories/exit/{id:guid}` | `DeleteExit` |
| Inventories | GET | `api/Inventories/exit/{id:guid}` | `GetExit` |
| Inventories | GET | `api/Inventories/pdf/{type}/{id:guid}` | `GeneratePdf` |
| Inventories | POST | `api/Inventories/send-email` | `SendEmail` |
| Inventories | POST | `api/Inventories/sign` | `SignInventory` |
| Invoices | GET | `api/Invoices/export` | `Export` |
| Invoices | POST | `api/Invoices/generate` | `GenerateMonthlyInvoices` |
| Invoices | GET | `api/Invoices/overdue` | `GetOverdue` |
| Invoices | GET | `api/Invoices/stats` | `GetFinancialStats` |
| Invoices | GET | `api/Invoices/tenant/{OccupantId}` | `GetByTenant` |
| Invoices | POST | `api/Invoices/{invoiceId:guid}/generate-pdf` | `GenerateInvoicePdf` |
| Invoices | GET | `api/Invoices/{invoiceId:guid}/pdf` | `GetInvoicePdf` |
| Invoices | POST | `api/Invoices/{invoiceId}/mark-paid` | `MarkAsPaid` |
| Occupants | GET | `api/Occupants` | `GetOccupants` |
| Occupants | POST | `api/Occupants` | `CreateOccupant` |
| Occupants | DELETE | `api/Occupants/{id}` | `DeleteOccupant` |
| Occupants | GET | `api/Occupants/{id}` | `GetOccupant` |
| Occupants | POST | `api/Occupants/{id}/change-status` | `ChangeStatus` |
| Occupants | GET | `api/Occupants/{id}/contracts` | `GetOccupantContracts` |
| Occupants | GET | `api/Occupants/{id}/payment-stats` | `GetPaymentStats` |
| Occupants | GET | `api/Occupants/{id}/payments` | `GetOccupantPayments` |
| Organizations | GET | `api/Organizations` | `GetAllOrganizations` |
| Organizations | POST | `api/Organizations` | `CreateOrganization` |
| Organizations | GET | `api/Organizations/active` | `GetActiveOrganizations` |
| Organizations | GET | `api/Organizations/current` | `GetCurrentOrganization` |
| Organizations | POST | `api/Organizations/current/invitations` | `CreateInvitation` |
| Organizations | POST | `api/Organizations/current/invitations/revoke/{id:guid}` | `RevokeInvitation` |
| Organizations | PUT | `api/Organizations/settings` | `UpdateOrganizationSettings` |
| Organizations | DELETE | `api/Organizations/{id}` | `DeleteOrganization` |
| Organizations | GET | `api/Organizations/{id}` | `GetOrganizationById` |
| Organizations | POST | `api/Organizations/{id}/logo` | `UploadLogo` |
| Organizations | DELETE | `api/Organizations/{id}/permanent` | `HardDeleteOrganization` |
| Payments | POST | `api/Payments` | `CreatePayment` |
| Payments | GET | `api/Payments/dashboard` | `GetPaymentsDashboard` |
| Payments | GET | `api/Payments/overdue` | `GetOverduePayments` |
| Payments | GET | `api/Payments/property/{propertyId}` | `GetPaymentsByProperty` |
| Payments | GET | `api/Payments/stats` | `GetPaymentStats` |
| Payments | GET | `api/Payments/tenant/{OccupantId}` | `GetPaymentsByTenant` |
| Payments | DELETE | `api/Payments/{id}` | `DeletePayment` |
| Payments | PUT | `api/Payments/{id}` | `UpdatePayment` |
| Payments | GET | `api/Payments/{paymentId:guid}/quittance` | `GetPaymentQuittance` |
| Properties | GET | `api/Properties` | `GetProperties` |
| Properties | POST | `api/Properties` | `CreateProperty` |
| Properties | DELETE | `api/Properties/{id}` | `DeleteProperty` |
| Properties | GET | `api/Properties/{id}` | `GetProperty` |
| Properties | PUT | `api/Properties/{id}` | `UpdateProperty` |
| Properties | POST | `api/Properties/{id}/assign-occupant` | `AssignOccupant` |
| Properties | GET | `api/Properties/{id}/associated-occupants` | `GetAssociatedOccupants` |
| Properties | GET | `api/Properties/{id}/available-occupants` | `GetAvailableOccupants` |
| Properties | GET | `api/Properties/{id}/contracts` | `GetPropertyContracts` |
| Properties | GET | `api/Properties/{id}/financial-summary` | `GetFinancialSummary` |
| Properties | GET | `api/Properties/{id}/payments` | `GetPropertyPayments` |
| Properties | PATCH | `api/Properties/{id}/status` | `UpdatePropertyStatus` |
| Properties | DELETE | `api/Properties/{propertyId}/dissociate-tenant/{OccupantId}` | `DissociateTenant` |

> Note: table tronquée (volumétrie importante). Référez-vous à Swagger pour le complet.

---

## 8. AuthGate — Contrats d’interface (vue fonctionnelle)

AuthGate expose les capacités suivantes :
- Authentification (login / prelogin)
- Enregistrement (register)
- Invitations (dont acceptation “LocaGuest”)
- MFA (2FA)
- Gestion utilisateurs
- Gestion rôles & permissions
- JWKS

### 8.1. Endpoints (table)
| Domaine | Verbe | Route | Action |
|---|---:|---|---|
| AuditLogs | GET | `api/AuditLogs` | `GetAll` |
| AuditLogs | DELETE | `api/AuditLogs/{id:guid}` | `Delete` |
| AuditLogs | GET | `api/AuditLogs/{id:guid}` | `GetById` |
| Auth | POST | `api/Auth/accept-invitation` | `AcceptInvitation` |
| Auth | POST | `api/Auth/change-password` | `ChangePassword` |
| Auth | POST | `api/Auth/deactivate` | `DeactivateAccount` |
| Auth | POST | `api/Auth/invitations/accept` | `AcceptLocaGuestInvitation` |
| Auth | POST | `api/Auth/invite` | `InviteCollaborator` |
| Auth | POST | `api/Auth/login` | `Login` |
| Auth | POST | `api/Auth/logout` | `Logout` |
| Auth | GET | `api/Auth/me` | `GetCurrentUser` |
| Auth | POST | `api/Auth/prelogin` | `PreLogin` |
| Auth | POST | `api/Auth/refresh` | `RefreshToken` |
| Auth | POST | `api/Auth/register` | `Register` |
| Auth | POST | `api/Auth/register-with-tenant` | `RegisterWithTenant` |
| Auth | POST | `api/Auth/verify-2fa` | `Verify2FA` |
| Auth | POST | `api/Auth/verify-recovery-code` | `VerifyRecoveryCode` |
| ExternalAuth | POST | `api/external-auth/facebook` | `LoginWithFacebook` |
| ExternalAuth | GET | `api/external-auth/facebook/config` | `GetFacebookConfig` |
| ExternalAuth | POST | `api/external-auth/google` | `LoginWithGoogle` |
| ExternalAuth | GET | `api/external-auth/google/config` | `GetGoogleConfig` |
| ExternalAuth | GET | `api/external-auth/providers` | `GetProviders` |
| Invitation | POST | `api/Invitation/accept` | `AcceptInvitation` |
| Invitation | POST | `api/Invitation/invite` | `InviteCollaborator` |
| Jwks | GET | `.well-known/jwks.json` | `GetJwks` |
| PasswordReset | POST | `api/PasswordReset/request` | `RequestPasswordReset` |
| PasswordReset | POST | `api/PasswordReset/reset` | `ResetPassword` |
| Permissions | GET | `api/Permissions` | `GetPermissions` |
| Register | POST | `api/Register` | `Register` |
| Roles | GET | `api/Roles` | `GetRoles` |
| Roles | DELETE | `api/Roles/{roleId}/permissions/{permissionId}` | `RemovePermission` |
| Roles | POST | `api/Roles/{roleId}/permissions/{permissionId}` | `AssignPermission` |
| TestPermissions | GET | `api/TestPermissions/admin-only` | `AdminOnly` |
| TestPermissions | GET | `api/TestPermissions/authenticated` | `AuthenticatedOnly` |
| TestPermissions | GET | `api/TestPermissions/mfa-required` | `MfaRequired` |
| TestPermissions | GET | `api/TestPermissions/roles` | `GetRoles` |
| TestPermissions | GET | `api/TestPermissions/users` | `GetUsers` |
| TestPermissions | POST | `api/TestPermissions/users` | `CreateUser` |
| TestPermissions | DELETE | `api/TestPermissions/users/{id}` | `DeleteUser` |
| TwoFactor | POST | `api/TwoFactor/disable` | `Disable` |
| TwoFactor | POST | `api/TwoFactor/enable` | `Enable` |
| TwoFactor | GET | `api/TwoFactor/status` | `GetStatus` |
| TwoFactor | POST | `api/TwoFactor/verify` | `VerifyAndEnable` |
| Users | GET | `api/Users` | `GetUsers` |
| Users | DELETE | `api/Users/{id}` | `DeleteUser` |
| Users | GET | `api/Users/{id}` | `GetUserById` |
| Users | PUT | `api/Users/{id}` | `UpdateUser` |
| Users | POST | `api/Users/{id}/deactivate` | `DeactivateUser` |
| Users | POST | `api/Users/{id}/reactivate` | `ReactivateUser` |
---

## 9. Glossaire (terminologie produit)

- **Tenant / Organisation** : entité cliente du SaaS (votre “compte entreprise”).
- **Property (Bien)** : logement / unité / lot géré dans LocaGuest.
- **Occupant** : personne occupant le bien (locataire, colocataire, etc.)
- **Contract (Contrat)** : lien juridique entre un occupant et un bien sur une période.
- **Addendum (Avenant)** : modification au contrat (renouvellement, ajustement).
- **Deposit (Dépôt)** : dépôt de garantie (optionnel).
- **Payment (Paiement)** : échéance mensuelle ou événementielle.
- **Document** : fichier attaché (contrat, diagnostics, justificatifs, quittances…).
- **Inventory (État des lieux)** : éléments et photos d’entrée/sortie.
- **Profitability** : résultat opérationnel (flux financiers).
- **Rentability** : rendement / analyse investissement (scénarios).
- **Audit Log** : traçabilité des actions critiques (sécurité et conformité).
- **Usage / Quota** : consommation (SaaS) pour facturation et limites de plan.

---

## 10. Guide “Aide rapide” (FAQ produit)

### 10.1. Je veux démarrer rapidement
1. Créer un compte (Register) ou accepter une invitation
2. Se connecter (Login)
3. Aller dans **Mon LocaGuest**
4. Ajouter un **Bien**
5. Ajouter un **Occupant**
6. Créer un **Contrat**
7. Charger les **Documents**
8. Suivre les **Paiements** et la **Rentabilité**

### 10.2. Je ne vois pas un onglet / une fonctionnalité
- Vérifiez votre rôle/permissions (certaines fonctions sont réservées aux admins).
- Si vous êtes TenantOwner, passez par Access-Manager-Pro pour ajuster les droits.

### 10.3. Un paiement est en retard
- Ouvrez le Bien ou le Contrat associé.
- Consultez la section Paiements (montant dû vs payé, date attendue, statut).
- Ajoutez une note et/ou un justificatif si nécessaire.

### 10.4. J’ai un document manquant
- Ouvrez l’Occupant / le Contrat
- Consultez la liste des documents requis
- Téléversez le fichier, puis validez l’état (fourni / signé)

---

## 11. Spécification “Base chatbot” (Front)

Le chatbot devra :
1. **Comprendre** une requête en langage courant (ex: “je veux ajouter un locataire”, “où je vois mes paiements en retard”, “comment créer un contrat ?”).
2. **Retrouver** les passages pertinents de cette documentation (RAG simple côté front).
3. **Répondre** avec :
   - une réponse courte
   - des étapes claires
   - des liens internes (routes) et suggestions d’actions (boutons)
4. **Suggérer** des actions contextuelles (ex: “Ouvrir Mon LocaGuest”, “Créer un bien”, “Voir les paiements”).

### 11.1. Intents (exemples)
- `create_property`, `edit_property`, `create_occupant`, `create_contract`
- `upload_document`, `missing_document`
- `late_payment`, `payment_receipt`, `invoice`
- `rentability_scenario`, `profitability_kpis`
- `reset_password`, `enable_mfa`, `accept_invitation`
- `permissions_access_denied`, `contact_support`

### 11.2. Synonymes / langage courant (exemples)
- “locataire” = occupant
- “bien / appartement / logement / maison” = property
- “contrat / bail” = contract
- “quittance / reçu” = invoice/receipt
- “dépôt / caution” = deposit
- “rentabilité / rendement” = rentability
- “bénéfice / profit / cashflow” = profitability

---

## 12. Annexes

### 12.1. Routes Front (index)
Liste des routes détectées :
- {", ".join([p for p in front_paths if p])}

### 12.2. Où trouver les informations exactes (support/tech)
- **Swagger** : documentation exhaustive des routes et DTO
- **Front** : composants pages (Mon LocaGuest / Contracts / Documents / Profitability / Rentability)
- **AuthGate** : endpoints Auth/MFA/Invitations/Roles/Permissions

---

**Fin du document.**

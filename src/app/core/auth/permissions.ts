export const Permissions = {
  TenantSettingsRead: 'tenant.settings.read',
  TenantSettingsWrite: 'tenant.settings.write',
  TenantDelete: 'tenant.delete',

  BillingRead: 'billing.read',
  BillingWrite: 'billing.write',

  UsersRead: 'users.read',
  UsersWrite: 'users.write',
  UsersDelete: 'users.delete',
  UsersInvite: 'users.invite',

  RolesRead: 'roles.read',
  RolesAssign: 'roles.assign',
  RolesWrite: 'roles.write',

  PropertiesRead: 'properties.read',
  PropertiesWrite: 'properties.write',
  PropertiesDelete: 'properties.delete',

  TenantsRead: 'tenants.read',
  TenantsWrite: 'tenants.write',
  TenantsDelete: 'tenants.delete',

  ContractsRead: 'contracts.read',
  ContractsWrite: 'contracts.write',
  ContractsTerminate: 'contracts.terminate',
  ContractsDelete: 'contracts.delete',

  DocumentsRead: 'documents.read',
  DocumentsUpload: 'documents.upload',
  DocumentsGenerate: 'documents.generate',
  DocumentsDelete: 'documents.delete',

  AnalyticsRead: 'analytics.read',
  AnalyticsExport: 'analytics.export',

  AuditLogsRead: 'audit.logs.read',
  SystemLogsRead: 'system.logs.read',
} as const;

export type PermissionCode = typeof Permissions[keyof typeof Permissions];

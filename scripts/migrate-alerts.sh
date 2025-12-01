#!/bin/bash
# Script de migration des alert() et confirm() vers ToastService et ConfirmService

echo "🔄 Migration des alerts et confirms vers système professionnel"
echo "============================================================"

# Comptage initial
ALERT_COUNT=$(grep -r "alert(" src/app --include="*.ts" | wc -l)
CONFIRM_COUNT=$(grep -r "confirm(" src/app --include="*.ts" | wc -l)

echo "📊 État actuel:"
echo "   - alert() trouvés: $ALERT_COUNT"
echo "   - confirm() trouvés: $CONFIRM_COUNT"
echo ""

# Liste des fichiers à migrer par priorité
PRIORITY_HIGH=(
  "src/app/pages/mon-locaguest/tabs/property-contracts/property-contracts-tab.ts"
  "src/app/pages/mon-locaguest/tabs/property-detail/property-detail-tab.ts"
  "src/app/pages/mon-locaguest/components/documents-manager/documents-manager.ts"
  "src/app/pages/mon-locaguest/tabs/contracts/contracts-tab.ts"
)

echo "✅ Infrastructure créée:"
echo "   - ConfirmModal (shared/components/confirm-modal)"
echo "   - ConfirmService (core/ui/confirm.service.ts)"
echo "   - ToastService amélioré (core/ui/toast.service.ts)"
echo ""

echo "📋 Fichiers prioritaires à migrer manuellement:"
for file in "${PRIORITY_HIGH[@]}"; do
  ALERTS=$(grep -c "alert(" "$file" 2>/dev/null || echo "0")
  CONFIRMS=$(grep -c "confirm(" "$file" 2>/dev/null || echo "0")
  echo "   - $file: $ALERTS alerts, $CONFIRMS confirms"
done

echo ""
echo "🎯 Prochaines étapes:"
echo "   1. Ajouter imports ToastService et ConfirmService"
echo "   2. Injecter les services dans le constructeur"
echo "   3. Remplacer alert() par toasts.successDirect/errorDirect/etc"
echo "   4. Remplacer confirm() par await confirmService.danger/warning/etc"
echo "   5. Tester chaque fonctionnalité"
echo ""
echo "📖 Voir GUIDE_MIGRATION_ALERTS_CONFIRMS.md pour les détails"

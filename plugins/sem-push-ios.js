/**
 * O app usa só notificações locais (lembretes gerados no próprio celular).
 * O plugin do expo-notifications acrescenta o entitlement de push (aps-environment),
 * que exigiria a capacidade "Push Notifications" no perfil da Apple. Aqui ele é removido.
 */
const { withEntitlementsPlist } = require('expo/config-plugins');

module.exports = function semPushIos(config) {
  if (config.ios?.entitlements) delete config.ios.entitlements['aps-environment'];
  return withEntitlementsPlist(config, (cfg) => {
    delete cfg.modResults['aps-environment'];
    return cfg;
  });
};

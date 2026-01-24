const rule = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      noEnvDev:
        "Import interdit: '{{path}}'. Utilise 'src/environnements/environment' (resolver runtime) et laisse Angular gérer les fileReplacements.",
    },
  },
  create(context) {
    const reportIfEnvDev = (node, source) => {
      if (typeof source !== 'string') return;
      if (!source.includes('environment.dev')) return;
      context.report({ node, messageId: 'noEnvDev', data: { path: source } });
    };

    return {
      ImportDeclaration(node) {
        reportIfEnvDev(node, node.source?.value);
      },
      ExportNamedDeclaration(node) {
        reportIfEnvDev(node, node.source?.value);
      },
      ExportAllDeclaration(node) {
        reportIfEnvDev(node, node.source?.value);
      },
      ImportExpression(node) {
        reportIfEnvDev(node, node.source?.value);
      },
    };
  },
};

export default {
  rules: {
    'no-environment-dev-import': rule,
  },
};

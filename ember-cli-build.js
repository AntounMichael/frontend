/* eslint-env node */
'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function(defaults) {
  let env = EmberApp.env() || 'development';
  let isProductionLikeBuild = ['production', 'staging', 'preview'].indexOf(env) > -1;

  let app = new EmberApp(defaults, {
    fingerprint: {
      enabled: isProductionLikeBuild,
    },
    sourcemaps: {
      enabled: !isProductionLikeBuild,
    },
    minifyCSS: { enabled: isProductionLikeBuild },
    minifyJS: { enabled: isProductionLikeBuild },

    tests: env.EMBER_CLI_TEST_COMMAND || !isProductionLikeBuild,
    hinting: env.EMBER_CLI_TEST_COMMAND || !isProductionLikeBuild,
    'ember-cli-babel': {
      includePolyfill: true,
      sourceMaps: isProductionLikeBuild?false:'inline'
    },
    'ember-cli-qunit': {
      useLintTree: false
    },
    'ember-froala-editor': {
      languages: ['fr','es'],
      plugins: ['lists', 'code_view', 'link'],
      themes: 'gray'
    },
    'ember-service-worker': {
      versionStrategy: 'every-build',
    },
    'asset-cache': {
      version: '3',
      include: [
        'assets/**/*',
        'ilios-prerender/*',
        'fonts/**/*',
      ]
    },
    'esw-index': {
      version: '2',
      includeScope: [
        /\/course(\/.*)?$/,
        /\/course-materials(\/.*)?$/,
        /\/instructorgroups(\/.*)?$/,
        /\/learnergroups(\/.*)?$/,
        /\/programs(\/.*)?$/,
        /\/admin(\/.*)?$/,
        /\/logout(\/.*)?$/,
        /\/schools(\/.*)?$/,
        /\/myprofile(\/.*)?$/,
        /\/mymaterials(\/.*)?$/,
        /\/course-rollover(\/.*)?$/,
        /\/curriculum-inventory-reports(\/.*)?$/,
        /\/curriculum-inventory-sequence-block(\/.*)?$/,
        /\/data(\/.*)?$/,
        /\/weeklyevents(\/.*)?$/,
      ]
    },
  });

  return app.toTree();
};

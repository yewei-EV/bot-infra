/**
 * Custom angular webpack configuration
 */

module.exports = (config, options) => {
    config.target = 'electron-renderer';
    config.externals = {
      puppeteer: 'require("puppeteer")',
      "puppeteer-extra": 'require("puppeteer-extra")',
      "merge-deep": 'require("merge-deep")',
      "chrome-har": 'require("chrome-har")',
      "../package": 'require("../package.json")',
      "./package": 'require("./package.json")'
    };
    if (options.customWebpackConfig.target) {
        config.target = options.customWebpackConfig.target;
    } else if (options.fileReplacements) {
        for(let fileReplacement of options.fileReplacements) {
            if (fileReplacement.replace !== 'src/environments/environment.ts') {
                continue;
            }

            let fileReplacementParts = fileReplacement['with'].split('.');
            if (['dev', 'prod', 'test', 'electron-renderer'].indexOf(fileReplacementParts[1]) < 0) {
                config.target = fileReplacementParts[1];
            }
            break;
        }
    }
    return config;
};

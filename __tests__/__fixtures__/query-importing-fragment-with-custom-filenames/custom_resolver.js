const path = require("path");

module.exports = () => {
  return {
    manipulateOptions: function(babelOpts) {
      babelOpts.resolveModuleSource = function resolveModuleSource(
        source,
        filename
      ) {
        const sourceDetails = path.parse(source);
        const customSource = path.format(
          Object.assign({}, sourceDetails, {
            base: `__${sourceDetails.base}`,
            name: `__${sourceDetails.name}`
          })
        );

        return path.resolve(path.dirname(filename), customSource)
          ? customSource
          : source;
      };
      return babelOpts;
    }
  };
};

/**
 * Source: https://github.com/detrohutt/babel-plugin-inline-import-graphql-ast/blob/8fd7381dc784e8193607e7dbb0b76855a20aff6e/plugin/index.js
 * File created directly here for efficiency because we have to figure out how to resolve
 * fragment imports using existing Babel resolvers instead of path.resolve()
 *
 * Hopefully we'll be able to find an elegant way and issue a PR to the original project
 */
const path = require("path");
const os = require("os");
const fs = require("fs");
const gql = require("graphql-tag");
const { parse } = require("babylon");

module.exports = ({ types: t }) => {
  let sourceResolver;
  let importedFragmentNames = [];

  return {
    manipulateOptions: function(babelOpts) {
      sourceResolver = babelOpts.resolveModuleSource;
      return babelOpts;
    },
    visitor: {
      ImportDeclaration: {
        exit(curPath, state) {
          const importPath = curPath.node.source.value;
          if (importPath.endsWith(".graphql") || importPath.endsWith(".gql")) {
            const query = createQuery(
              importPath,
              state.file.opts.filename,
              sourceResolver
            );
            importedFragmentNames = importedFragmentNames.concat(
              query.processFragments(importedFragmentNames)
            );
            query.parse();
            query.makeSourceEnumerable();
            curPath.replaceWith(
              t.variableDeclaration("const", [buildInlineVariable(query.ast)])
            );

            function buildInlineVariable(graphqlAST) {
              const babelAST = parse(
                "const obj = " + JSON.stringify(graphqlAST)
              );
              const objExp = babelAST.program.body[0].declarations[0].init;
              return t.variableDeclarator(
                t.identifier(curPath.node.specifiers[0].local.name),
                t.objectExpression(objExp.properties)
              );
            }
          }
        }
      }
    }
  };
};

function createQuery(queryPath, babelPath, sourceResolver) {
  const absPath = typeof sourceResolver === "undefined"
    ? path.resolve(path.dirname(babelPath), queryPath)
    : sourceResolver(queryPath, babelPath);
  const source = fs.readFileSync(absPath).toString();

  let ast = null;
  let fragmentDefs = [];

  return {
    processFragments(importedFragmentNames) {
      const imports = source
        .split(os.EOL)
        .filter(line => line.startsWith("#import"));

      const defsToImport = imports
        .map(statement => statement.split(" ")[1].slice(1, -1))
        .map(fragmentPath => createQuery(fragmentPath, absPath, sourceResolver))
        .map(query => {
          query.processFragments(importedFragmentNames);
          query.parse();
          return query.ast;
        })
        .reduce(
          (definitions, fragmentAst) =>
            definitions.concat(fragmentAst.definitions),
          []
        )
        // TODO Deduplicates also internal fragments
        .filter(def => importedFragmentNames.indexOf(def.name.value) === -1);

      fragmentDefs = [...fragmentDefs, ...defsToImport];
      return defsToImport.map(def => def.name.value);
    },
    parse() {
      const parsedAST = gql`${source}`;
      parsedAST.definitions = [...parsedAST.definitions, ...fragmentDefs];
      ast = parsedAST;
    },
    makeSourceEnumerable() {
      const newAST = JSON.parse(JSON.stringify(ast));
      newAST.loc.source = ast.loc.source;
      ast = newAST;
    },
    get ast() {
      return ast;
    }
  };
}

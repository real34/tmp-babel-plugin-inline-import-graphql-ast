import path from "path";
import pluginTester from "babel-plugin-tester";
import plugin from "../";

pluginTester({
  plugin,
  pluginName: "babel-plugin-inline-import-graphql-ast",
  snapshot: true,
  tests: [
    {
      title: "should import simple queries",
      fixture: path.join(__dirname, "__fixtures__", "simple-query", "code.js"),
      snapshot: true
    },
    {
      title: "should import queries with imported fragments",
      fixture: path.join(
        __dirname,
        "__fixtures__",
        "query-importing-fragment",
        "code.js"
      ),
      snapshot: true
    },
    {
      title: "should deduplicate imported fragments to import them only once",
      fixture: path.join(
        __dirname,
        "__fixtures__",
        "query-importing-same-fragment-twice",
        "code.js"
      ),
      snapshot: true
    },
    {
      title: "should import fragments recursively",
      fixture: path.join(
        __dirname,
        "__fixtures__",
        "query-importing-nested-fragment",
        "code.js"
      ),
      snapshot: true
    },
    {
      title: "should honor custom babel module loaders",
      babelOptions: {
        babelrc: true // does not work properly because plugins are loaded after the SUT
      },
      fixture: path.join(
        __dirname,
        "__fixtures__",
        "query-importing-fragment-with-custom-filenames",
        "code.js"
      ),
      snapshot: true
    }
  ]
});

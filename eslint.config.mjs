import eslint from "@eslint/js";
import tseslint from 'typescript-eslint';
import jsdocPlugin from "eslint-plugin-jsdoc";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default [
    jsdocPlugin.configs["flat/recommended"],
    ...tseslint.configs.recommended,
    prettier,
    {
        ignores: ["dist/**", "node_modules", "esling.config.mjs", "css/css.css"],
    },
    {
        files: ["ts/**/*.ts"],
        settings: {
            jsdoc: {
                preferredTypes: {
                    object: false,
                    Object: false,
                    Array: false,
                    array: false,
                    Function: false,
                    function: false,
                },
            },
        },
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            parserOptions: {
                project: true,
            },
            globals: {
                ...globals.browser,
                FullCalendar: "readonly",
            },
        },
        plugins: {
            jsdoc: jsdocPlugin,
        },
        rules: {
            ...eslint.configs.recommended.rules,
            "curly": ["warn", "all"],
            "camelcase": ["error", { "properties": "never", "ignoreDestructuring": true }],
            "complexity": ["warn", { "max": 7 }],
            "consistent-this": ["error", "self"],
            "default-param-last": "warn",
            "eqeqeq": ["error", "always"],
            "func-name-matching": "error",
            "func-names": ["warn", "as-needed"],
            "id-match": [
                "error",
                "^[a-zA-Z_$][a-zA-Z0-9_$]*$",
                { "properties": false },
            ],
            "indent": ["error", 4, { "SwitchCase": 1 }],
            "max-depth": ["warn", 4],
            "max-nested-callbacks": ["warn", 4],
            "max-params": ["warn", 4],
            "max-statements": ["warn", 12],
            "max-lines-per-function": ["warn", { "max": 30, "skipComments": true, "skipBlankLines": true, "IIFEs": true }],
            "no-alert": "warn",
            "no-console": "off",
            "no-debugger": "error",
            "no-duplicate-imports": "error",
            "no-eval": "error",
            "no-extend-native": "error",
            "no-implied-eval": "error",
            "no-implicit-coercion": "error",
            "no-implicit-globals": "error",
            "no-inner-declarations": "error",
            "no-new-func": "error",
            "no-new-object": "error",
            "no-new-wrappers": "error",
            "no-octal": "error",
            "no-octal-escape": "error",
            "no-proto": "error",
            "no-return-assign": "error",
            "no-script-url": "error",
            "no-sequences": "error",
            "no-throw-literal": "error",
            "no-unsafe-finally": "error",
            "no-with": "error",
            "no-unused-vars": "off",
            "no-warning-comments": [
                "warn",
                { "terms": ["TODO", "FIXME", "HACK"], "location": "anywhere" },
            ],
            "no-restricted-syntax": [
                "error",
                {
                    "selector": "ForStatement",
                    "message": "Use map, filter, reduce, or another higher-order function instead of a raw loop.",
                },
                {
                    "selector": "ForInStatement",
                    "message": "Use Object.keys, Object.values, or Object.entries instead of a raw loop.",
                },
                {
                    "selector": "ForOfStatement",
                    "message": "Use map, filter, reduce, or another higher-order function instead of a raw loop.",
                },
            ],
            "no-var": "error",
            "prefer-const": "error",
            "prefer-object-has-own": "error",
            "prefer-template": "error",
            "quotes": ["error", "double", { "allowTemplateLiterals": true, "avoidEscape": true }],
            "semi": ["error", "always"],
            "jsdoc/require-jsdoc": [
                "error",
                {
                    "publicOnly": false,
                    "require": {
                        "ClassDeclaration": true,
                        "ClassExpression": true,
                        "FunctionExpression": true,
                        "MethodDefinition": true
                    },
                },
            ],
            "jsdoc/require-description": ["error", { "descriptionStyle": "any" }],
            "jsdoc/no-bad-blocks": "error",
            "jsdoc/no-blank-blocks": "error",
            "jsdoc/require-hyphen-before-param-description": "warn",
            "jsdoc/require-throws": "error",
            "jsdoc/require-throws-description": "error",
            "jsdoc/text-escaping": ["warn", { "escapeHTML": true, "escapeMarkdown": true }],
            "jsdoc/sort-tags": "warn",
            "jsdoc/type-formatting": "warn",
            "jsdoc/check-types": [
                "warn",
                {
                    "noDefaults": true,
                    "exemptTagContexts": [
                        { "tag": "typedef", "types": true },
                        { "tag": "property", "types": true }
                    ],
                },
            ],
            "jsdoc/valid-types": "error",
            "jsdoc/no-undefined-types": ["warn", { "disableReporting": false }],
        },
    },
];
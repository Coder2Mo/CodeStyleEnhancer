"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const autoCloseBrackets_1 = require("../src/autoCloseBrackets");
function activate(context) {
    (0, autoCloseBrackets_1.activate)(context);
}
exports.activate = activate;
function deactivate() {
    (0, autoCloseBrackets_1.deactivate)();
}
exports.deactivate = deactivate;

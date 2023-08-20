"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLintingResults = void 0;
function parseLintingResults(rawResults) {
    return __awaiter(this, void 0, void 0, function* () {
        const lintingResults = [];
        for (const rawResult of rawResults) {
            const lintingResult = {
                filePath: rawResult.filePath,
                line: rawResult.line,
                column: rawResult.column,
                message: rawResult.message,
                ruleId: rawResult.ruleId,
                severity: rawResult.severity,
                source: rawResult.source,
                fixable: rawResult.fixable,
                suggestions: rawResult.suggestions,
                // Additional properties (example values)
                codeFrame: rawResult.codeFrame,
                documentationUrl: rawResult.documentationUrl,
                filePathRelativeToWorkspace: rawResult.filePathRelativeToWorkspace,
                codeSnippet: rawResult.codeSnippet,
            };
            lintingResults.push(lintingResult);
        }
        return lintingResults;
    });
}
exports.parseLintingResults = parseLintingResults;

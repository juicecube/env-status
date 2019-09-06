"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FETCH_ERR;
(function (FETCH_ERR) {
    FETCH_ERR["CONFIG_UNDEFINED"] = "CONFIG_UNDEFINED";
    FETCH_ERR["URL_FUNCTION_UNDEFINED"] = "URL_FUNCTION_UNDEFINED";
    FETCH_ERR["LOAD_ERROR"] = "LOAD_ERROR";
    FETCH_ERR["PARSE_RESPONSE_ERROR"] = "PARSE_RESPONSE_ERROR";
})(FETCH_ERR = exports.FETCH_ERR || (exports.FETCH_ERR = {}));
var BRANCH_TYPES;
(function (BRANCH_TYPES) {
    BRANCH_TYPES["ITERATION"] = "ITERATION";
    BRANCH_TYPES["ITERATION_FEATURE"] = "ITERATION_FEATURE";
    BRANCH_TYPES["ITERATION_FIX"] = "ITERATION_FIX";
    BRANCH_TYPES["HOTFIX"] = "HOTFIX";
    BRANCH_TYPES["OTHERS"] = "OTHERS";
})(BRANCH_TYPES = exports.BRANCH_TYPES || (exports.BRANCH_TYPES = {}));
function isEnvErrDataType(type) {
    return type.err !== undefined;
}
exports.isEnvErrDataType = isEnvErrDataType;

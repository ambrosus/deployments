"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sourcifyOne = exports.sourcifyAll = exports.loadAllDeployments = exports.loadDeployment = exports.deploy = void 0;
const deploy_1 = require("./deploy");
Object.defineProperty(exports, "deploy", { enumerable: true, get: function () { return deploy_1.deploy; } });
const deployments_1 = require("./deployments");
Object.defineProperty(exports, "loadAllDeployments", { enumerable: true, get: function () { return deployments_1.loadAllDeployments; } });
Object.defineProperty(exports, "loadDeployment", { enumerable: true, get: function () { return deployments_1.loadDeployment; } });
const sourcify_1 = require("./sourcify");
Object.defineProperty(exports, "sourcifyAll", { enumerable: true, get: function () { return sourcify_1.sourcifyAll; } });
Object.defineProperty(exports, "sourcifyOne", { enumerable: true, get: function () { return sourcify_1.sourcifyOne; } });
//# sourceMappingURL=index.js.map
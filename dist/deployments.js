"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._loadDeployments = exports._contractFromDeployment = exports.loadAllDeployments = exports.loadDeployment = void 0;
const ethers_1 = require("ethers");
function loadDeployment(contractName, networkId, signer) {
    const deployments = _loadDeployments(networkId);
    if (!deployments[contractName])
        throw new Error(`Can't find deployment for ${contractName} in network ${networkId}`);
    return _contractFromDeployment(deployments[contractName], signer);
}
exports.loadDeployment = loadDeployment;
function loadAllDeployments(networkId, signer) {
    const deployments = _loadDeployments(networkId);
    const result = {};
    for (const name of Object.keys(deployments))
        result[name] = _contractFromDeployment(deployments[name], signer);
    return result;
}
exports.loadAllDeployments = loadAllDeployments;
function _contractFromDeployment(deployment, signer) {
    return new ethers_1.ethers.Contract(deployment.address, deployment.abi, signer);
}
exports._contractFromDeployment = _contractFromDeployment;
function _loadDeployments(chainId) {
    return require(`../../airdao-node-contracts/deployments/${chainId}.json`);
}
exports._loadDeployments = _loadDeployments;
//# sourceMappingURL=deployments.js.map
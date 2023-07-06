import { ethers } from "ethers";
export function loadDeployment(contractName, networkId, signer) {
    const deployments = _loadDeployments(networkId);
    if (!deployments[contractName])
        throw new Error(`Can't find deployment for ${contractName} in network ${networkId}`);
    return _contractFromDeployment(deployments[contractName], signer);
}
export function loadAllDeployments(networkId, signer) {
    const deployments = _loadDeployments(networkId);
    const result = {};
    for (const name of Object.keys(deployments))
        result[name] = _contractFromDeployment(deployments[name], signer);
    return result;
}
export function _contractFromDeployment(deployment, signer) {
    return new ethers.Contract(deployment.address, deployment.abi, signer);
}
export function _loadDeployments(chainId) {
    return require(`../deployments/${chainId}.json`);
}
//# sourceMappingURL=deployments.js.map
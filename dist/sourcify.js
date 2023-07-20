"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sourcifyOne = exports.sourcifyAll = void 0;
const deployments_1 = require("./deployments");
const ENDPOINT = "https://sourcify.ambrosus.io/";
async function sourcifyAll(hre) {
    // @ts-ignore
    const { chainId } = await hre.ethers.getDefaultProvider().getNetwork();
    const deployments = (0, deployments_1._loadDeployments)(chainId);
    for (const [contractName, deployment] of Object.entries(deployments))
        if (deployment.proxy) {
            await sourcifyOne(hre, deployment.proxy.fullyQualifiedName, deployment.address, chainId, contractName + " Proxy");
            await sourcifyOne(hre, deployment.fullyQualifiedName, deployment.proxy.implementation, chainId, contractName);
        }
        else {
            await sourcifyOne(hre, deployment.fullyQualifiedName, deployment.address, chainId, contractName);
        }
}
exports.sourcifyAll = sourcifyAll;
async function sourcifyOne(hre, fullyQualifiedName, address, chainId, name) {
    name = name || fullyQualifiedName;
    if (await isVerified(address, chainId)) {
        console.log(`Already verified: ${name} (${address})`);
        return;
    }
    try {
        console.info(`Verifying ${name} (${address} on chain ${chainId}) ...`);
        const metadata = await loadMetadata(hre, fullyQualifiedName);
        const result = await verify(chainId, address, metadata);
        if (result == "perfect")
            console.info(`  Contract ${name} is now verified`);
        if (result == "partial")
            console.warn(`  Contract ${name} is now partial verified`);
    }
    catch (e) {
        console.error(`  Failed to verify ${fullyQualifiedName} (${address})`, (e.response && JSON.stringify(e.response.data)) || e);
    }
}
exports.sourcifyOne = sourcifyOne;
// INTERNAL
async function isVerified(address, chainId) {
    const checkResponse = await fetch(`${ENDPOINT}checkByAddresses?addresses=${address.toLowerCase()}&chainIds=${chainId}`).then((r) => r.json());
    return checkResponse[0].status === "perfect";
}
async function verify(chainId, address, metadata) {
    const data = {
        address: address,
        chain: chainId.toString(),
        files: { "metadata.json": metadata },
    };
    const submissionResponse = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    }).then((r) => r.json());
    if (submissionResponse.error)
        throw new Error(submissionResponse.error);
    return submissionResponse.result[0].status;
}
async function loadMetadata(hre, fullyQualifiedName) {
    // @ts-ignore
    import { parseFullyQualifiedName } from "hardhat/utils/contract-names";
    const buildInfo = await getBuildInfo(hre, fullyQualifiedName);
    const { sourceName, contractName } = (0, contract_names_1.parseFullyQualifiedName)(fullyQualifiedName);
    const metadataStr = buildInfo.output.contracts[sourceName][contractName].metadata;
    if (!metadataStr)
        throw `No metadata for contract ${fullyQualifiedName}`;
    const metadata = JSON.parse(metadataStr);
    Object.keys(metadata.sources).forEach((contractSource) => {
        metadata.sources[contractSource].content =
            buildInfo?.input.sources[contractSource].content;
        delete metadata.sources[contractSource].urls;
    });
    return JSON.stringify(metadata);
}
async function getBuildInfo(hre, fullyQualifiedName) {
    if (fullyQualifiedName ==
        "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy")
        return require("@openzeppelin/upgrades-core/artifacts/build-info.json");
    return await hre.artifacts.getBuildInfo(fullyQualifiedName);
}
//# sourceMappingURL=sourcify.js.map
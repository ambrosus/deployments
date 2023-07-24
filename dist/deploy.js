"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deploy = void 0;
const fs = __importStar(require("fs"));
const deployments_1 = require("./deployments");
const path = __importStar(require("path"));
const contract_names_1 = require("hardhat/utils/contract-names");
async function deploy({ contractName, networkId, artifactName, deployArgs, signer, loadIfAlreadyDeployed, isUpgradeableProxy, proxyOptions = { kind: "uups" } }) {
    const { artifacts, ethers, upgrades } = await Promise.resolve().then(() => __importStar(require("hardhat")));
    if (!networkId)
        networkId = (await ethers.provider.getNetwork()).chainId;
    const deployments = (0, deployments_1._loadDeployments)(networkId);
    if (deployments[contractName]) {
        if (loadIfAlreadyDeployed) {
            console.log(`Loaded already deployed ${contractName}`);
            return (0, deployments_1._contractFromDeployment)(deployments[contractName], signer);
        }
        throw new Error(`Already deployed ${contractName}`);
    }
    const factory = await ethers.getContractFactory(artifactName);
    const artifact = await artifacts.readArtifact(artifactName);
    const fullyQualifiedName = (0, contract_names_1.getFullyQualifiedName)(artifact.sourceName, artifact.contractName);
    console.log(`deploying ${contractName} in network ${networkId}...`);
    const contract = isUpgradeableProxy
        ? await upgrades.deployProxy(factory, deployArgs, proxyOptions)
        : await factory.deploy(...deployArgs);
    await contract.deployed();
    const deployment = {
        address: contract.address,
        abi: contract.interface.format(),
        deployTx: contract.deployTransaction.hash,
        fullyQualifiedName: fullyQualifiedName,
    };
    if (isUpgradeableProxy) {
        const implAddr = await upgrades.erc1967.getImplementationAddress(contract.address);
        console.log(`deployed ${contractName} at`, contract.address, "implementation at", implAddr);
        deployment.proxy = {
            implementation: implAddr,
            fullyQualifiedName: {
                transparent: "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy",
                uups: "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy"
            }[proxyOptions.kind],
        };
    }
    else {
        console.log(`deployed ${contractName} at`, contract.address);
    }
    deployments[contractName] = deployment;
    const deploymentPath = path.resolve(__dirname, `../../../deployments/${networkId}.json`);
    fs.writeFileSync(deploymentPath, JSON.stringify(deployments, null, 2));
    return contract;
}
exports.deploy = deploy;
//# sourceMappingURL=deploy.js.map
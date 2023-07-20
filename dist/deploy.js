"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deploy = void 0;
const fs = require("fs");
const deployments_1 = require("./deployments");
const path = require("path");
const contract_names_1 = require("hardhat/utils/contract-names");
/**
 * @param contractName - The name under which to save the contract. Must be unique.
 * @param networkId - Network chain id used as filename in deployments folder.
 * @param artifactName - Name of the contract artifact. For example, ERC20.
 * @param deployArgs - Deploy arguments
 * @param signer - Signer, that will deploy contract (or with witch contract will be loaded from deployment)
 * @param loadIfAlreadyDeployed - Load contract if it already deployed; Otherwise throw exception
 * @param upgradeableProxy - Deploy contract as upgradeable proxy
 * @returns Deployed contract or contract loaded from deployments
 */
async function deploy(contractName, networkId, artifactName, deployArgs, signer, loadIfAlreadyDeployed = false, upgradeableProxy = false) {
    // @ts-ignore
    const { artifacts, ethers, upgrades } = await Promise.resolve().then(() => require("hardhat"));
    const deployments = (0, deployments_1._loadDeployments)(networkId);
    if (deployments[contractName]) {
        if (loadIfAlreadyDeployed) {
            console.log(`Already deployed ${contractName}`);
            return (0, deployments_1._contractFromDeployment)(deployments[contractName], signer);
        }
        throw new Error(`Already deployed ${contractName}`);
    }
    const factory = await ethers.getContractFactory(artifactName);
    const artifact = await artifacts.readArtifact(artifactName);
    const fullyQualifiedName = (0, contract_names_1.getFullyQualifiedName)(artifact.sourceName, artifact.contractName);
    console.log(`deploying ${contractName} in network ${networkId}...`);
    const contract = upgradeableProxy
        ? await upgrades.deployProxy(factory, deployArgs)
        : await factory.deploy(...deployArgs);
    await contract.deployed();
    const deployment = {
        address: contract.address,
        abi: contract.interface.format(),
        deployTx: contract.deployTransaction.hash,
        fullyQualifiedName: fullyQualifiedName,
    };
    if (upgradeableProxy) {
        const implAddr = await upgrades.erc1967.getImplementationAddress(contract.address);
        console.log(`deployed ${contractName} at`, contract.address, "implementation at", implAddr);
        deployment.proxy = {
            implementation: implAddr,
            fullyQualifiedName: "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy",
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
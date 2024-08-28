import { ContractFactory, Signer } from "ethers";
import { getFullyQualifiedName } from "hardhat/utils/contract-names";

import { GetContractTypeFromFactory, GetDeployArgsType } from "./types";
import { _contractFromDeployment, _loadDeployments, _saveDeployments, Deployment } from "../deployments/deployments";
import type { DeployProxyOptions } from "@openzeppelin/hardhat-upgrades/src/utils";
import { HardhatRuntimeEnvironment } from "hardhat/types";


const OZ_PROXY_FULLY_QUALIFIED_NAMES = {
  transparent: "@openzeppelin/contracts-v5/proxy/transparent/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy",
  uups: "@openzeppelin/contracts-v5/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy"
};

export interface DeployOptions<Factory> {
  contractName: string,  // The name under which to save the contract. Must be unique.
  networkId?: bigint,  // Network chain id used as filename in deployments folder.
  artifactName: string,  // Name of the contract artifact. For example, ERC20.
  deployArgs: GetDeployArgsType<Factory>,  // Deploy arguments
  signer: Signer,  // Signer, that will deploy contract (or with witch contract will be loaded from deployment)
  loadIfAlreadyDeployed?: boolean, // Load contract if it already deployed; Otherwise throw exception

  isUpgradeableProxy?: boolean,  // Deploy contract as upgradeable proxy
  proxyOptions?: DeployProxyOptions,  // Openzeppelin upgrades deploy options
}


export async function makeDeploy(hre: HardhatRuntimeEnvironment) {
  const { artifacts, ethers, upgrades } = hre;



  async function deploy<N extends ContractFactory>(
    {
      contractName,
      networkId,
      artifactName,
      deployArgs,
      signer,
      loadIfAlreadyDeployed,
      isUpgradeableProxy,
      proxyOptions = { kind: "uups" }
    }: DeployOptions<N>
  ): Promise<GetContractTypeFromFactory<N>> {

    if (!networkId) networkId = (await ethers.provider.getNetwork()).chainId;

    const deployments = _loadDeployments(networkId!);

    if (deployments[contractName]) {
      if (loadIfAlreadyDeployed) {
        console.log(`Loaded already deployed ${contractName}`);
        return _contractFromDeployment(deployments[contractName], signer) as GetContractTypeFromFactory<N>;
      }
      throw new Error(`Already deployed ${contractName}`);
    }

    const factory = await ethers.getContractFactory(artifactName, signer);
    const artifact = await artifacts.readArtifact(artifactName);
    const fullyQualifiedName = getFullyQualifiedName(artifact.sourceName, artifact.contractName);

    console.log(`deploying ${contractName} in network ${networkId}...`);

    const contract = isUpgradeableProxy
      ? await upgrades.deployProxy(factory, deployArgs, proxyOptions)
      : await factory.deploy(...deployArgs);

    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    const deployment: Deployment = {
      address: contractAddress,
      abi: contract.interface.format() as string[],
      deployTx: contract.deploymentTransaction()!.hash,
      fullyQualifiedName: fullyQualifiedName,
    };

    if (isUpgradeableProxy) {
      const implAddr = await upgrades.erc1967.getImplementationAddress(contractAddress);
      console.log(`deployed ${contractName} at`, contractAddress, "implementation at", implAddr);

      deployment.proxy = {
        implementation: implAddr,
        fullyQualifiedName: getProxyFullyQualifiedName(proxyOptions.kind),
      };
    } else {
      console.log(`deployed ${contractName} at`, contractAddress);
    }

    deployments[contractName] = deployment;

    _saveDeployments(networkId!, deployments);

    return contract as GetContractTypeFromFactory<N>;
  }

  return deploy;

}

function getProxyFullyQualifiedName(kind?: string) {
  if (kind != "transparent" && kind != "uups") throw new Error(`Unknown proxy kind: ${kind}`);
  return OZ_PROXY_FULLY_QUALIFIED_NAMES[kind];
}

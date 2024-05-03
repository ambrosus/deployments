import {ContractFactory, Signer} from "ethers";
import * as fs from "fs";
import {_contractFromDeployment, _loadDeployments, Deployment,} from "../deployments";
import {GetARGsTypeFromFactory, GetContractTypeFromFactory,} from "./common-types";
import * as path from "path";
import {getFullyQualifiedName} from "hardhat/utils/contract-names";
import type {DeployProxyOptions} from "@openzeppelin/hardhat-upgrades/src/utils";


// returns initialize method arguments type if contract has `initialize` method
// otherwise returns constructor arguments type
type Initializable = { initialize(...a: any[]): Promise<any> };
type GetDeployArgsType<T> = GetContractTypeFromFactory<T> extends Initializable
  ? Parameters<GetContractTypeFromFactory<T>["initialize"]>
  : GetARGsTypeFromFactory<T>;


interface DeployOptions<Factory> {
  contractName: string,  // The name under which to save the contract. Must be unique.
  networkId?: bigint,  // Network chain id used as filename in deployments folder.
  artifactName: string,  // Name of the contract artifact. For example, ERC20.
  deployArgs: GetDeployArgsType<Factory>,  // Deploy arguments
  signer: Signer,  // Signer, that will deploy contract (or with witch contract will be loaded from deployment)
  loadIfAlreadyDeployed?: boolean, // Load contract if it already deployed; Otherwise throw exception

  isUpgradeableProxy?: boolean,  // Deploy contract as upgradeable proxy
  proxyOptions?: DeployProxyOptions,  // Openzeppelin upgrades deploy options
}


export async function deploy<N extends ContractFactory>(
  {
    contractName,
    networkId,
    artifactName,
    deployArgs,
    signer,
    loadIfAlreadyDeployed,
    isUpgradeableProxy,
    proxyOptions = {kind: "uups"}
  }: DeployOptions<N>
): Promise<GetContractTypeFromFactory<N>> {
  const {artifacts, ethers, upgrades} = await import("hardhat");
  if (!networkId) networkId = (await ethers.provider.getNetwork()).chainId;

  const deployments = _loadDeployments(networkId);

  if (deployments[contractName]) {
    if (loadIfAlreadyDeployed) {
      console.log(`Loaded already deployed ${contractName}`);
      return _contractFromDeployment(deployments[contractName], signer) as GetContractTypeFromFactory<N>;
    }
    throw new Error(`Already deployed ${contractName}`);
  }

  const factory = await ethers.getContractFactory(artifactName, signer);
  const artifact = await artifacts.readArtifact(artifactName);
  const fullyQualifiedName = getFullyQualifiedName(
    artifact.sourceName,
    artifact.contractName
  );

  console.log(`deploying ${contractName} in network ${networkId}...`);

  const contract = isUpgradeableProxy
    ? await upgrades.deployProxy(factory, deployArgs, proxyOptions)
    : await factory.deploy(...deployArgs);

  await contract.deployed();

  const deployment: Deployment = {
    address: await contract.getAddress(),
    abi: contract.interface.format() as string[],
    deployTx: contract.deploymentTransaction().hash,
    fullyQualifiedName: fullyQualifiedName,
  };

  if (isUpgradeableProxy) {
    const implAddr = await upgrades.erc1967.getImplementationAddress(
      await contract.getAddress()
    );
    console.log(`deployed ${contractName} at`, contract.address, "implementation at", implAddr);

    deployment.proxy = {
      implementation: implAddr,
      fullyQualifiedName:
        {
          transparent: "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy",
          uups: "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy"
        }[proxyOptions.kind],
    };
  } else {
    console.log(`deployed ${contractName} at`, contract.address);
  }

  deployments[contractName] = deployment;

  const deploymentPath = path.resolve(
    __dirname,
    `../../../../../deployments/${networkId}.json`
  );
  fs.writeFileSync(deploymentPath, JSON.stringify(deployments, null, 2));

  return contract as GetContractTypeFromFactory<N>;
}

import {ContractFactory, Signer} from "ethers";
import * as fs from "fs";
import {_loadDeployments,} from "../deployments";
import {GetContractTypeFromFactory,} from "./common-types";
import * as path from "path";
import {UpgradeProxyOptions} from "@openzeppelin/hardhat-upgrades/src/utils";


interface UpgradeOptions<Factory> {
  contractName: string,  // The name under which to save the contract. Must be unique.
  networkId?: bigint,  // Network chain id used as filename in deployments folder.
  opts?: UpgradeProxyOptions,
  artifactName?: string,  // Name of the contract artifact. For example, ERC20.
  signer: Signer,  // Signer, that will deploy contract (or with witch contract will be loaded from deployment)
}


export async function upgrade<N extends ContractFactory>(
  {
    contractName,
    networkId,
    opts,
    artifactName,
    signer,
  }: UpgradeOptions<N>
): Promise<GetContractTypeFromFactory<N>> {
  const {ethers, upgrades} = await import("hardhat");
  if (!networkId) networkId = (await ethers.provider.getNetwork()).chainId;

  const deployments = _loadDeployments(networkId);
  const deployment = deployments[contractName];
  if (!deployment) throw new Error(`Can't find deployment for ${contractName} in network ${networkId}`);

  artifactName = artifactName || deployment.fullyQualifiedName.split(":")[1];

  const factory = await ethers.getContractFactory(artifactName, signer);

  console.log(`upgrading ${contractName} in network ${networkId}...`);

  const contract = await upgrades.upgradeProxy(deployment.address, factory, opts);
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  const implAddr = await upgrades.erc1967.getImplementationAddress(
    contractAddress
  );
  console.log(`deployed ${contractName} at`, contractAddress, "implementation at", implAddr);

  deployment.abi = contract.interface.format() as string[];
  deployment.proxy.implementation = implAddr;

  deployments[contractName] = deployment;

  const deploymentPath = path.resolve(
    __dirname,
    `../../../../../deployments/${networkId}.json`
  );
  fs.writeFileSync(deploymentPath, JSON.stringify(deployments, null, 2));

  return contract as GetContractTypeFromFactory<N>;
}

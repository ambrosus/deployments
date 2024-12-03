import {Contract, ContractFactory, Signer, ContractTransaction} from "ethers";
import * as fs from "fs";
import {_contractFromDeployment, _loadDeployments, loadDeployment, Deployment} from "../deployments";
import {GetARGsTypeFromFactory, GetContractTypeFromFactory,} from "./common-types";
import {MultisigType, getMultisigSettings} from "./multisig-types";
import * as path from "path";
import {getFullyQualifiedName} from "hardhat/utils/contract-names";
import type {DeployProxyOptions} from "@openzeppelin/hardhat-upgrades/src/utils/options";

// returns initialize method arguments type if contract has `initialize` method
// otherwise returns constructor arguments type
type Initializable = { initialize(...a: any[]): Promise<any> };
type GetDeployArgsType<T> = GetContractTypeFromFactory<T> extends Initializable
  ? Parameters<GetContractTypeFromFactory<T>["initialize"]>
  : GetARGsTypeFromFactory<T>;


export interface MultisigFactoryContract extends Contract {
  createMultisig(
    signers: string[],
    isInitiatorFlags: boolean[],
    threshold: number,
    owner: string
  ): Promise<ContractTransaction>;
  registerMultisigs(multisigs: string[]): Promise<ContractTransaction>;
  isRegisteredMultisig(multisig: string): Promise<boolean>;
}

interface DeployOptions<Factory> {
  contractName: string,  // The name under which to save the contract. Must be unique.
  networkId?: number,  // Network chain id used as filename in deployments folder.
  artifactName: string,  // Name of the contract artifact. For example, ERC20.
  deployArgs: GetDeployArgsType<Factory>,  // Deploy arguments
  signer: Signer,  // Signer, that will deploy contract (or with witch contract will be loaded from deployment)
  loadIfAlreadyDeployed?: boolean, // Load contract if it already deployed; Otherwise throw exception

  isUpgradeableProxy?: boolean,  // Deploy contract as upgradeable proxy
  proxyOptions?: DeployProxyOptions,  // Openzeppelin upgrades deploy options
  
  withMultisig?: {
    name: string;  // Name for the multisig if new, or existing multisig name
    type: MultisigType;  // Type of multisig to create if new
  };
}

export interface MultisigSettings {
  signers: string[];
  isInitiatorFlags: boolean[];
  threshold: number;
  owner: string;
}

export function getMultisigFactory(networkId: number, signer?: Signer): MultisigFactoryContract {
  return loadDeployment('MultisigFactory', networkId, signer) as MultisigFactoryContract;
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
    withMultisig,
    proxyOptions = {kind: "uups"}
  }: DeployOptions<N>
): Promise<GetContractTypeFromFactory<N>> {
  const {artifacts, ethers, upgrades} = await import("hardhat") as any;
  if (!networkId) networkId = (await ethers.provider.getNetwork()).chainId;

  const deployments = _loadDeployments(networkId);
  let associatedMultisig: { address: string, type: MultisigType } | undefined;

  if (withMultisig) {
    // Check if multisig already exists in deployments
    const existingMultisig = deployments[withMultisig.name];
    
    if (existingMultisig) {
      associatedMultisig = {
        address: existingMultisig.address,
        type: existingMultisig.multisig!.type
      };
    } else {
      const settings = getMultisigSettings(withMultisig.type, networkId);
      const multisigFactory = loadDeployment('MultisigFactory', networkId, signer) as MultisigFactoryContract;
      
      const tx = await multisigFactory.createMultisig(
        settings.signers,
        settings.isInitiatorFlags,
        settings.threshold,
        settings.owner
      );
      
      const receipt = await tx.wait();
      const event = receipt.events?.find(e => e.event === 'MultisigCreated');
      if (!event) throw new Error('MultisigCreated event not found');
      
      associatedMultisig = {
        address: event.args.multisig,
        type: withMultisig.type
      };
      
      // Save multisig as a deployment
      deployments[withMultisig.name] = {
        address: associatedMultisig.address,
        abiPath: `./abis/Multisig.json`,
        deployTx: tx.hash,
        fullyQualifiedName: "Multisig",
        multisig: {
          address: associatedMultisig.address,
          type: associatedMultisig.type
        }
      };
    }
  }

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

  // Save ABI to a separate file
  const abiPath = path.resolve(
    __dirname,
    `../../../../../deployments/abis/${contractName}.json`
  );
  
  // Ensure the abis directory exists
  const abiDir = path.dirname(abiPath);
  if (!fs.existsSync(abiDir)) {
    fs.mkdirSync(abiDir, { recursive: true });
  }

  // Save ABI to file
  fs.writeFileSync(
    abiPath, 
    JSON.stringify(contract.interface.format(), null, 2)
  );

  const deployment: Deployment = {
    address: contract.address,
    abiPath: `./abis/${contractName}.json`,
    deployTx: contract.deployTransaction.hash,
    fullyQualifiedName: fullyQualifiedName,
  };

  if (isUpgradeableProxy) {
    const implAddr = await upgrades.erc1967.getImplementationAddress(
      contract.address
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

  if (associatedMultisig) {
    deployment.multisig = {
      address: associatedMultisig.address,
      type: associatedMultisig.type
    };
  }

  return contract as GetContractTypeFromFactory<N>;
}

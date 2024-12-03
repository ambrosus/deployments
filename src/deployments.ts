import {Contract, ethers, Signer} from "ethers";
import * as fs from 'fs';
import * as path from 'path';

type Deployments = { [name: string]: Deployment }
type DeploymentsContracts = { [name: string]: Contract }

export interface Deployment {
  address: string;
  abiPath: string;
  deployTx: string;
  fullyQualifiedName: string;
  proxy?: {
    implementation: string;
    fullyQualifiedName: string;
  };
  multisig?: {
    address: string;  // Address of the associated multisig
  };
}


export function loadDeployment(contractName: string, networkId: number, signer?: Signer): Contract {
  const deployments = _loadDeployments(networkId);
  console.log(deployments)
  if (!deployments[contractName])
    throw new Error(
      `Can't find deployment for ${contractName} in network ${networkId}`
    );

  return _contractFromDeployment(deployments[contractName], signer);
}

export function loadAllDeployments(networkId: number, signer?: Signer): DeploymentsContracts {
  const deployments = _loadDeployments(networkId);
  const result: DeploymentsContracts = {};

  for (const name of Object.keys(deployments))
    result[name] = _contractFromDeployment(deployments[name], signer);

  return result;
}

export function loadAllDeploymentsFromFile(deployments: Deployments, signer?: Signer): DeploymentsContracts {
  const result: DeploymentsContracts = {};

  for (const name of Object.keys(deployments))
    result[name] = _contractFromDeployment(deployments[name], signer);

  return result;
}

export function _contractFromDeployment(deployment: Deployment, signer?: Signer): Contract {
  const abi = _loadAbiFromPath(deployment.abiPath);
  return new ethers.Contract(deployment.address, abi, signer);
}

export function _loadDeployments(chainId: number): Deployments {
  const path = `../../../../deployments/${chainId}.json` // захист від вебпаку
  return require(path);
}

function _loadAbiFromPath(abiPath: string): any[] {
  const absolutePath = path.resolve(__dirname, '../../../../deployments', abiPath);
  const abiJson = fs.readFileSync(absolutePath, 'utf8');
  return JSON.parse(abiJson);
}


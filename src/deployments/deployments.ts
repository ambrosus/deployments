import { Contract, ethers, Signer } from "ethers";
import path from "path";
import fs from "fs";

type Deployments = { [name: string]: Deployment }
type DeploymentsContracts = { [name: string]: Contract }

export interface Deployment {
  address: string;
  abi: any[];
  deployTx: string;
  fullyQualifiedName: string;
  proxy?: {
    implementation: string;
    fullyQualifiedName: string;
  };
}


export const DEPLOYMENTS_DIR = "deployments";

export function loadDeployment(contractName: string, networkId: bigint, signer?: Signer): Contract {
  const deployments = _loadDeployments(networkId);
  if (!deployments[contractName])
    throw new Error(`Can't find deployment for ${contractName} in network ${networkId}`);

  return _contractFromDeployment(deployments[contractName], signer);
}

export function loadAllDeployments(networkId: bigint, signer?: Signer): DeploymentsContracts {
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

export function addDeployment(networkId: bigint, contractName: string, deployment: Deployment) {
  const deployments = _loadDeployments(networkId);
  deployments[contractName] = deployment;
  _saveDeployments(networkId, deployments);
}

export function _contractFromDeployment(deployment: Deployment, signer?: Signer): Contract {
  return new ethers.Contract(deployment.address, deployment.abi, signer);
}

export function _loadDeployments(chainId: bigint): Deployments {
  const deploymentPath = path.join(DEPLOYMENTS_DIR, `${chainId}.json`);
  try {
    return JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
  } catch (e) {
    console.warn(`Can't read deployments for chain ${chainId}, hope it's the first deployment`);
    return {};
  }
}


export function _saveDeployments(chainId: bigint, deployments: Deployments) {
  const deploymentPath = path.join(DEPLOYMENTS_DIR, `${chainId}.json`);
  if (!fs.existsSync(DEPLOYMENTS_DIR)) fs.mkdirSync(DEPLOYMENTS_DIR);
  fs.writeFileSync(deploymentPath, JSON.stringify(deployments, null, 2));
}

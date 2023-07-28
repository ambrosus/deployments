import {Contract, ethers, Signer} from "ethers";

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

export function loadDeployment(contractName: string, networkId: number, signer?: Signer): Contract {
  const deployments = _loadDeployments(networkId);
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
  return new ethers.Contract(deployment.address, deployment.abi, signer);
}

export function _loadDeployments(chainId: number): Deployments {
  const path = `../../../deployments/${chainId}.json` // захист від вебпаку
  return require(path);
}

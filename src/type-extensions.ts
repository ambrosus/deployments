import "hardhat/types/runtime";
import { ContractFactory } from "ethers";
import { GetContractTypeFromFactory } from "./deploying/types";
import { DeployOptions } from "./deploying/deploy";
import { UpgradeOptions } from "./deploying/upgrade";


interface DeploymentsPlugin {
  deploy<N extends ContractFactory>(deployOptions: DeployOptions<N>): Promise<GetContractTypeFromFactory<N>>
  upgrade<N extends ContractFactory>(upgradeOptions: UpgradeOptions<N>): Promise<GetContractTypeFromFactory<N>>
  sourcifyOne(fullyQualifiedName: string, address: string, chainId: bigint, name?: string): Promise<void>
  sourcifyAll(): Promise<void>
}

declare module "hardhat/types/runtime" {
  export interface HardhatRuntimeEnvironment {
    deployments: DeploymentsPlugin;
  }
}

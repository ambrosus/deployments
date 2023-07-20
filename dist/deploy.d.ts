import { ContractFactory, Signer } from "ethers";
import { GetARGsTypeFromFactory, GetContractTypeFromFactory } from "./common-types";
import type { DeployProxyOptions } from "@openzeppelin/hardhat-upgrades/src/utils";
type Initializable = {
    initialize(...a: any[]): Promise<any>;
};
type GetDeployArgsType<T> = GetContractTypeFromFactory<T> extends Initializable ? Parameters<GetContractTypeFromFactory<T>["initialize"]> : GetARGsTypeFromFactory<T>;
interface DeployOptions<Factory> {
    contractName: string;
    networkId?: number;
    artifactName: string;
    deployArgs: GetDeployArgsType<Factory>;
    signer: Signer;
    loadIfAlreadyDeployed?: boolean;
    isUpgradeableProxy?: boolean;
    proxyOptions?: DeployProxyOptions;
}
export declare function deploy<N extends ContractFactory>({ contractName, networkId, artifactName, deployArgs, signer, loadIfAlreadyDeployed, isUpgradeableProxy, proxyOptions }: DeployOptions<N>): Promise<GetContractTypeFromFactory<N>>;
export {};

import { ContractFactory, Signer } from "ethers";
import { GetARGsTypeFromFactory, GetContractTypeFromFactory } from "./common-types";
type Initializable = {
    initialize(...a: any[]): Promise<any>;
};
type GetDeployArgsType<T> = GetContractTypeFromFactory<T> extends Initializable ? Parameters<GetContractTypeFromFactory<T>["initialize"]> : GetARGsTypeFromFactory<T>;
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
export declare function deploy<N extends ContractFactory>(contractName: string, networkId: number, artifactName: string, deployArgs: GetDeployArgsType<N>, signer: Signer, loadIfAlreadyDeployed?: boolean, upgradeableProxy?: boolean): Promise<GetContractTypeFromFactory<N>>;
export {};

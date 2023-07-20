import { Contract, Signer } from "ethers";
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
export declare function loadDeployment(contractName: string, networkId: number, signer?: Signer): Contract;
export declare function loadAllDeployments(networkId: number, signer?: Signer): {
    [name: string]: Contract;
};
export declare function _contractFromDeployment(deployment: Deployment, signer?: Signer): Contract;
export declare function _loadDeployments(chainId: number): {
    [name: string]: Deployment;
};

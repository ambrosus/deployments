import { HardhatRuntimeEnvironment } from "hardhat/types";
export declare function sourcifyAll(hre: HardhatRuntimeEnvironment): Promise<void>;
export declare function sourcifyOne(hre: HardhatRuntimeEnvironment, fullyQualifiedName: string, address: string, chainId: number, name?: string): Promise<void>;

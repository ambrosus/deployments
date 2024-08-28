import { extendEnvironment, task } from "hardhat/config";
import { lazyObject } from "hardhat/plugins";
import "./type-extensions";
import { HardhatRuntimeEnvironment } from "hardhat/types";


import { sourcifyAll, sourcifyOne } from "./sourcify/sourcify";
import { loadDeployment } from "./deployments/deployments";


extendEnvironment((hre: HardhatRuntimeEnvironment) => {
  hre.deployments = lazyObject(() => {
    const { makeDeploy } = require("./deploying/deploy");
    const { makeUpgrade } = require("./deploying/upgrade")

    return {
      deploy: makeDeploy(hre),
      upgrade: makeUpgrade(hre),
      sourcifyOne: (fullyQualifiedName: string, address: string, chainId: bigint, name?: string) => sourcifyOne(hre, fullyQualifiedName, address, chainId, name),
      sourcifyAll: () => sourcifyAll(hre),
      loadDeployment: loadDeployment,
    };
  });
});

task("sourcify", "verify contracts using sourcify").setAction(async (args: any, hre: HardhatRuntimeEnvironment) => {
  await hre.run("compile"); // compile contract first
  await sourcifyAll(hre);
});

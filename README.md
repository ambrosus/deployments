# @airdao/deployments

- hardhat plugin
- ethers v6

## Install

1. Install the package

```bash
npm i @airdao/deployments@^6.0.0
```

2. Add to your hardhat config file

```typescript
import "@airdao/deployments";
```

## Usage

### Deploy
```typescript
import { deployments } from "hardhat";

import { MyErc20__factory } from "../typechain-types";

// deploy contract "MyErc20" as a UUPS proxy and save the deployment to the deployments with "MyToken" name
// or load already deployed contract (if "MyToken" exists in deployments) 

const myToken = await deployments.deploy<MyErc20__factory>({
    contractName: "MyToken",
    artifactName: "MyErc20",
    deployArgs: ["MyToken", "MY"],
    signer: deployer,
    isUpgradeableProxy: true,
    loadIfAlreadyDeployed: true,
});
```

### Load
```typescript
import { deployments } from "hardhat";
import { MyErc20 } from "../typechain-types";

const myToken = deployments.loadDeployment("MyToken", chainId) as MyErc20;
```

### Sourcify
To sourcify all deployments on the network, run:
```bash
 hardhat sourcify --network test
```



### Upgrade

```typescript
import { deployments } from "hardhat";

// upgrade contract using openzeppelin upgrades and update the deployment in deployments
await deployments.upgrade({
    contractName: "MyToken",
    signer: deployer,
    opts: {
        // unsafeAllowRenames: true,
    }
});
```

In order to upgrade the contract, it is necessary to have information about previous implementation, which is stored in .openzeppelin folder. 

If you lost this information, you can generate it again:
- compile the version of the contract that you want to upgrade FROM
- import it to the openzeppelin registry by running
```typescript
import { deployments, upgrades } from "hardhat";

const prevDeployment = deployments.loadDeployment("MyToken", chainId).address;
const factory = await ethers.getContractFactory("MyToken");
await upgrades.forceImport(prevDeployment, factory);
```

import * as fs from 'fs';
import * as path from 'path';

interface OldDeployment {
  address: string;
  abi: any[];  // The actual ABI was stored here
  deployTx: string;
  fullyQualifiedName: string;
  proxy?: {
    implementation: string;
    fullyQualifiedName: string;
  };
}

interface NewDeployment {
  address: string;
  abiPath: string;
  deployTx: string;
  fullyQualifiedName: string;
  proxy?: {
    implementation: string;
    fullyQualifiedName: string;
  };
}

async function migrateDeployments() {
  // Get all deployment files from the deployments directory
  const deploymentsDir = path.resolve(__dirname, '../../../deployments');
  const files = fs.readdirSync(deploymentsDir)
    .filter(file => file.endsWith('.json') && !isNaN(parseInt(file)));

  // Create abis directory if it doesn't exist
  const abisDir = path.join(deploymentsDir, 'abis');
  if (!fs.existsSync(abisDir)) {
    fs.mkdirSync(abisDir, { recursive: true });
  }

  for (const file of files) {
    const filePath = path.join(deploymentsDir, file);
    const oldDeployments: Record<string, OldDeployment> = JSON.parse(
      fs.readFileSync(filePath, 'utf8')
    );

    const newDeployments: Record<string, NewDeployment> = {};

    // Migrate each deployment
    for (const [contractName, oldDeployment] of Object.entries(oldDeployments)) {
      // Save ABI to separate file
      const abiFileName = `${contractName}.json`;
      const abiPath = path.join(abisDir, abiFileName);
      
      fs.writeFileSync(
        abiPath,
        JSON.stringify(oldDeployment.abi, null, 2)
      );

      // Create new deployment without ABI
      const newDeployment: NewDeployment = {
        address: oldDeployment.address,
        abiPath: `./abis/${abiFileName}`,
        deployTx: oldDeployment.deployTx,
        fullyQualifiedName: oldDeployment.fullyQualifiedName,
      };

      if (oldDeployment.proxy) {
        newDeployment.proxy = oldDeployment.proxy;
      }

      newDeployments[contractName] = newDeployment;
    }

    // Save new deployments file
    fs.writeFileSync(
      filePath,
      JSON.stringify(newDeployments, null, 2)
    );
  }

  console.log('Migration completed successfully');
}

// Run migration
migrateDeployments().catch(console.error);

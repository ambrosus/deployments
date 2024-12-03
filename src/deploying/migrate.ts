import * as fs from 'fs';
import * as path from 'path';

export interface OldDeployment {
  address: string;
  abi: any[];
  deployTx: string;
  fullyQualifiedName: string;
  proxy?: {
    implementation: string;
    fullyQualifiedName: string;
  };
}

export interface NewDeployment {
  address: string;
  abiPath: string;
  deployTx: string;
  fullyQualifiedName: string;
  proxy?: {
    implementation: string;
    fullyQualifiedName: string;
  };
}

export interface MigrationOptions {
  deploymentsDir: string;
  abisDir?: string; // Optional, will default to deployments/abis if not provided
}

export async function migrateDeployments(options: MigrationOptions): Promise<void> {
  const { deploymentsDir } = options;
  
  // Validate deployments directory
  if (!path.isAbsolute(deploymentsDir)) {
    throw new Error('deploymentsDir must be an absolute path');
  }
  
  if (!fs.existsSync(deploymentsDir)) {
    throw new Error(`Deployments directory does not exist: ${deploymentsDir}`);
  }

  const abisDir = options.abisDir || path.join(deploymentsDir, 'abis');

  // Get all deployment files
  const files = fs.readdirSync(deploymentsDir)
    .filter(file => file.endsWith('.json') && !isNaN(parseInt(file)));

  if (files.length === 0) {
    throw new Error(`No valid deployment files found in ${deploymentsDir}. Files should be named like "1.json", "2.json", etc.`);
  }

  // Create abis directory if it doesn't exist
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
      const abiFileName = `${contractName}.json`;
      const abiPath = path.join(abisDir, abiFileName);
      
      fs.writeFileSync(
        abiPath,
        JSON.stringify(oldDeployment.abi, null, 2)
      );

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

    fs.writeFileSync(
      filePath,
      JSON.stringify(newDeployments, null, 2)
    );
  }
}

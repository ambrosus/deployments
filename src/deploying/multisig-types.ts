import { Roadmap2023MultisigSettings, EcosystemMultisigSettings } from './addresses';
import { loadDeployment } from '../deployments';

export enum MultisigType {
  COMMON = "COMMON",
  ECOSYSTEM = "ECOSYSTEM"
}

export function getMultisigSettings(type: MultisigType, networkId: number) {
  // Load appropriate master multisig based on type
  const masterMultisigName = type === MultisigType.COMMON 
    ? 'MasterMultisig' 
    : 'Ecosystem_MasterMultisig';
  
  const masterMultisig = loadDeployment(masterMultisigName, networkId);
  
  switch (type) {
    case MultisigType.COMMON:
      return {
        signers: Roadmap2023MultisigSettings[0],
        isInitiatorFlags: Roadmap2023MultisigSettings[1],
        threshold: Roadmap2023MultisigSettings[2],
        owner: masterMultisig.address
      };
    case MultisigType.ECOSYSTEM:
      return {
        signers: EcosystemMultisigSettings[0],
        isInitiatorFlags: EcosystemMultisigSettings[1],
        threshold: EcosystemMultisigSettings[2],
        owner: masterMultisig.address
      };
    default:
      throw new Error(`Unknown multisig type: ${type}`);
  }
}

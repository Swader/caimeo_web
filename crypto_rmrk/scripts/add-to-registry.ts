import { run, network } from 'hardhat';
import { delay, isHardhatNetwork } from './utils';
import process from "node:process";

interface RegistryArgs {
  address: string;
  metadataUri: string;
}

export async function addToRegistry({ 
  address, 
  metadataUri 
}: RegistryArgs) {
  if (isHardhatNetwork()) {
    console.log('Skipping registry addition on hardhat network');
    return;
  }

  console.log(`\nAdding collection to Singular Registry on ${network.name}...`);
  console.log('Contract address:', address);
  console.log('Metadata URI:', metadataUri);

  const registry = await getRegistry();
  await registry.addExternalCollection(address, metadataUri);
  console.log('Collection added to Singular Registry');
}

// Allow running directly from command line
if (require.main === module) {
  const main = async () => {
    if (!process.env.SOULSHARDS_ADDRESS) {
      throw new Error('SOULSHARDS_ADDRESS not set');
    }

    await addToRegistry({
      address: process.env.SOULSHARDS_ADDRESS,
      metadataUri: "ipfs://QmRAQt4xSL1F6AbZPTfE1j7KkroKjeqoEKn3Qceq7cm5jt"
    });
  };

  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} 
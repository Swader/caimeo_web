import { run, network } from 'hardhat';
import { delay, isHardhatNetwork } from './utils';
import process from "node:process";

interface VerifyArgs {
  address: string;
  constructorArgs: any[];
  contract?: string;
}

export async function verifyContract({ 
  address, 
  constructorArgs, 
  contract 
}: VerifyArgs) {
  if (isHardhatNetwork()) {
    console.log('Skipping verification on hardhat network');
    return;
  }

  // Validate environment
  if (!process.env.POLYGONSCAN_API_KEY) {
    throw new Error('POLYGONSCAN_API_KEY not set');
  }

  console.log(`\nVerifying contract on ${network.name}...`);
  console.log('Contract address:', address);
  console.log('Constructor arguments:', constructorArgs);
  if (contract) console.log('Contract path:', contract);

  // Wait for blockchain to catch up
  console.log('\nWaiting 20 seconds before verification...');
  await delay(20000);

  try {
    await run('verify:verify', {
      address,
      constructorArguments: constructorArgs,
      contract
    });
    console.log('\nContract verified successfully!');
  } catch (error: any) {
    if (error.message.includes('Already Verified')) {
      console.log('\nContract already verified');
    } else {
      console.error('\nVerification failed:', error);
      throw error;
    }
  }
}

// Allow running directly from command line
if (require.main === module) {
  // This will verify the SoulShard contract specifically
  const main = async () => {
    if (!process.env.SOULSHARDS_ADDRESS) {
      throw new Error('SOULSHARDS_ADDRESS not set');
    }
    if (!process.env.USER_ADDRESS) {
      throw new Error('USER_ADDRESS not set');
    }
    if (!process.env.LOCAL_WETH_ADDRESS && isHardhatNetwork()) {
      throw new Error('LOCAL_WETH_ADDRESS not set');
    }

    const weth = isHardhatNetwork() 
      ? process.env.LOCAL_WETH_ADDRESS 
      : "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619";

    const args = [
      "ipfs://QmUSBZxq4KpQS8MJR7ynkRLAZyGXXexeXVqqhco3pwSzh2",
      7777n,
      process.env.USER_ADDRESS,
      500,
      "ipfs://QmY3pr6Lpjy4wcWdZ3hFXT7GZaoxLg3HFrZtkoXh1Fq5WP",
      ethers.parseUnits("0.07", 18),
      weth
    ] as const;

    await verifyContract({
      address: process.env.SOULSHARDS_ADDRESS,
      constructorArgs: args,
      contract: 'contracts/Shard.sol:SoulShard'
    });
  };

  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} 
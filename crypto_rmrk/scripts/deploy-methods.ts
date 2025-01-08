import { ethers, run, network } from 'hardhat';
import { SoulShard } from '../typechain-types';
import { getRegistry } from './get-registry';
import { delay, isHardhatNetwork } from './utils';
import {
  RMRKBulkWriter,
  RMRKCatalogImpl,
  RMRKCatalogUtils,
  RMRKCollectionUtils,
  RMRKEquipRenderUtils,
  RMRKRoyaltiesSplitter,
} from '../typechain-types';

// Use the appropriate WETH address based on network
const POLYGON_WETH = "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619"; // Real WETH on Polygon
let weth = POLYGON_WETH; // Default to Polygon WETH

async function fundUserAddress() {
  if (!isHardhatNetwork()) return;
  
  const userAddress = process.env.USER_ADDRESS;
  if (!userAddress) {
    console.warn("USER_ADDRESS not set in .env, skipping funding");
    return;
  }

  const signer = (await ethers.getSigners())[0];
  const fundAmount = ethers.parseEther("10.0"); // Send 10 ETH
  
  console.log(`Funding ${userAddress} with ${ethers.formatEther(fundAmount)} ETH...`);
  const tx = await signer.sendTransaction({
    to: userAddress,
    value: fundAmount
  });
  await tx.wait();
  console.log("Funding complete");
}

export async function deployBulkWriter(): Promise<RMRKBulkWriter> {
  const bulkWriterFactory = await ethers.getContractFactory('RMRKBulkWriter');
  const bulkWriter = await bulkWriterFactory.deploy();
  await bulkWriter.waitForDeployment();
  const bulkWriterAddress = await bulkWriter.getAddress();
  console.log('Bulk Writer deployed to:', bulkWriterAddress);

  await verifyIfNotHardhat(bulkWriterAddress);
  return bulkWriter;
}

export async function deployCatalogUtils(): Promise<RMRKCatalogUtils> {
  const catalogUtilsFactory = await ethers.getContractFactory('RMRKCatalogUtils');
  const catalogUtils = await catalogUtilsFactory.deploy();
  await catalogUtils.waitForDeployment();
  const catalogUtilsAddress = await catalogUtils.getAddress();
  console.log('Catalog Utils deployed to:', catalogUtilsAddress);

  await verifyIfNotHardhat(catalogUtilsAddress);
  return catalogUtils;
}

export async function deployCollectionUtils(): Promise<RMRKCollectionUtils> {
  const collectionUtilsFactory = await ethers.getContractFactory('RMRKCollectionUtils');
  const collectionUtils = await collectionUtilsFactory.deploy();
  await collectionUtils.waitForDeployment();
  const collectionUtilsAddress = await collectionUtils.getAddress();
  console.log('Collection Utils deployed to:', collectionUtilsAddress);

  await verifyIfNotHardhat(collectionUtilsAddress);
  return collectionUtils;
}

export async function deployRenderUtils(): Promise<RMRKEquipRenderUtils> {
  const renderUtilsFactory = await ethers.getContractFactory('RMRKEquipRenderUtils');
  const renderUtils = await renderUtilsFactory.deploy();
  await renderUtils.waitForDeployment();
  const renderUtilsAddress = await renderUtils.getAddress();
  console.log('Equip Render Utils deployed to:', renderUtilsAddress);

  await verifyIfNotHardhat(renderUtilsAddress);
  return renderUtils;
}

export async function deployCatalog(
  catalogMetadataUri: string,
  catalogType: string,
): Promise<RMRKCatalogImpl> {
  const catalogFactory = await ethers.getContractFactory('RMRKCatalogImpl');
  const catalog = await catalogFactory.deploy(catalogMetadataUri, catalogType);
  await catalog.waitForDeployment();
  const catalogAddress = await catalog.getAddress();
  console.log('Catalog deployed to:', catalogAddress);

  await verifyIfNotHardhat(catalogAddress, [catalogMetadataUri, catalogType]);
  return catalog;
}

export async function deployRoyaltiesSplitter(
  beneficiaries: string[],
  sharesBPS: number[],
): Promise<RMRKRoyaltiesSplitter> {
  const splitterFactory = await ethers.getContractFactory('RMRKRoyaltiesSplitter');
  const splitter = await splitterFactory.deploy(beneficiaries, sharesBPS);
  await splitter.waitForDeployment();
  const splitterAddress = await splitter.getAddress();
  console.log('RoyaltiesSplitter deployed to:', splitterAddress);

  await verifyIfNotHardhat(splitterAddress, [beneficiaries, sharesBPS]);
  return splitter;
}

async function verifyIfNotHardhat(contractAddress: string, args: any[] = []) {
  if (isHardhatNetwork()) {
    // Hardhat
    return;
  }

  // sleep 20s
  await delay(20000);

  console.log('Etherscan contract verification starting now.');
  try {
    await run('verify:verify', {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (error) {
    // probably already verified
  }
}

export async function deploySoulShard(): Promise<SoulShard> {
  console.log(`Deploying SoulShard to ${network.name} blockchain...`);

  // Fund user address first if we're on local network
  if (isHardhatNetwork()) {
    await fundUserAddress();
    
    // Use local WETH address from env
    const localWeth = process.env.LOCAL_WETH_ADDRESS;
    if (!localWeth) {
      throw new Error("LOCAL_WETH_ADDRESS not set in .env. Please deploy WETH first using deploy-weth.ts");
    }
    weth = localWeth;
  }

  const contractFactory = await ethers.getContractFactory("SoulShard");
  const args = [
    "ipfs://QmUSBZxq4KpQS8MJR7ynkRLAZyGXXexeXVqqhco3pwSzh2",
    7777n,
    (await ethers.getSigners())[0].address,
    500,
    "ipfs://QmY3pr6Lpjy4wcWdZ3hFXT7GZaoxLg3HFrZtkoXh1Fq5WP",
    ethers.parseUnits("0.01", 18),
    weth
    ] as const;
  const contract: SoulShard = await contractFactory.deploy(...args);
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  console.log(`SoulShard deployed to ${contractAddress}`);

  if (!isHardhatNetwork()) {
    console.log('Waiting 10 seconds before verifying contract...')
    await delay(10000);
    await run('verify:verify', {
      address: contractAddress,
      constructorArguments: args,
      contract: 'contracts/SoulShard.sol:SoulShard',
    });

    // Only do on testing, or if whitelisted for production
    const registry = await getRegistry();
    await registry.addExternalCollection(contractAddress, args[0]);
    console.log('Collection added to Singular Registry');
  }
  return contract;
}
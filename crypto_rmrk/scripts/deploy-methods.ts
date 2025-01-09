import { ethers, run, network } from 'hardhat';
import { SoulShard } from '../typechain-types';
// import { getRegistry } from './get-registry';
import { delay, isHardhatNetwork } from './utils';
import {
  RMRKBulkWriter,
  RMRKCatalogImpl,
  RMRKCatalogUtils,
  RMRKCollectionUtils,
  RMRKEquipRenderUtils,
  RMRKRoyaltiesSplitter,
} from '../typechain-types';
import process from "node:process";
import { verifyContract } from './verify-contract';

// Use the appropriate WETH address based on network
const POLYGON_WETH = "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619"; // Real WETH on Polygon
let weth = POLYGON_WETH; // Default to Polygon WETH
const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, ethers.provider);

async function fundUserAddress() {
  if (!isHardhatNetwork()) {
    console.log("Not on hardhat network, skipping funding");
    return;
  }
  
  const userAddress = process.env.USER_ADDRESS;
  if (!userAddress) {
    console.warn("USER_ADDRESS not set in .env, skipping funding");
    return;
  }

  const primeSigner = (await ethers.getSigners())[0];
  
  const fundAmount = ethers.parseEther("10.0"); // Send 10 ETH
  
  console.log(`Funding ${userAddress} from ${primeSigner.address} with ${ethers.formatEther(fundAmount)} ETH...`);
  const tx = await primeSigner.sendTransaction({
    to: userAddress,
    value: fundAmount
  });
  await tx.wait();
  console.log("Funding complete");
}

export async function deployBulkWriter(): Promise<RMRKBulkWriter> {
  const bulkWriterFactory = await ethers.getContractFactory('RMRKBulkWriter', signer);
  const bulkWriter = await bulkWriterFactory.deploy();
  await bulkWriter.waitForDeployment();
  const bulkWriterAddress = await bulkWriter.getAddress();
  console.log('Bulk Writer deployed to:', bulkWriterAddress);

  await verifyIfNotHardhat(bulkWriterAddress);
  return bulkWriter;
}

export async function deployCatalogUtils(): Promise<RMRKCatalogUtils> {
  const catalogUtilsFactory = await ethers.getContractFactory('RMRKCatalogUtils', signer);
  const catalogUtils = await catalogUtilsFactory.deploy();
  await catalogUtils.waitForDeployment();
  const catalogUtilsAddress = await catalogUtils.getAddress();
  console.log('Catalog Utils deployed to:', catalogUtilsAddress);

  await verifyIfNotHardhat(catalogUtilsAddress);
  return catalogUtils;
}

export async function deployCollectionUtils(): Promise<RMRKCollectionUtils> {
  const collectionUtilsFactory = await ethers.getContractFactory('RMRKCollectionUtils', signer);
  const collectionUtils = await collectionUtilsFactory.deploy();
  await collectionUtils.waitForDeployment();
  const collectionUtilsAddress = await collectionUtils.getAddress();
  console.log('Collection Utils deployed to:', collectionUtilsAddress);

  await verifyIfNotHardhat(collectionUtilsAddress);
  return collectionUtils;
}

export async function deployRenderUtils(): Promise<RMRKEquipRenderUtils> {
  const renderUtilsFactory = await ethers.getContractFactory('RMRKEquipRenderUtils', signer);
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
  const catalogFactory = await ethers.getContractFactory('RMRKCatalogImpl', signer);
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
  const splitterFactory = await ethers.getContractFactory('RMRKRoyaltiesSplitter', signer);
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

function validateEnvironment() {
  const required = ['PRIVATE_KEY', 'POLYGONSCAN_API_KEY', 'USER_ADDRESS'];
  for (const var_ of required) {
    if (!process.env[var_]) {
      throw new Error(`Missing required environment variable: ${var_}`);
    }
  }
}

export async function deploySoulShard(): Promise<SoulShard> {
  validateEnvironment();
  
  if (network.name !== 'polygon' && !isHardhatNetwork()) {
    throw new Error(`Invalid network ${network.name}. Use polygon or hardhat.`);
  }

  console.log(`Deploying SoulShard to ${network.name} blockchain...`);
  console.log('Using WETH address:', weth);
  
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

  const contractFactory = await ethers.getContractFactory("SoulShard", signer);
  const args = [
    "ipfs://QmRAQt4xSL1F6AbZPTfE1j7KkroKjeqoEKn3Qceq7cm5jt",
    7777n,
    process.env.USER_ADDRESS,
    500,
    "ipfs://QmXwoLRu2N9zVJFAW8f6W5eo8Yf4vTXu1ecBzeZ7cjXtWW",
    ethers.parseUnits("0.07", 18),
    weth
  ] as const;

  const contract: SoulShard = await contractFactory.deploy(...args);
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  console.log(`SoulShard deployed to ${contractAddress}`);

  if (!isHardhatNetwork()) {
    console.log('Waiting 10 seconds before verifying contract...')
    await delay(10000);
    await verifyContract({
      address: contractAddress,
      constructorArgs: args,
      contract: 'contracts/Shard.sol:SoulShard'
    });

    // Only do on testing, or if whitelisted for production
    // const registry = await getRegistry();
    // await registry.addExternalCollection(contractAddress, args[0]);
    // console.log('Collection added to Singular Registry');
  }

  console.log('Deployment Summary:');
  console.log('------------------');
  console.log('Contract:', contractAddress);
  console.log('WETH:', weth);
  //console.log('Price:', ethers.utils.formatEther(args[5]), 'WETH');
  console.log('Max Supply:', Number(args[1]));
  console.log('Royalty:', (Number(args[3])/100) + '%');
  console.log('Royalty Recipient:', args[2]);
  
  return contract;
}
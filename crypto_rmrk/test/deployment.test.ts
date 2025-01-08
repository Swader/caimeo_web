import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SoulShard } from "../typechain-types";
import { deploySoulShard } from "../scripts/deploy-methods";

describe("Deployment Tests", function () {
    let soulShard: SoulShard;
    let weth: Contract;
    let userAddress: string;
    let owner: string;

    async function deployTestWETH(userAddress: string): Promise<Contract> {
        console.log("Deploying TestWETH...");
        const TestWETH = await ethers.getContractFactory("TestWETH");
        const weth = await TestWETH.deploy();
        await weth.waitForDeployment();
        const wethAddress = await weth.getAddress();
        console.log("TestWETH deployed to:", wethAddress);

        // Mint initial supply
        const mintAmount = ethers.parseUnits("1000", 18); // 1000 WETH
        console.log("Minting", ethers.formatUnits(mintAmount, 18), "WETH to", userAddress);
        await weth.mint(userAddress, mintAmount);
        console.log("Minting complete");

        // Set the env variable for the SoulShard deployment
        process.env.LOCAL_WETH_ADDRESS = wethAddress;
        
        return weth;
    }

    before(async function () {
        userAddress = process.env.USER_ADDRESS || "";
        expect(userAddress, "USER_ADDRESS not set in .env").to.not.equal("");

        // Deploy WETH first
        weth = await deployTestWETH(userAddress);
        
        // Deploy SoulShard (which will use the WETH address from env)
        soulShard = await deploySoulShard();
        owner = (await ethers.getSigners())[0].address;
    });

    describe("SoulShard Contract", function () {
        it("should have correct max supply", async function () {
            expect(await soulShard.maxSupply()).to.equal(7777n);
        });

        it("should have correct owner", async function () {
            expect(await soulShard.owner()).to.equal(owner);
        });

        it("should have correct mint price", async function () {
            expect(await soulShard.pricePerMint()).to.equal(ethers.parseUnits("0.01", 18));
        });

        it("should have correct WETH address", async function () {
            expect(await soulShard.erc20TokenAddress()).to.equal(await weth.getAddress());
        });
    });

    describe("User Balances", function () {
        it("should have ETH balance", async function () {
            const balance = await ethers.provider.getBalance(userAddress);
            expect(balance).to.be.gt(ethers.parseEther("9.0")); // Should have received 10 ETH minus gas costs
        });

        it("should have WETH balance", async function () {
            const balance = await weth.balanceOf(userAddress);
            expect(balance).to.equal(ethers.parseUnits("1000", 18)); // Should have received 1000 WETH
        });
    });

    describe("WETH Contract", function () {
        it("should allow minting", async function () {
            const mintAmount = ethers.parseUnits("1", 18);
            await weth.mint(userAddress, mintAmount);
            const balance = await weth.balanceOf(userAddress);
            expect(balance).to.equal(ethers.parseUnits("1001", 18)); // Previous 1000 + 1 new
        });
    });
}); 
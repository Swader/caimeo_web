// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "forge-std/Test.sol";
import "../src/CaimeoShard.sol";

contract CaimeoShardTest is Test {
    CaimeoShard public shard;
    address public constant OWNER = address(0xB9b8EF61b7851276B0239757A039d54a23804CBb);
    address public constant USER = address(0x1);
    address public constant USER2 = address(0x2);
    uint256 public constant MINT_PRICE = 0.1 ether;
    uint256 public constant MAX_SUPPLY = 7777;
    
    string constant COLLECTION_METADATA = "ipfs://QmYourCollectionMetadataHash";
    string constant BASE_TOKEN_URI = "ipfs://QmYourBaseTokenURIHash/";
    string constant SHARD_ASSET_URI = "ipfs://QmShardAssetHash";
    
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event AssetAccepted(uint256 indexed tokenId, uint64 indexed assetId, uint64 indexed replacesAssetWithId);

    function setUp() public {
        vm.startPrank(OWNER);
        shard = new CaimeoShard(
            "Caimeo Soul Shard",
            "SOUL",
            COLLECTION_METADATA,
            BASE_TOKEN_URI,
            OWNER,
            500 // 5% royalty
        );
        vm.stopPrank();
    }

    function test_InitialState() public {
        assertEq(shard.owner(), OWNER);
        assertEq(shard.name(), "Caimeo Soul Shard");
        assertEq(shard.symbol(), "SOUL");
        assertEq(shard.totalSupply(), 0);
        assertEq(shard.MAX_SUPPLY(), MAX_SUPPLY);
        assertEq(shard.MINT_PRICE(), MINT_PRICE);
        
        // Test royalty configuration
        (address recipient, uint256 amount) = shard.royaltyInfo(1, 10000);
        assertEq(recipient, OWNER);
        assertEq(amount, 500); // 5% of 10000
        
        // Test with different royalty amounts
        (recipient, amount) = shard.royaltyInfo(1, 1 ether);
        assertEq(amount, 0.05 ether); // 5% of 1 ETH
    }

    function test_Mint() public {
        vm.deal(USER, MINT_PRICE);
        vm.startPrank(USER);
        
        // Test event emission
        vm.expectEmit(true, true, true, true);
        emit Transfer(address(0), USER, 1);
        
        // Test minting
        shard.mint{value: MINT_PRICE}();
        
        // Verify mint results
        assertEq(shard.totalSupply(), 1);
        assertEq(shard.ownerOf(1), USER);
        assertEq(address(shard).balance, MINT_PRICE);
        
        // Verify initial asset is assigned and accepted
        uint64[] memory assets = shard.getActiveAssets(1);
        assertEq(assets.length, 1);
        assertEq(assets[0], shard.SHARD_ASSET_ID());
        
        vm.stopPrank();
    }

    function test_RMRKFeatures() public {
        vm.deal(USER, MINT_PRICE);
        vm.startPrank(USER);
        shard.mint{value: MINT_PRICE}();
        
        // Test active assets
        uint64[] memory assets = shard.getActiveAssets(1);
        assertEq(assets.length, 1);
        assertEq(assets[0], shard.SHARD_ASSET_ID());
        
        // Test pending assets (should be empty)
        uint64[] memory pendingAssets = shard.getPendingAssets(1);
        assertEq(pendingAssets.length, 0);
        
        // Test that the token exists and is owned by the minter
        assertEq(shard.ownerOf(1), USER);
        assertTrue(shard.balanceOf(USER) > 0);
        
        vm.stopPrank();
    }

    function test_BatchMint() public {
        uint256 batchSize = 5;
        vm.deal(USER, MINT_PRICE * batchSize);
        vm.startPrank(USER);
        
        for (uint256 i = 1; i <= batchSize; i++) {
            vm.expectEmit(true, true, true, true);
            emit Transfer(address(0), USER, i);
            shard.mint{value: MINT_PRICE}();
            
            assertEq(shard.ownerOf(i), USER);
            
            uint64[] memory assets = shard.getActiveAssets(i);
            assertEq(assets.length, 1);
            assertEq(assets[0], shard.SHARD_ASSET_ID());
        }
        
        assertEq(shard.totalSupply(), batchSize);
        assertEq(address(shard).balance, MINT_PRICE * batchSize);
        
        vm.stopPrank();
    }

    function test_RevertWhen_MintUnderpriced() public {
        vm.deal(USER, MINT_PRICE / 2);
        vm.prank(USER);
        vm.expectRevert(abi.encodeWithSignature("InsufficientPayment()"));
        shard.mint{value: MINT_PRICE / 2}();
    }

    function test_RevertWhen_MintOverMaxSupply() public {
        vm.deal(USER, MINT_PRICE * (MAX_SUPPLY + 1));
        vm.startPrank(USER);
        
        for (uint i = 0; i < MAX_SUPPLY; i++) {
            shard.mint{value: MINT_PRICE}();
        }
        
        vm.expectRevert(abi.encodeWithSignature("MaxSupplyReached()"));
        shard.mint{value: MINT_PRICE}();
        
        vm.stopPrank();
    }

    function test_Withdraw() public {
        // First mint a token to have some balance
        vm.deal(USER, MINT_PRICE);
        vm.prank(USER);
        shard.mint{value: MINT_PRICE}();
        
        // Test withdrawal
        uint256 initialBalance = OWNER.balance;
        vm.prank(OWNER);
        shard.withdraw();
        
        assertEq(address(shard).balance, 0);
        assertEq(OWNER.balance, initialBalance + MINT_PRICE);
    }

    function test_RevertWhen_WithdrawNotOwner() public {
        vm.prank(USER);
        vm.expectRevert(abi.encodeWithSignature("RMRKNotOwner()"));
        shard.withdraw();
    }

    function test_ZeroAddressInteractions() public {
        // Try to mint to zero address (should be prevented by ERC721)
        vm.deal(address(0), MINT_PRICE);
        vm.prank(address(0));
        vm.expectRevert(abi.encodeWithSignature("ERC721MintToTheZeroAddress()"));
        shard.mint{value: MINT_PRICE}();
    }

    function test_ConcurrentMinting() public {
        uint256 mintAmount = 10;
        address[] memory users = new address[](mintAmount);
        
        // Setup users with funds
        for(uint256 i = 0; i < mintAmount; i++) {
            users[i] = address(uint160(i + 1000));
            vm.deal(users[i], MINT_PRICE);
        }
        
        // Simulate concurrent minting
        for(uint256 i = 0; i < mintAmount; i++) {
            vm.prank(users[i]);
            shard.mint{value: MINT_PRICE}();
        }
        
        // Verify all mints were successful
        for(uint256 i = 0; i < mintAmount; i++) {
            assertEq(shard.ownerOf(i + 1), users[i]);
        }
        
        assertEq(shard.totalSupply(), mintAmount);
        assertEq(address(shard).balance, MINT_PRICE * mintAmount);
    }

    function test_TokenURI() public {
        vm.deal(USER, MINT_PRICE);
        vm.prank(USER);
        shard.mint{value: MINT_PRICE}();
        
        string memory uri = shard.tokenURI(1);
        assertEq(uri, string(abi.encodePacked(BASE_TOKEN_URI, "1")));
    }
} 
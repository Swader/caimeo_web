// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@rmrk-team/evm-contracts/contracts/implementations/lazyMintNative/RMRKEquippableLazyMintNative.sol";
import "@rmrk-team/evm-contracts/contracts/RMRK/extension/RMRKRoyalties.sol";

/**
 * @title CaimeoShard
 * @dev The base contract for Caimeo Soul Shards, implementing full RMRK feature set.
 * - ERC-6220 for composable NFTs
 * - ERC-5773 for multi-asset support
 * - Equippable extension for future equipment slots
 * - Lazy minting for gas efficiency
 */
contract CaimeoShard is RMRKEquippableLazyMintNative {
    uint256 public constant MAX_SUPPLY = 7777;
    uint256 public constant MINT_PRICE = 0.1 ether;

    // Asset IDs for different evolution stages
    uint64 public constant SHARD_ASSET_ID = 1;
    uint64 public constant AGENT_ASSET_ID = 2;

    // Error messages
    error InsufficientPayment();
    error MaxSupplyReached();

    constructor(
        string memory name,
        string memory symbol,
        string memory collectionMetadata,
        string memory baseTokenURI,
        address royaltyRecipient,
        uint16 royaltyPercentageBps
    ) 
        RMRKEquippableLazyMintNative(
            name, 
            symbol, 
            collectionMetadata, 
            baseTokenURI,
            InitData({
                maxSupply: MAX_SUPPLY,
                pricePerMint: MINT_PRICE,
                royaltyRecipient: royaltyRecipient,
                royaltyPercentageBps: royaltyPercentageBps
            })
        )
    {
        // Add the initial shard asset with metadata
        _addAssetEntry(
            SHARD_ASSET_ID,
            "ipfs://QmShardAssetHash"
        );
    }

    function mint() external payable {
        if (msg.value < MINT_PRICE) revert InsufficientPayment();
        if (totalSupply() >= MAX_SUPPLY) revert MaxSupplyReached();
        
        uint256 tokenId = totalSupply() + 1;

        // Mint the token
        _safeMint(msg.sender, tokenId, "");
        
        // Add the shard asset to the token
        _addAssetToToken(tokenId, SHARD_ASSET_ID, 0);
        
        // Auto-accept the asset
        _acceptAsset(tokenId, 0, SHARD_ASSET_ID);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = owner().call{value: balance}("");
        if (!success) revert TransferFailed();
    }
} 
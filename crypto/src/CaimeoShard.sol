// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@rmrk-team/evm-contracts/contracts/RMRK/extension/RMRKMultiAsset.sol";

/**
 * @title CaimeoShard
 * @dev The base contract for Caimeo Soul Shards, which evolve into full Caimeo Agents.
 * Uses ERC-5773 (RMRK Multi-Asset) for evolution capabilities.
 */
contract CaimeoShard is ERC721Enumerable, RMRKMultiAsset, Ownable {
    uint256 public constant MAX_SUPPLY = 7777;
    uint256 public constant MINT_PRICE = 0.1 ether;
    uint256 private _tokenIdCounter;

    // Asset IDs for different evolution stages
    uint64 public constant SHARD_ASSET_ID = 1;
    uint64 public constant AGENT_ASSET_ID = 2;

    constructor() 
        ERC721("Caimeo Soul Shard", "CAIMEO") 
        RMRKMultiAsset("ipfs://QmHash/") // Base URI for assets
        Ownable(msg.sender)
    {
        // Add initial shard asset
        addAssetEntry(
            SHARD_ASSET_ID,
            "ipfs://QmHash/shard.json"
        );

        // Add evolved agent asset
        addAssetEntry(
            AGENT_ASSET_ID,
            "ipfs://QmHash/agent.json"
        );
    }

    function mint() external payable {
        require(msg.value >= MINT_PRICE, "Insufficient payment");
        require(_tokenIdCounter < MAX_SUPPLY, "Max supply reached");
        
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(msg.sender, tokenId);

        // Assign initial shard asset
        addAssetToToken(tokenId, SHARD_ASSET_ID, 0);
    }

    function evolve(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(getActiveAssets(tokenId).length == 1, "Already evolved");
        
        // Replace shard asset with agent asset
        addAssetToToken(tokenId, AGENT_ASSET_ID, 0);
    }

    function withdraw() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }

    // Required overrides
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, RMRKMultiAsset)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
} 
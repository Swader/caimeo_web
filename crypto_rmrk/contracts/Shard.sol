// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.8.21;

import {RMRKAbstractEquippable} from "@rmrk-team/evm-contracts/contracts/implementations/abstract/RMRKAbstractEquippable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {RMRKImplementationBase} from "@rmrk-team/evm-contracts/contracts/implementations/utils/RMRKImplementationBase.sol";
import {RMRKTokenHolder} from "@rmrk-team/evm-contracts/contracts/RMRK/extension/tokenHolder/RMRKTokenHolder.sol";
import {IERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

error ERC721OutOfBoundsIndex(address owner, uint256 index);
error OnlyNFTOwnerCanTransferTokensFromIt();
error ContractURIFrozen();
error LengthMismatch();

contract SoulShard is RMRKAbstractEquippable, RMRKTokenHolder {
    // Events 
    /**
     * @notice From ERC4906 This event emits when the metadata of a token is changed.
     *  So that the third-party platforms such as NFT market could
     *  get notified when the metadata of a token is changed.
     */
    event MetadataUpdate(uint256 _tokenId);
      
    /**
     * @notice From ERC7572 (Draft) Emitted when the contract-level metadata is updated
     */
    event ContractURIUpdated();
    
    // Variables
    uint256 private _pricePerMint;
    address private _erc20TokenAddress;
    string private _unrevealedTokenUri;
    // IERC721Enumerable
    mapping(address owner => mapping(uint256 index => uint256))
        private _ownedTokens;
    mapping(uint256 tokenId => uint256) private _ownedTokensIndex;
    uint256[] private _allTokens;
    mapping(uint256 tokenId => uint256) private _allTokensIndex;
    
    mapping(address => bool) private _autoAcceptCollection;
    uint256 private _contractURIFrozen; // Cheaper than a bool
    

    // Constructor
    constructor(
      string memory collectionMetadata,
      uint256 maxSupply,
      address royaltyRecipient,
      uint16 royaltyPercentageBps,
      string memory unrevealedTokenUri,
      uint256 pricePerMint_,
      address erc20TokenAddress_
    )
        RMRKImplementationBase(
            "SoulShard",
            "SSHARD",
            collectionMetadata,
            maxSupply,
            royaltyRecipient,
            royaltyPercentageBps
        )
    {
      _pricePerMint = pricePerMint_;
      _erc20TokenAddress = erc20TokenAddress_;
      _unrevealedTokenUri = unrevealedTokenUri;
}
    
    // Methods
    function tokenURI(
        uint256 tokenId
    ) public view returns (string memory) {
        _requireMinted(tokenId);
        if (_activeAssets[tokenId].length == 0) {
            return _unrevealedTokenUri;
        } else {
            return getAssetMetadata(tokenId, _activeAssets[tokenId][0]);
        }
    }
      
    /**
     * @notice Hook that is called after an asset is accepted to a token's active assets array.
     * @param tokenId ID of the token for which the asset has been accepted
     * @param index Index of the asset in the token's pending assets array
     * @param assetId ID of the asset expected to have been located at the specified index
     * @param replacedAssetId ID of the asset that has been replaced by the accepted asset
     */
    function _afterAcceptAsset(
        uint256 tokenId,
        uint256 index,
        uint64 assetId,
        uint64 replacedAssetId
    ) internal virtual override {
        if(replacedAssetId != 0) {
            emit MetadataUpdate(tokenId);
        }
    }
      
    // Suggested Mint Functions
    /**
     * @notice Used to mint the desired number of tokens to the specified address.
     * @dev The "data" value of the "_safeMint" method is set to an empty value.
     * @dev Can only be called while the open sale is open.
     * @param to Address to which to mint the token
     * @param numToMint Number of tokens to mint
     * @return The ID of the first token to be minted in the current minting cycle
     */
    function mint(
        address to,
        uint256 numToMint
    ) public returns (uint256) {
        (uint256 nextToken, uint256 totalSupplyOffset) = _prepareMint(
            numToMint
        );
        _chargeMints(numToMint);

        for (uint256 i = nextToken; i < totalSupplyOffset; ) {
            _safeMint(to, i, "");
            unchecked {
                ++i;
            }
        }

        return nextToken;
    }
        
    /**
     * @notice Used to mint a desired number of child tokens to a given parent token.
     * @dev The "data" value of the "_safeMint" method is set to an empty value.
     * @dev Can only be called while the open sale is open.
     * @param to Address of the collection smart contract of the token into which to mint the child token
     * @param numToMint Number of tokens to mint
     * @param destinationId ID of the token into which to mint the new child token
     * @return The ID of the first token to be minted in the current minting cycle
     */
    function nestMint(
        address to,
        uint256 numToMint,
        uint256 destinationId
    ) public returns (uint256) {
        (uint256 nextToken, uint256 totalSupplyOffset) = _prepareMint(
            numToMint
        );
        _chargeMints(numToMint);

        for (uint256 i = nextToken; i < totalSupplyOffset; ) {
            _nestMint(to, i, destinationId, "");
            unchecked {
                ++i;
            }
        }

        return nextToken;
    }
    
        /**
         * @notice Used to charge the minter for the amount of tokens they desire to mint.
         * @param numToMint The amount of tokens to charge the caller for
         */
        function _chargeMints(uint256 numToMint) internal {
            uint256 price = numToMint * _pricePerMint;
            IERC20(_erc20TokenAddress).transferFrom(
                msg.sender,
                address(this),
                price
            );
        }
    
        /**
         * @notice Used to retrieve the address of the ERC20 token this smart contract supports.
         * @return Address of the ERC20 token's smart contract
         */
        function erc20TokenAddress() public view virtual returns (address) {
            return _erc20TokenAddress;
        }
    
        /**
         * @notice Used to retrieve the price per mint.
         * @return The price per mint of a single token expressed in the lowest denomination of a native currency
         */
        function pricePerMint() public view returns (uint256) {
            return _pricePerMint;
        }
    
        /**
         * @notice Used to withdraw the minting proceedings to a specified address.
         * @dev This function can only be called by the owner.
         * @param erc20 Address of the ERC20 token to withdraw
         * @param to Address to receive the given amount of minting proceedings
         * @param amount The amount to withdraw
         */
        function withdrawRaisedERC20(
            address erc20,
            address to,
            uint256 amount
        ) external onlyOwner {
            IERC20(erc20).transfer(to, amount);
        }
    
      /**
       * @inheritdoc IERC165
       */
      function supportsInterface(
          bytes4 interfaceId
      )
          public
          view
        
          override(RMRKTokenHolder, RMRKAbstractEquippable)
          returns (bool)
      {
          return 
              type(IERC721Enumerable).interfaceId == interfaceId ||
              RMRKAbstractEquippable.supportsInterface(interfaceId) ||
              RMRKTokenHolder.supportsInterface(interfaceId);
      }
      
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId);

        if (from == address(0)) {
            _addTokenToAllTokensEnumeration(tokenId);
        } else if (from != to) {
            _removeTokenFromOwnerEnumeration(from, tokenId);
        }
        if (to == address(0)) {
            _removeTokenFromAllTokensEnumeration(tokenId);
        } else if (from != to) {
            _addTokenToOwnerEnumeration(to, tokenId);
        }
    }
    // IERC721Enumerable (Based on OpenZeppelin implementation)

    /**
     * @dev See {IERC721Enumerable-tokenOfOwnerByIndex}.
     */
    function tokenOfOwnerByIndex(
        address owner,
        uint256 index
    ) public view virtual returns (uint256) {
        if (index >= balanceOf(owner)) {
            revert ERC721OutOfBoundsIndex(owner, index);
        }
        return _ownedTokens[owner][index];
    }

    /**
     * @dev See {IERC721Enumerable-tokenByIndex}.
     */
    function tokenByIndex(uint256 index) public view virtual returns (uint256) {
        if (index >= totalSupply()) {
            revert ERC721OutOfBoundsIndex(address(0), index);
        }
        return _allTokens[index];
    }

    /**
     * @dev Private function to add a token to this extension's ownership-tracking data structures.
     * @param to address representing the new owner of the given token ID
     * @param tokenId uint256 ID of the token to be added to the tokens list of the given address
     */
    function _addTokenToOwnerEnumeration(address to, uint256 tokenId) private {
        uint256 length = balanceOf(to);
        _ownedTokens[to][length] = tokenId;
        _ownedTokensIndex[tokenId] = length;
    }

    /**
     * @dev Private function to add a token to this extension's token tracking data structures.
     * @param tokenId uint256 ID of the token to be added to the tokens list
     */
    function _addTokenToAllTokensEnumeration(uint256 tokenId) private {
        _allTokensIndex[tokenId] = _allTokens.length;
        _allTokens.push(tokenId);
    }

    /**
     * @dev Private function to remove a token from this extension's ownership-tracking data structures. Note that
     * while the token is not assigned a new owner, the `_ownedTokensIndex` mapping is _not_ updated: this allows for
     * gas optimizations e.g. when performing a transfer operation (avoiding double writes).
     * This has O(1) time complexity, but alters the order of the _ownedTokens array.
     * @param from address representing the previous owner of the given token ID
     * @param tokenId uint256 ID of the token to be removed from the tokens list of the given address
     */
    function _removeTokenFromOwnerEnumeration(
        address from,
        uint256 tokenId
    ) private {
        // To prevent a gap in from's tokens array, we store the last token in the index of the token to delete, and
        // then delete the last slot (swap and pop).

        uint256 lastTokenIndex = balanceOf(from) - 1;
        uint256 tokenIndex = _ownedTokensIndex[tokenId];

        // When the token to delete is the last token, the swap operation is unnecessary
        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];

            _ownedTokens[from][tokenIndex] = lastTokenId; // Move the last token to the slot of the to-delete token
            _ownedTokensIndex[lastTokenId] = tokenIndex; // Update the moved token's index
        }

        // This also deletes the contents at the last position of the array
        delete _ownedTokensIndex[tokenId];
        delete _ownedTokens[from][lastTokenIndex];
    }

    /**
     * @dev Private function to remove a token from this extension's token tracking data structures.
     * This has O(1) time complexity, but alters the order of the _allTokens array.
     * @param tokenId uint256 ID of the token to be removed from the tokens list
     */
    function _removeTokenFromAllTokensEnumeration(uint256 tokenId) private {
        // To prevent a gap in the tokens array, we store the last token in the index of the token to delete, and
        // then delete the last slot (swap and pop).

        uint256 lastTokenIndex = _allTokens.length - 1;
        uint256 tokenIndex = _allTokensIndex[tokenId];

        // When the token to delete is the last token, the swap operation is unnecessary. However, since this occurs so
        // rarely (when the last minted token is burnt) that we still do the swap here to avoid the gas cost of adding
        // an 'if' statement (like in _removeTokenFromOwnerEnumeration)
        uint256 lastTokenId = _allTokens[lastTokenIndex];

        _allTokens[tokenIndex] = lastTokenId; // Move the last token to the slot of the to-delete token
        _allTokensIndex[lastTokenId] = tokenIndex; // Update the moved token's index

        // This also deletes the contents at the last position of the array
        delete _allTokensIndex[tokenId];
        _allTokens.pop();
    }
    
    function transferHeldERC20FromToken(
        address erc20Contract,
        uint256 tokenHolderId,
        address to,
        uint256 amount,
        bytes memory data
    ) external {
        if (_msgSender() != ownerOf(tokenHolderId)) {
            revert OnlyNFTOwnerCanTransferTokensFromIt();
        }
        _transferHeldERC20FromToken(
            erc20Contract,
            tokenHolderId,
            to,
            amount,
            data
        );
    }
    
    function setAutoAcceptCollection(
        address collection,
        bool autoAccept
    ) public virtual onlyOwnerOrContributor {
        _autoAcceptCollection[collection] = autoAccept;
    }

    function _afterAddChild(
        uint256 tokenId,
        address childAddress,
        uint256 childId,
        bytes memory
    ) internal virtual override {
        // Auto accept children if they are from known collections
        if (_autoAcceptCollection[childAddress]) {
            _acceptChild(
                tokenId,
                _pendingChildren[tokenId].length - 1,
                childAddress,
                childId
            );
        }
    }
    
    /**
     * @notice Used to get whether the contract-level metadata is frozen and cannot be further updated.
     * @return isFrozen Whether the contract-level metadata is frozen
     */
    function isContractURIFrozen() external view returns (bool isFrozen) {
        isFrozen = _contractURIFrozen == 1;
    }

    /**
     * @notice Freezes the contract-level metadata, so it cannot be further updated.
     */
    function freezeContractURI() external onlyOwner {
        _contractURIFrozen = 1;
    }

    /**
     * @notice Sets the contract-level metadata URI to a new value and emits an event.
     * @param contractURI_ The new contract-level metadata URI
     */
    function setContractURI(string memory contractURI_) external onlyOwner {
        if (_contractURIFrozen == 1) {
            revert ContractURIFrozen();
        }
        _contractURI = contractURI_;
        emit ContractURIUpdated();
    }
    
    function batchAddEquippableAssetEntries(
        string[] memory metadataURIs,
        uint64[][] memory partIds,
        address catalogAddress,
        uint64 equippableGroupId
    ) public virtual onlyOwnerOrContributor {
        uint256 length = metadataURIs.length;
        if (length != partIds.length) revert LengthMismatch();

        for (uint256 i; i < length; ) {
            unchecked {
                ++_totalAssets;
            }
            _addAssetEntry(
                uint64(_totalAssets),
                equippableGroupId,
                catalogAddress,
                metadataURIs[i],
                partIds[i]
            );
            unchecked {
                ++i;
            }
        }
    }
    
}
  
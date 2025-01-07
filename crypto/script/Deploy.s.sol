// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {Script} from "forge-std/Script.sol";
import {CaimeoShard} from "../src/CaimeoShard.sol";

contract DeployScript is Script {
    function run() external returns (CaimeoShard) {
        vm.startBroadcast();

        CaimeoShard shard = new CaimeoShard(
            "Caimeo Soul Shard",  // name
            "SOUL",              // symbol
            "ipfs://QmYourCollectionMetadataHash", // collectionMetadata
            "ipfs://QmYourBaseTokenURIHash/",      // baseTokenURI
            msg.sender,          // royaltyRecipient
            500                  // royaltyPercentageBps (5%)
        );

        vm.stopBroadcast();
        return shard;
    }
} 
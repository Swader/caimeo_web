#!/bin/bash

# Deploy to local testnet
~/.foundry/bin/forge script script/Deploy.s.sol:DeployScript \
    --fork-url http://localhost:8545 \
    --broadcast \
    --unlocked \
    -vvvv 
#!/bin/bash

# Start anvil with specific accounts pre-funded
~/.foundry/bin/anvil \
  --accounts 10 \
  --balance 100 \
  --gas-limit 30000000 \
  --port 8545 \
  --init genesis.json 
#!/usr/bin/env bash
set -euo pipefail

# Minimal local Fabric network (one org, one peer, one channel).
FABRIC_SAMPLES_DIR=${FABRIC_SAMPLES_DIR:-"$PWD/fabric-samples"}
CHANNEL_NAME=${FABRIC_CHANNEL:-"sociochannel"}
CHAINCODE_NAME=${FABRIC_CHAINCODE:-"sociora"}

if [ ! -d "$FABRIC_SAMPLES_DIR" ]; then
  echo "Downloading fabric-samples and binaries (Fabric v2.x)..."
  curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.8 1.5.6
fi

pushd "$FABRIC_SAMPLES_DIR/test-network" > /dev/null
./network.sh down
./network.sh up createChannel -c "$CHANNEL_NAME" -ca
./network.sh deployCC -c "$CHANNEL_NAME" -ccn "$CHAINCODE_NAME" -ccp "$PWD/../../chaincode" -ccl javascript
popd > /dev/null

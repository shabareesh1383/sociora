#!/usr/bin/env bash
set -euo pipefail

# Creates a local wallet with Org1 identities using fabric-samples test application.
FABRIC_SAMPLES_DIR=${FABRIC_SAMPLES_DIR:-"$PWD/fabric-samples"}
APP_DIR="$FABRIC_SAMPLES_DIR/test-application/javascript"

if [ ! -d "$APP_DIR" ]; then
  echo "fabric-samples not found. Run fabric/network.sh first." >&2
  exit 1
fi

pushd "$APP_DIR" > /dev/null
npm install
node enrollAdmin.js
node registerUser.js
popd > /dev/null

mkdir -p "$PWD/fabric/wallet"
cp -R "$APP_DIR/wallet"/* "$PWD/fabric/wallet/"
cp "$FABRIC_SAMPLES_DIR/test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json" \
  "$PWD/fabric/connection.json"

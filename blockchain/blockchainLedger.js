const fs = require("fs");
const path = require("path");
const { Gateway, Wallets } = require("fabric-network");
const { v4: uuidv4 } = require("uuid");
const LedgerInterface = require("./ledgerInterface");

// Hyperledger Fabric ledger adapter (single org, single peer, local dev only).
class BlockchainLedger extends LedgerInterface {
  constructor() {
    super();
    this.channelName = process.env.FABRIC_CHANNEL || "sociochannel";
    this.chaincodeName = process.env.FABRIC_CHAINCODE || "sociora";
    this.walletPath =
      process.env.FABRIC_WALLET_PATH || path.join(process.cwd(), "fabric", "wallet");
    this.ccpPath =
      process.env.FABRIC_CONNECTION_PROFILE ||
      path.join(process.cwd(), "fabric", "connection.json");
    this.identity = process.env.FABRIC_IDENTITY || "appUser";
  }

  async getContract() {
    const ccp = JSON.parse(fs.readFileSync(this.ccpPath, "utf8"));
    const wallet = await Wallets.newFileSystemWallet(this.walletPath);
    const identity = await wallet.get(this.identity);

    if (!identity) {
      throw new Error(
        `Identity "${this.identity}" not found in wallet at ${this.walletPath}`
      );
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: this.identity,
      discovery: { enabled: true, asLocalhost: true }
    });

    const network = await gateway.getNetwork(this.channelName);
    const contract = network.getContract(this.chaincodeName);

    return { gateway, contract };
  }

  // Record a transaction using Fabric chaincode.
  async recordTransaction(transaction) {
    const payload = {
      txId: uuidv4(),
      timestamp: new Date().toISOString(),
      ...transaction
    };

    const { gateway, contract } = await this.getContract();
    try {
      const result = await contract.submitTransaction(
        "RecordTransaction",
        JSON.stringify(payload)
      );
      return JSON.parse(result.toString());
    } finally {
      gateway.disconnect();
    }
  }

  // Retrieve all transactions from Fabric.
  async getAllTransactions() {
    const { gateway, contract } = await this.getContract();
    try {
      const result = await contract.evaluateTransaction("GetAllTransactions");
      return JSON.parse(result.toString());
    } finally {
      gateway.disconnect();
    }
  }
}

module.exports = BlockchainLedger;

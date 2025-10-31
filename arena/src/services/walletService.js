import { ethers } from "ethers";

// Hedera network configurations
const HEDERA_NETWORKS = {
  testnet: {
    chainId: 296, // Hedera Testnet
    chainName: "Hedera Testnet",
    nativeCurrency: {
      name: "HBAR",
      symbol: "HBAR",
      decimals: 18,
    },
    rpcUrls: ["https://testnet.hashio.io/api"],
    blockExplorerUrls: ["https://hashscan.io/testnet"],
  },
  mainnet: {
    chainId: 295, // Hedera Mainnet
    chainName: "Hedera Mainnet",
    nativeCurrency: {
      name: "HBAR",
      symbol: "HBAR",
      decimals: 18,
    },
    rpcUrls: ["https://mainnet.hashio.io/api"],
    blockExplorerUrls: ["https://hashscan.io/mainnet"],
  },
};

class WalletService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.network = "testnet"; // default to testnet
  }

  // Check if MetaMask is installed
  isMetaMaskInstalled() {
    return typeof window.ethereum !== "undefined";
  }

  // Connect to MetaMask
  async connectWallet() {
    try {
      if (!this.isMetaMaskInstalled()) {
        throw new Error(
          "MetaMask is not installed. Please install MetaMask extension."
        );
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.address = accounts[0];

      // Check if on Hedera network, if not, prompt to switch
      await this.ensureHederaNetwork();

      // Store in localStorage
      localStorage.setItem("walletConnected", "true");
      localStorage.setItem("walletAddress", this.address);

      // Listen for account changes
      window.ethereum.on(
        "accountsChanged",
        this.handleAccountsChanged.bind(this)
      );

      // Listen for chain changes
      window.ethereum.on("chainChanged", this.handleChainChanged.bind(this));

      return {
        address: this.address,
        accountId: this.address, // For compatibility with your store
      };
    } catch (error) {
      console.error("Error connecting wallet:", error);
      throw error;
    }
  }

  // Ensure user is on Hedera network
  async ensureHederaNetwork() {
    try {
      const network = await this.provider.getNetwork();
      const expectedChainId = HEDERA_NETWORKS[this.network].chainId;

      if (Number(network.chainId) !== expectedChainId) {
        // Try to switch to Hedera network
        await this.switchToHederaNetwork();
      }
    } catch (error) {
      console.error("Error ensuring Hedera network:", error);
      // Don't throw - let user continue but show warning
    }
  }

  // Switch to Hedera network
  async switchToHederaNetwork() {
    const networkConfig = HEDERA_NETWORKS[this.network];

    try {
      // Try to switch
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${networkConfig.chainId.toString(16)}` }],
      });
    } catch (switchError) {
      // Network not added, try to add it
      if (switchError.code === 4902) {
        await this.addHederaNetwork();
      } else {
        throw switchError;
      }
    }
  }

  // Add Hedera network to MetaMask
  async addHederaNetwork() {
    const networkConfig = HEDERA_NETWORKS[this.network];

    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${networkConfig.chainId.toString(16)}`,
            chainName: networkConfig.chainName,
            nativeCurrency: networkConfig.nativeCurrency,
            rpcUrls: networkConfig.rpcUrls,
            blockExplorerUrls: networkConfig.blockExplorerUrls,
          },
        ],
      });
    } catch (error) {
      console.error("Error adding Hedera network:", error);
      throw error;
    }
  }

  // Disconnect wallet
  disconnectWallet() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    localStorage.removeItem("walletConnected");
    localStorage.removeItem("walletAddress");
  }

  // Check if wallet is connected
  isConnected() {
    return this.address !== null;
  }

  // Get current address
  getAddress() {
    return this.address;
  }

  // Get account ID (alias for compatibility)
  getAccountId() {
    return this.address;
  }

  // Restore session
  async restoreSession() {
    try {
      const wasConnected = localStorage.getItem("walletConnected");

      if (wasConnected === "true" && this.isMetaMaskInstalled()) {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        if (accounts.length > 0) {
          this.provider = new ethers.BrowserProvider(window.ethereum);
          this.signer = await this.provider.getSigner();
          this.address = accounts[0];

          // Listen for changes
          window.ethereum.on(
            "accountsChanged",
            this.handleAccountsChanged.bind(this)
          );
          window.ethereum.on(
            "chainChanged",
            this.handleChainChanged.bind(this)
          );

          return {
            address: this.address,
            accountId: this.address,
          };
        }
      }

      return null;
    } catch (error) {
      console.error("Error restoring session:", error);
      return null;
    }
  }

  // Handle account changes
  handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      // User disconnected their wallet
      this.disconnectWallet();
      window.location.reload();
    } else if (accounts[0] !== this.address) {
      // User switched accounts
      this.address = accounts[0];
      localStorage.setItem("walletAddress", this.address);
      window.location.reload();
    }
  }

  // Handle chain changes
  handleChainChanged() {
    // Reload the page when chain changes
    window.location.reload();
  }

  // Get current network
  async getNetwork() {
    if (!this.provider) {
      throw new Error("Wallet not connected");
    }
    const network = await this.provider.getNetwork();
    return network;
  }

  // Get HBAR balance
  async getBalance() {
    if (!this.provider || !this.address) {
      throw new Error("Wallet not connected");
    }
    const balance = await this.provider.getBalance(this.address);
    return ethers.formatEther(balance);
  }

  // Get token balance (for HedRap token or any ERC-20)
  async getTokenBalance(tokenAddress) {
    if (!this.provider || !this.address) {
      throw new Error("Wallet not connected");
    }

    try {
      // ERC-20 ABI for balanceOf
      const erc20ABI = [
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)",
      ];

      const contract = new ethers.Contract(
        tokenAddress,
        erc20ABI,
        this.provider
      );
      const balance = await contract.balanceOf(this.address);
      const decimals = await contract.decimals();
      console.log("this",ethers.formatUnits(balance, decimals));
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error("Error fetching token balance:", error);
      return "0";
    }
  }

  // Get all balances (HBAR + HedRap token)
  async getAllBalances(hedrapTokenAddress) {
    try {
      const hbar = await this.getBalance();
      let hedrap = "0";

      if (hedrapTokenAddress) {
        hedrap = await this.getTokenBalance(hedrapTokenAddress);
      }

      return {
        hbar: parseFloat(hbar),
        hedrap: parseFloat(hedrap),
      };
    } catch (error) {
      console.error("Error fetching all balances:", error);
      return {
        hbar: 0,
        hedrap: 0,
      };
    }
  }

  // Sign message
  async signMessage(message) {
    if (!this.signer) {
      throw new Error("Wallet not connected");
    }
    const signature = await this.signer.signMessage(message);
    return signature;
  }

  // Send HBAR transaction
  async sendTransaction(to, value) {
    if (!this.signer) {
      throw new Error("Wallet not connected");
    }

    const tx = await this.signer.sendTransaction({
      to,
      value: ethers.parseEther(value.toString()),
    });

    return await tx.wait();
  }

  // Send token transaction
  async sendTokenTransaction(tokenAddress, to, amount) {
    if (!this.signer) {
      throw new Error("Wallet not connected");
    }

    try {
      const erc20ABI = [
        "function transfer(address to, uint256 amount) returns (bool)",
        "function decimals() view returns (uint8)",
      ];

      const contract = new ethers.Contract(tokenAddress, erc20ABI, this.signer);
      const decimals = await contract.decimals();
      const amountInWei = ethers.parseUnits(amount.toString(), decimals);

      const tx = await contract.transfer(to, amountInWei);
      return await tx.wait();
    } catch (error) {
      console.error("Error sending token transaction:", error);
      throw error;
    }
  }

  // Interact with smart contract
  async executeContract(
    contractAddress,
    abi,
    methodName,
    params = [],
    value = 0
  ) {
    if (!this.signer) {
      throw new Error("Wallet not connected");
    }

    try {
      const contract = new ethers.Contract(contractAddress, abi, this.signer);

      const options =
        value > 0 ? { value: ethers.parseEther(value.toString()) } : {};
      const tx = await contract[methodName](...params, options);

      return await tx.wait();
    } catch (error) {
      console.error("Error executing contract:", error);
      throw error;
    }
  }

  // Read from smart contract
  async readContract(contractAddress, abi, methodName, params = []) {
    if (!this.provider) {
      throw new Error("Wallet not connected");
    }

    try {
      const contract = new ethers.Contract(contractAddress, abi, this.provider);
      const result = await contract[methodName](...params);
      return result;
    } catch (error) {
      console.error("Error reading contract:", error);
      throw error;
    }
  }

  // Switch network (mainnet/testnet)
  setNetwork(network) {
    if (network !== "testnet" && network !== "mainnet") {
      throw new Error("Invalid network. Use 'testnet' or 'mainnet'");
    }
    this.network = network;
  }
}

export const walletService = new WalletService();

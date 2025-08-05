"use client";

import type React from "react";

import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import sdk from "@farcaster/miniapp-sdk";
import { useWriteContract, useAccount, useChainId, useWaitForTransactionReceipt, useConnect, useSwitchChain, useBalance } from "wagmi";
import { parseUnits, formatUnits, type Address } from "viem";
import { TIPPING_CONTRACT_ADDRESSES } from "@/lib/constants";
import AMATippingABI from "@/abis/AMATipping.json";
import ERC20ABI from "@/abis/ERC20.json";
import { config } from "@/components/providers/WagmiProvider";

interface TippingModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  creatorFid?: string; // The creator's Farcaster ID to fetch wallet address
  onTipSuccess?: (tip: any) => void;
}

type TippingStep = 'chain-selection' | 'token-selection' | 'amount-input' | 'approve' | 'tip' | 'success';

export default function TippingModal({
  isOpen,
  onClose,
  sessionId,
  creatorFid,
  onTipSuccess,
}: TippingModalProps) {
  const [amount, setAmount] = useState("");
  const [currentStep, setCurrentStep] = useState<TippingStep>('chain-selection');
  const [error, setError] = useState<string | null>(null);
  const [creatorAddress, setCreatorAddress] = useState<string | null>(null);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [selectedChainId, setSelectedChainId] = useState<number | null>(null);
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number>(0);
  
  const { address } = useAccount();
  const chainId = useChainId();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { connect, connectors } = useConnect();
  const { switchChain } = useSwitchChain();
  
  // Separate transaction hashes for approve and tip
  const [approveHash, setApproveHash] = useState<string | null>(null);
  const [tipHash, setTipHash] = useState<string | null>(null);
  
  // Get available chains from config
  const availableChains = config.chains;
  
  // Get contract config for selected chain
  const contractConfig = selectedChainId ? TIPPING_CONTRACT_ADDRESSES[selectedChainId as keyof typeof TIPPING_CONTRACT_ADDRESSES] : null;
  const tokenConfig = contractConfig?.tokens[selectedTokenIndex];
  
  // Get token balance
  const { data: tokenBalance } = useBalance({
    address: address,
    token: tokenConfig?.address as Address,
    chainId: selectedChainId || undefined,
  });
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Save wallet address when connected
  useEffect(() => {
    const saveWalletAddress = async () => {
      if (address) {
        try {
          await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ walletAddress: address }),
          });
        } catch (error) {
          console.error("Error saving wallet address:", error);
        }
      }
    };
    
    saveWalletAddress();
  }, [address]);

  // Fetch creator's wallet address from Farcaster API
  useEffect(() => {
    const fetchCreatorAddress = async () => {
      if (!creatorFid || !isOpen) return;
      
      setIsFetchingAddress(true);
      try {
        const response = await fetch(
          `https://api.farcaster.xyz/fc/primary-address?fid=${creatorFid}&protocol=ethereum`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch creator address');
        }
        
        const data = await response.json();
        const address = data?.result?.address?.address;
        
        if (address) {
          setCreatorAddress(address);
        } else {
          throw new Error('Creator has no verified Ethereum address');
        }
      } catch (err) {
        console.error('Error fetching creator address:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch creator address');
      } finally {
        setIsFetchingAddress(false);
      }
    };

    fetchCreatorAddress();
  }, [creatorFid, isOpen]);

  // Handle chain selection
  const handleChainSelect = async (targetChainId: number) => {
    try {
      setError(null);
      setSelectedChainId(targetChainId);
      
      if (chainId !== targetChainId) {
        await switchChain({ chainId: targetChainId });
      }
      
      setCurrentStep('token-selection');
    } catch (err) {
      console.error('Error switching chain:', err);
      setError(err instanceof Error ? err.message : 'Failed to switch chain');
    }
  };

  // Handle token selection
  const handleTokenSelect = (tokenIndex: number) => {
    setSelectedTokenIndex(tokenIndex);
    setCurrentStep('amount-input');
  };

  // Handle back navigation
  const handleBack = () => {
    if (currentStep === 'token-selection') {
      setCurrentStep('chain-selection');
      setSelectedChainId(null);
    } else if (currentStep === 'amount-input') {
      setCurrentStep('token-selection');
      setSelectedTokenIndex(0);
    }
  };

  useEffect(() => {
    if (isConfirmed && hash) {
      if (currentStep === 'approve') {
        setApproveHash(hash);
        handleTip();
      } else if (currentStep === 'tip') {
        setTipHash(hash);
        handleTransactionSuccess(hash);
      }
    }
  }, [isConfirmed, hash, currentStep]);

  const handleApprove = async () => {
    if (!tokenConfig || !contractConfig || !address) return;
    
    try {
      setError(null);
      setCurrentStep('approve');
      
      const amountInWei = parseUnits(amount, tokenConfig.decimals);
      
      writeContract({
        address: tokenConfig.address as Address,
        abi: ERC20ABI,
        functionName: 'approve',
        args: [contractConfig.address, amountInWei],
      });
    } catch (err) {
      console.error("Error approving token:", err);
      setError(err instanceof Error ? err.message : "Failed to approve token");
      setCurrentStep('amount-input');
    }
  };

  const handleTip = async () => {
    if (!tokenConfig || !contractConfig || !address || !creatorAddress) return;
    
    try {
      setError(null);
      setCurrentStep('tip');
      
      const amountInWei = parseUnits(amount, tokenConfig.decimals);
      
      // Convert sessionId (hex string) to a number (BigInt)
      const sessionIdNum = sessionId.startsWith("0x")
        ? BigInt(sessionId)
        : BigInt(`0x${sessionId}`);

      writeContract({
        address: contractConfig.address as Address,
        abi: AMATippingABI,
        functionName: 'tip',
        args: [
          sessionIdNum,
          creatorAddress as Address,
          tokenConfig.address as Address,
          amountInWei
        ],
      });
    } catch (err) {
      console.error("Error sending tip:", err);
      setError(err instanceof Error ? err.message : "Failed to send tip");
      setCurrentStep('amount-input');
    }
  };

  const handleTransactionSuccess = async (txHash: string) => {
    try {
      // Get user context for API call
      const context = await sdk.context;
      const userFid = context?.user?.fid?.toString();
      const username = context?.user?.username;
      const pfpUrl = context?.user?.pfpUrl;

      if (!userFid) {
        throw new Error("Unable to get user information");
      }

      // Create user if not exists
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fid: userFid, username, pfpUrl }),
      }).catch(() => {
        // User might already exist
      });

      // Record the tip in the database
      const response = await fetch("/api/tips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          senderFid: userFid,
          recipientFid: creatorFid,
          amount: Number.parseFloat(amount),
          txHash: txHash,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to record tip");
      }

      const { tip } = await response.json();
      
      setCurrentStep('success');
      onTipSuccess?.(tip);

      // Don't auto-close, let user interact with success actions
    } catch (err) {
      console.error("Error recording tip:", err);
      setError(err instanceof Error ? err.message : "Failed to record tip");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number.parseFloat(amount) <= 0) return;
    if (!contractConfig || !tokenConfig) {
      setError("Tipping not supported on this network");
      return;
    }
    if (!creatorAddress) {
      setError("Creator address not available");
      return;
    }
    if (!selectedChainId) {
      setError("No chain selected");
      return;
    }
    
    // Check if we're on the correct chain
    if (chainId !== selectedChainId) {
      try {
        await switchChain({ chainId: selectedChainId });
      } catch (err) {
        setError("Failed to switch to selected chain");
        return;
      }
    }
    
    // Start with token approval
    console.log("approving token send")
    handleApprove();
  };

  // Continue with tip after approval is confirmed
  // This is now handled in the main useEffect above

  const handleClose = () => {
    if (!isPending && !isConfirming && !isFetchingAddress) {
      setAmount("");
      setCurrentStep('chain-selection');
      setError(null);
      setCreatorAddress(null);
      setSelectedChainId(null);
      setSelectedTokenIndex(0);
      setApproveHash(null);
      setTipHash(null);
      onClose();
    }
  };

  const isLoading = isPending || isConfirming || isFetchingAddress;
  const isSuccess = currentStep === 'success';

  // Get chain name helper
  const getChainName = (chainId: number) => {
    const chain = availableChains.find(c => c.id === chainId);
    return chain?.name || `Chain ${chainId}`;
  };

  // Get block explorer URL
  const getBlockExplorerUrl = (txHash: string, chainId: number) => {
    const baseUrls: { [key: number]: string } = {
      8453: 'https://basescan.org', // Base Mainnet
      84532: 'https://sepolia.basescan.org', // Base Sepolia
      42220: 'https://celoscan.io', // Celo Mainnet
      44787: 'https://alfajores.celoscan.io', // Celo Alfajores
    };
    
    const baseUrl = baseUrls[chainId];
    return baseUrl ? `${baseUrl}/tx/${txHash}` : `https://etherscan.io/tx/${txHash}`;
  };

  // Handle share to Farcaster
  const handleShareToFarcaster = () => {
    if (!tipHash || !selectedChainId || !tokenConfig) return;
    
    const blockExplorerUrl = getBlockExplorerUrl(tipHash, selectedChainId);
    const shareText = `Just tipped ${amount} ${tokenConfig.symbol} on ${getChainName(selectedChainId)}! 💰\n\nTransaction: ${blockExplorerUrl}`;
    
    // Open Farcaster share URL
    const farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`;
    window.open(farcasterUrl, '_blank');
  };

  // Handle view on explorer
  const handleViewOnExplorer = () => {
    if (!tipHash || !selectedChainId) return;
    
    const blockExplorerUrl = getBlockExplorerUrl(tipHash, selectedChainId);
    window.open(blockExplorerUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl text-black">
        <DialogHeader className="relative">
          <DialogTitle className="text-xl font-semibold text-black text-center">
            Send Tip
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-6 w-6 rounded-full hover:bg-gray-100"
            onClick={handleClose}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="py-6">
          {isSuccess ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-black mb-2">
                  Tip Sent Successfully! 🎉
                </h3>
                <p className="text-gray-600 mb-4">
                  Your tip of {amount} {tokenConfig?.symbol || 'USDC'} has been sent to the creator on {selectedChainId ? getChainName(selectedChainId) : 'the blockchain'}!
                </p>
                {tipHash && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg mb-4">
                    <p className="text-xs text-gray-500 mb-1">Transaction Hash:</p>
                    <p className="text-xs text-gray-800 break-all font-mono">
                      {tipHash}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-3">
                {tipHash && selectedChainId && (
                  <Button
                    onClick={handleViewOnExplorer}
                    variant="outline"
                    className="w-full"
                  >
                    🔍 View on Block Explorer
                  </Button>
                )}
                
                <Button
                  onClick={handleShareToFarcaster}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={!tipHash}
                >
                  📢 Share on Farcaster
                </Button>
                
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="w-full text-gray-600"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : currentStep === 'chain-selection' ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-black mb-4">
                Choose Network
              </h3>
              
              {!address && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                  <p className="text-sm text-blue-700 mb-3">
                    Connect your wallet to send tips.
                  </p>
                  <div className="space-y-2">
                    {connectors.map((connector) => (
                      <Button
                        key={connector.id}
                        onClick={() => connect({ connector })}
                        variant="outline"
                        className="w-full text-sm"
                      >
                        Connect {connector.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {address && (
                <div className="space-y-3">
                  {availableChains.map((chain) => {
                    const hasConfig = TIPPING_CONTRACT_ADDRESSES[chain.id as keyof typeof TIPPING_CONTRACT_ADDRESSES];
                    if (!hasConfig) return null;
                    
                    return (
                      <Button
                        key={chain.id}
                        onClick={() => handleChainSelect(chain.id)}
                        variant="outline"
                        className="w-full justify-between p-4 h-auto"
                        disabled={isLoading}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                            {chain.name.charAt(0)}
                          </div>
                          <span className="font-medium">{chain.name}</span>
                        </div>
                        <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : currentStep === 'token-selection' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleBack}
                  variant="ghost"
                  size="sm"
                  className="p-1"
                >
                  ←
                </Button>
                <h3 className="text-lg font-semibold text-black">
                  Choose Token on {getChainName(selectedChainId!)}
                </h3>
              </div>

              {contractConfig && (
                <div className="space-y-3">
                  {contractConfig.tokens.map((token, index) => (
                    <Button
                      key={token.address}
                      onClick={() => handleTokenSelect(index)}
                      variant="outline"
                      className="w-full justify-between p-4 h-auto"
                      disabled={isLoading}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                          {token.symbol.charAt(0)}
                        </div>
                        <div className="text-left">
                          <div className="font-medium">{token.symbol}</div>
                        </div>
                      </div>
                      <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ) : currentStep === 'amount-input' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleBack}
                  variant="ghost"
                  size="sm"
                  className="p-1"
                >
                  ←
                </Button>
                <h3 className="text-lg font-semibold text-black">
                  Enter Amount
                </h3>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {!creatorAddress && !isFetchingAddress && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-700">
                    Creator has no verified Ethereum address on Farcaster. Cannot send tip.
                  </p>
                </div>
              )}

              {isFetchingAddress && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-blue-700">
                      Fetching creator's verified address...
                    </p>
                  </div>
                </div>
              )}

              {/* Token and Chain Info */}
              {tokenConfig && selectedChainId && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Network:</span>
                    <span className="text-sm text-gray-900">{getChainName(selectedChainId)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Token:</span>
                    <span className="text-sm text-gray-900">{tokenConfig.symbol}</span>
                  </div>
                  {tokenBalance && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Balance:</span>
                      <span className="text-sm text-gray-900">
                        {Number(formatUnits(tokenBalance.value, tokenBalance.decimals)).toFixed(6)} {tokenConfig.symbol}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="amount"
                  className="text-sm font-medium text-black"
                >
                  Enter amount in {tokenConfig?.symbol || 'USDC'}
                </Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    step={tokenConfig?.decimals === 6 ? "0.000001" : "0.01"}
                    min={tokenConfig?.decimals === 6 ? "0.000001" : "0.01"}
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-12 text-lg text-black pr-16 border-gray-200 focus:border-purple-500"
                    disabled={isLoading}
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                    {tokenConfig?.symbol || 'USDC'}
                  </div>
                </div>
                {tokenBalance && amount && (
                  <div className="text-xs text-gray-500">
                    {Number(amount) > Number(formatUnits(tokenBalance.value, tokenBalance.decimals)) ? (
                      <span className="text-red-500">Insufficient balance</span>
                    ) : (
                      <span className="text-green-500">✓ Sufficient balance</span>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Support creators</strong> by tipping them for their
                  valuable insights and time spent answering questions.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Platform fee: 10% • Network: {getChainName(selectedChainId!)} • Token: {tokenConfig?.symbol}
                </p>
              </div>

              <Button
                type="submit"
                disabled={
                  !amount || 
                  Number.parseFloat(amount) <= 0 || 
                  isLoading || 
                  isFetchingAddress ||
                  !contractConfig ||
                  !address ||
                  !creatorAddress ||
                  (tokenBalance && Number(amount) > Number(formatUnits(tokenBalance.value, tokenBalance.decimals)))
                }
                className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Tip
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              {(currentStep === 'approve' || currentStep === 'tip') && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-blue-900">
                        {currentStep === 'approve' && 'Step 1: Approving token...'}
                        {currentStep === 'tip' && 'Step 2: Sending tip...'}
                      </span>
                      <span className="text-xs text-blue-700">
                        {currentStep === 'approve' && 'Please confirm the token approval in your wallet'}
                        {currentStep === 'tip' && 'Please confirm the tip transaction in your wallet'}
                      </span>
                    </div>
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  
                  {/* Transaction hashes */}
                  {approveHash && currentStep === 'tip' && (
                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs">
                      <span className="text-green-700">✓ Token approved</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

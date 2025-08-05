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
import { Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import sdk from "@farcaster/miniapp-sdk";
import { useWriteContract, useAccount, useChainId, useWaitForTransactionReceipt, useConnect } from "wagmi";
import { parseUnits, type Address } from "viem";
import { TIPPING_CONTRACT_ADDRESSES } from "@/lib/constants";
import AMATippingABI from "@/abis/AMATipping.json";
import ERC20ABI from "@/abis/ERC20.json";

interface TippingModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  creatorFid?: string; // The creator's Farcaster ID to fetch wallet address
  onTipSuccess?: (tip: any) => void;
}

type TippingStep = 'input' | 'approve' | 'tip' | 'success';

export default function TippingModal({
  isOpen,
  onClose,
  sessionId,
  creatorFid,
  onTipSuccess,
}: TippingModalProps) {
  const [amount, setAmount] = useState("");
  const [currentStep, setCurrentStep] = useState<TippingStep>('input');
  const [error, setError] = useState<string | null>(null);
  const [creatorAddress, setCreatorAddress] = useState<string | null>(null);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  
  const { address } = useAccount();
  const chainId = useChainId();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { connect, connectors } = useConnect();
  
  // Get contract config for current chain
  const contractConfig = TIPPING_CONTRACT_ADDRESSES[chainId as keyof typeof TIPPING_CONTRACT_ADDRESSES];
  const tokenConfig = contractConfig?.tokens[0]; // Use first token (USDC)
  
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

  useEffect(() => {
    if (isConfirmed && hash) {
      handleTransactionSuccess(hash);
    }
  }, [isConfirmed, hash]);

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
      setCurrentStep('input');
    }
  };

  const handleTip = async () => {
    if (!tokenConfig || !contractConfig || !address || !creatorAddress) return;
    
    try {
      setError(null);
      setCurrentStep('tip');
      
      const amountInWei = parseUnits(amount, tokenConfig.decimals);
      
      writeContract({
        address: contractConfig.address as Address,
        abi: AMATippingABI,
        functionName: 'tip',
        args: [
          BigInt(sessionId),
          creatorAddress as Address,
          tokenConfig.address as Address,
          amountInWei
        ],
      });
    } catch (err) {
      console.error("Error sending tip:", err);
      setError(err instanceof Error ? err.message : "Failed to send tip");
      setCurrentStep('input');
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

      // Auto close after 3 seconds
      setTimeout(() => {
        handleClose();
      }, 3000);
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
    
    // Start with token approval
    handleApprove();
  };

  // Continue with tip after approval is confirmed
  useEffect(() => {
    if (isConfirmed && currentStep === 'approve') {
      handleTip();
    }
  }, [isConfirmed, currentStep]);

  const handleClose = () => {
    if (!isPending && !isConfirming && !isFetchingAddress) {
      setAmount("");
      setCurrentStep('input');
      setError(null);
      setCreatorAddress(null);
      onClose();
    }
  };

  const isLoading = isPending || isConfirming || isFetchingAddress;
  const isSuccess = currentStep === 'success';

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
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-black mb-2">
                Tip Sent!
              </h3>
              <p className="text-gray-600">
                Your tip of {amount} {tokenConfig?.symbol || 'USDC'} has been sent successfully!
              </p>
              {hash && (
                <p className="text-xs text-gray-500 mt-2 break-all">
                  Transaction: {hash}
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {!contractConfig && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    Tipping is not supported on this network. Please switch to a supported network.
                  </p>
                </div>
              )}

              {!address && contractConfig && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
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

              {!creatorAddress && address && contractConfig && !isFetchingAddress && (
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
              </div>

              {currentStep !== 'input' && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">
                      {currentStep === 'approve' && 'Approving token...'}
                      {currentStep === 'tip' && 'Sending tip...'}
                    </span>
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Support creators</strong> by tipping them for their
                  valuable insights and time spent answering questions.
                </p>
                {contractConfig && (
                  <p className="text-xs text-gray-500 mt-2">
                    Platform fee: 10% • Token: {tokenConfig?.symbol}
                  </p>
                )}
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
                  !creatorAddress
                }
                className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {currentStep === 'approve' && 'Approving...'}
                    {currentStep === 'tip' && 'Sending Tip...'}
                    {currentStep === 'input' && 'Processing...'}
                  </div>
                ) : (
                  "Send Tip"
                )}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client"

import type React from "react"

import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Check, X } from "lucide-react"
import { useState } from "react"
import sdk from "@farcaster/miniapp-sdk"

interface TippingModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  onTipSuccess?: (tip: any) => void;
}

export default function TippingModal({ isOpen, onClose, sessionId, onTipSuccess }: TippingModalProps) {
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || Number.parseFloat(amount) <= 0) return

    setIsLoading(true)
    setError(null)

    try {
      // Get user context
      const context = await sdk.context;
      const userFid = context?.user?.fid?.toString();
      const username = context?.user?.username;
      const pfpUrl = context?.user?.pfpUrl;

      if (!userFid) {
        throw new Error("Unable to get user information");
      }

      // Create user if not exists
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid: userFid, username, pfpUrl }),
      }).catch(() => {
        // User might already exist
      });

      // For now, we'll simulate a transaction hash
      // In a real implementation, this would come from an actual blockchain transaction
      const mockTxHash = `0x${Math.random().toString(16).substring(2, 66)}`;

      const response = await fetch('/api/tips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          senderFid: userFid,
          amount: Number.parseFloat(amount),
          txHash: mockTxHash,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send tip');
      }

      const { tip } = await response.json();
      
      setIsSuccess(true)
      onTipSuccess?.(tip);
      
      // Auto close after 2 seconds
      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch (err) {
      console.error('Error sending tip:', err);
      setError(err instanceof Error ? err.message : 'Failed to send tip');
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setAmount("")
      setIsSuccess(false)
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl">
        <DialogHeader className="relative">
          <DialogTitle className="text-xl font-semibold text-black text-center">Send Tip</DialogTitle>
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
              <h3 className="text-lg font-semibold text-black mb-2">Tip Sent!</h3>
              <p className="text-gray-600">
                Your tip of ${amount} has been sent successfully!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium text-black">
                  Enter amount in USDC
                </Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-12 text-lg pr-16 border-gray-200 focus:border-purple-500"
                    disabled={isLoading}
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                    USDC
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Support creators</strong> by tipping them for their valuable insights and time spent answering
                  questions.
                </p>
              </div>

              <Button
                type="submit"
                disabled={!amount || Number.parseFloat(amount) <= 0 || isLoading}
                className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
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
  )
}

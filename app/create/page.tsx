"use client";

import type React from "react";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSession } from "~/onchain/writes";
import { writeContract, waitForTransactionReceipt } from "@wagmi/core";
import { config } from "~/components/providers/WagmiProvider";
import { parseEventLogs } from "viem";
import { useAccount, useConnect } from "wagmi";
import { readContract } from "@wagmi/core";
import sdk from "@farcaster/miniapp-sdk";
import { AMA_CONTRACT_ADDRESS, AMA_CONTRACT_ABI } from "~/lib/constants";

export default function CreateSessionPage() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: { title?: string } = {};
    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    if (!isConnected) {
      // Prompt user to connect wallet
      connect({
        connector: connectors[0],
      });
      setIsSubmitting(false);
      return;
    }

    // perform the transaction to create the session
    try {
      const tx = await createSession(
        (
          await sdk.context
        )?.user?.username!,
        title,
        description
      );
      console.log("Transaction sent:", tx);
      // Optionally wait for confirmation or handle the transaction result

      // Redirect to the new session
      // 2. Wait until mined
      const receipt = await waitForTransactionReceipt(config, { hash: tx });

      const sessionId = await readContract(config, {
        abi: AMA_CONTRACT_ABI,
        address: AMA_CONTRACT_ADDRESS,
        functionName: "sessionCounter",
      });

      router.push(`/session/${sessionId}`);
    } catch (error) {
      console.error("Error creating session:", error);
      setErrors({ title: "Failed to create session. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-black transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-black mb-2">
            Start an AMA Session
          </h1>
          <p className="text-gray-600">
            Create a new Ask Me Anything session for your community
          </p>
        </div>

        {/* Form */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-black">
              Session Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="title"
                  className="text-sm font-medium text-black"
                >
                  Session Title *
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="e.g., Building the Future of Web3"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) {
                      setErrors({ ...errors, title: undefined });
                    }
                  }}
                  className={`h-12 ${
                    errors.title
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-200 focus:border-purple-500"
                  }`}
                  required
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Description Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-sm font-medium text-black"
                >
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Tell people what this AMA is about..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[120px] border-gray-200 focus:border-purple-500 resize-none"
                  rows={5}
                />
                <p className="text-xs text-gray-500">
                  Give your audience context about what topics you'll be
                  covering
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating Session...
                    </div>
                  ) : (
                    "Start AMA Session"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Tips */}
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-black mb-3">
            Tips for a great AMA:
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>
              • Choose a clear, descriptive title that explains your expertise
            </li>
            <li>• Set expectations about how long you'll be available</li>
            <li>
              • Engage with questions promptly to keep the conversation flowing
            </li>
            <li>• Be authentic and share personal insights</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

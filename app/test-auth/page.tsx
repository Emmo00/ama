"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { QuickAuthButton } from "../../components/QuickAuthButton";
import { useQuickAuth } from "../../hooks/useQuickAuth";
import Link from "next/link";
import sdk from "@farcaster/miniapp-sdk";

export default function QuickAuthTestPage() {
  const { user, isLoading, error, isAuthenticated } = useQuickAuth();
  const [testUser, setTestUser] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Home
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold mb-8">Quick Auth Test Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* useQuickAuth Hook Test */}
          <Card>
            <CardHeader>
              <CardTitle>useQuickAuth Hook</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading...</p>
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">Error: {error}</p>
                </div>
              )}
              
              {isAuthenticated && user && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-700 font-medium">✅ Authenticated!</p>
                  </div>
                  <div className="space-y-2">
                    <p><strong>FID:</strong> {user.fid}</p>
                    <p><strong>Username:</strong> {user.username}</p>
                    {user.pfpUrl && (
                      <div className="flex items-center gap-2">
                        <strong>Avatar:</strong>
                        <img src={user.pfpUrl} alt={user.username} className="w-8 h-8 rounded-full" />
                      </div>
                    )}
                    <p><strong>Created:</strong> {new Date(user.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
              
              {!isLoading && !isAuthenticated && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-700">Not authenticated</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Quick Auth Button Test */}
          <Card>
            <CardHeader>
              <CardTitle>Manual Quick Auth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <QuickAuthButton
                  onSuccess={(userData) => {
                    setTestUser(userData);
                  }}
                  onError={(error) => {
                    alert(`Error: ${error}`);
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                />
                
                {testUser && (
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-700 font-medium">✅ Manual Auth Success!</p>
                    </div>
                    <div className="space-y-2">
                      <p><strong>FID:</strong> {testUser.fid}</p>
                      <p><strong>Username:</strong> {testUser.username}</p>
                      {testUser.pfpUrl && (
                        <div className="flex items-center gap-2">
                          <strong>Avatar:</strong>
                          <img src={testUser.pfpUrl} alt={testUser.username} className="w-8 h-8 rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Test API Endpoints */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>API Endpoints Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/auth/validate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token: 'test-token' })
                      });
                      const data = await response.json();
                      alert(JSON.stringify(data, null, 2));
                    } catch (error) {
                      alert(`Error: ${error}`);
                    }
                  }}
                  variant="outline"
                >
                  Test /api/auth/validate
                </Button>

                <Button
                  onClick={async () => {
                    try {
                      const response = await sdk.quickAuth.fetch('/api/auth/me');
                      const data = await response.json();
                      alert(JSON.stringify(data, null, 2));
                    } catch (error) {
                      alert(`Error: ${error}`);
                    }
                  }}
                  variant="outline"
                >
                  Test /api/auth/me
                </Button>

                <Button
                  onClick={async () => {
                    try {
                      const response = await sdk.quickAuth.fetch('/api/users', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: 'testuser' })
                      });
                      const data = await response.json();
                      alert(JSON.stringify(data, null, 2));
                    } catch (error) {
                      alert(`Error: ${error}`);
                    }
                  }}
                  variant="outline"
                >
                  Test Protected API
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreateSessionPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to homepage since we now use the modal for creating sessions
    router.replace("/?create=true");
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}

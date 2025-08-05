import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { useSessions, CreateSessionData } from "@/hooks/useSessions";

interface CreateSessionModalProps {
  onSessionCreated?: (session: any) => void;
}

export function CreateSessionModal({ onSessionCreated }: CreateSessionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateSessionData>({
    title: "",
    description: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  
  const { createSession } = useSessions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      setFormError("Please fill in all fields");
      return;
    }
    
    try {
      setIsCreating(true);
      setFormError(null);
      
      const newSession = await createSession(formData);
      
      // Reset form and close modal
      setFormData({ title: "", description: "" });
      setIsOpen(false);
      
      // Notify parent component
      onSessionCreated?.(newSession);
      
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to create session");
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (field: keyof CreateSessionData, value: string) => {
    setFormData((prev: CreateSessionData) => ({ ...prev, [field]: value }));
    if (formError) setFormError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200">
          <Plus className="w-5 h-5 mr-2" />
          Start AMA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px] text-black">
        <DialogHeader>
          <DialogTitle>Start a New AMA Session</DialogTitle>
          <DialogDescription>
            Create a live Ask Me Anything session that your followers can join.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{formError}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="title">Session Title</Label>
            <Input
              id="title"
              placeholder="e.g., Building the Future of Web3"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              disabled={isCreating}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Tell people what you'll be discussing in this AMA session..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              disabled={isCreating}
              className="w-full min-h-[100px]"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isCreating}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !formData.title.trim() || !formData.description.trim()}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Start AMA"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Star, Tag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TenantFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantName: string;
  onSubmit: (feedback: {
    ownerFeedback?: string;
    rating?: number;
    behaviorTags?: string[];
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const BEHAVIOR_TAGS = [
  "Quiet",
  "Paid on Time",
  "Cooperative",
  "Clean",
  "Respectful",
  "Punctual",
  "Responsible",
  "Friendly",
  "Noisy",
  "Late Payments",
  "Uncooperative",
  "Messy",
];

export function TenantFeedbackDialog({
  open,
  onOpenChange,
  tenantName,
  onSubmit,
  onCancel,
  isLoading,
}: TenantFeedbackDialogProps) {
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hoveredStar, setHoveredStar] = useState<number>(0);

  const handleSubmit = () => {
    onSubmit({
      ownerFeedback: feedback.trim() || undefined,
      rating: rating > 0 ? rating : undefined,
      behaviorTags: selectedTags.length > 0 ? selectedTags : undefined,
    });
  };

  const handleSkip = () => {
    onSubmit({});
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" data-testid="dialog-tenant-feedback">
        <DialogHeader>
          <DialogTitle className="text-xl" data-testid="text-dialog-title">
            Provide Feedback for {tenantName}
          </DialogTitle>
          <DialogDescription data-testid="text-dialog-description">
            Your feedback helps other PG owners make informed decisions. This is optional but highly appreciated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Overall Rating <span className="text-muted-foreground">(Optional)</span>
            </label>
            <div className="flex gap-2" data-testid="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
                  data-testid={`button-star-${star}`}
                >
                  <Star
                    className={cn(
                      "w-8 h-8 transition-colors",
                      (hoveredStar >= star || rating >= star)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    )}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground self-center" data-testid="text-rating-value">
                  {rating} star{rating !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Feedback Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="feedback-text">
              Feedback <span className="text-muted-foreground">(Optional)</span>
            </label>
            <Textarea
              id="feedback-text"
              placeholder="Share your experience with this tenant... (e.g., payment behavior, cleanliness, cooperation)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[100px] resize-none"
              data-testid="textarea-feedback"
            />
            <p className="text-xs text-muted-foreground">
              {feedback.length}/500 characters
            </p>
          </div>

          {/* Behavior Tags */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              <label className="text-sm font-medium">
                Behavior Tags <span className="text-muted-foreground">(Optional)</span>
              </label>
            </div>
            <div className="flex flex-wrap gap-2" data-testid="behavior-tags">
              {BEHAVIOR_TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-colors",
                    selectedTags.includes(tag)
                      ? "bg-purple-600 hover:bg-purple-700"
                      : "hover:bg-purple-50"
                  )}
                  onClick={() => toggleTag(tag)}
                  data-testid={`tag-${tag.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {tag}
                </Badge>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <p className="text-xs text-muted-foreground" data-testid="text-selected-tags-count">
                {selectedTags.length} tag{selectedTags.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            data-testid="button-cancel-feedback"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            disabled={isLoading}
            data-testid="button-skip-feedback"
          >
            Skip & Delete
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            disabled={isLoading}
            data-testid="button-submit-feedback"
          >
            {isLoading ? "Deleting..." : "Submit & Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

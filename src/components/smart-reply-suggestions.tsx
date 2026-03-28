import { Button } from '@/components/ui/button';

interface SmartReplySuggestionsProps {
  suggestions: string[];
  onSelectReply: (reply: string) => void;
}

export function SmartReplySuggestions({ suggestions, onSelectReply }: SmartReplySuggestionsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mb-2 flex flex-wrap gap-1.5">
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          className="h-auto rounded-full px-3 py-1 text-xs shadow-sm"
          onClick={() => onSelectReply(suggestion)}
        >
          {suggestion}
        </Button>
      ))}
    </div>
  );
}

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
    <div className="mb-2 flex flex-wrap gap-2">
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          className="h-auto py-1 px-3 text-sm"
          onClick={() => onSelectReply(suggestion)}
        >
          {suggestion}
        </Button>
      ))}
    </div>
  );
}

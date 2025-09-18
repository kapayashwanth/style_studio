import { Sparkles } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="ml-2 text-xl font-bold tracking-tight">
            Style Studio AI
          </h1>
        </div>
      </div>
    </header>
  );
}

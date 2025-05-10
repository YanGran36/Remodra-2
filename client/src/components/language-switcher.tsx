import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Loader2 } from "lucide-react";

export function LanguageSwitcher({ variant = "ghost", showText = true }: { 
  variant?: "ghost" | "outline" | "secondary" | "default"; 
  showText?: boolean;
}) {
  const { language, changeLanguage, supportedLanguages, isLoading } = useLanguage();

  // Get the current language name to display
  const currentLanguageName = supportedLanguages.find(lang => lang.code === language)?.name || '';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size="sm" 
          className="flex items-center gap-2 rounded-full"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Globe className="h-5 w-5" />
          )}
          {showText && <span className="hidden md:inline-block">{currentLanguageName}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {supportedLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={language === lang.code ? "bg-muted font-medium" : ""}
            disabled={isLoading}
          >
            {language === lang.code && isLoading ? (
              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
            ) : language === lang.code ? (
              <span className="h-3 w-3 mr-2 rounded-full bg-primary" />
            ) : (
              <span className="h-3 w-3 mr-2" />
            )}
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
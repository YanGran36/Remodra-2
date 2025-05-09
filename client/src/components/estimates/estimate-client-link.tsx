import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Clipboard, Link, Check, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-language";

interface EstimateClientLinkProps {
  estimateId: number;
  estimateNumber: string;
  clientEmail?: string | null;
  onSendEmail?: () => void;
}

export function EstimateClientLink({ 
  estimateId, 
  estimateNumber,
  clientEmail,
  onSendEmail
}: EstimateClientLinkProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // Construir la URL completa para el cliente
  const publicUrl = `${window.location.origin}/public/estimates/${estimateId}`;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast({
        title: t("Success"),
        description: t("The link has been copied to the clipboard"),
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying link:", error);
      toast({
        title: t("Error"),
        description: t("Could not copy the link to the clipboard"),
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Link className="h-5 w-5" />
          {t("Client Access Link")}
        </CardTitle>
        <CardDescription>
          {t("Share this link with your client to let them review and approve this estimate")}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="clientLink">{t("Estimate Link")}</Label>
            <div className="flex space-x-2">
              <Input
                id="clientLink"
                value={publicUrl}
                readOnly
                className="flex-grow font-mono text-sm"
              />
              <Button 
                variant={copied ? "outline" : "secondary"} 
                onClick={handleCopy}
                className="flex items-center gap-2 min-w-24"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    {t("Copied")}
                  </>
                ) : (
                  <>
                    <Clipboard className="h-4 w-4" />
                    {t("Copy")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      {onSendEmail && clientEmail && (
        <CardFooter className="flex justify-between pt-0">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={onSendEmail}
          >
            <Mail className="h-4 w-4" />
            {t("Send to client")}
          </Button>
          <div className="text-sm text-muted-foreground">
            <span>{clientEmail}</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
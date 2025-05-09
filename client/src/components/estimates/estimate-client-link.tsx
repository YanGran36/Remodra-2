import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Clipboard, Link, Check, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  
  // Construir la URL completa para el cliente
  const publicUrl = `${window.location.origin}/public/estimates/${estimateId}`;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast({
        title: "Éxito",
        description: "El enlace ha sido copiado al portapapeles",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying link:", error);
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace al portapapeles",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Link className="h-5 w-5" />
          Enlace para cliente
        </CardTitle>
        <CardDescription>
          Comparte este enlace con tu cliente para que puedan revisar y aprobar este estimado
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="clientLink">Enlace del estimado</Label>
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
                    Copiado
                  </>
                ) : (
                  <>
                    <Clipboard className="h-4 w-4" />
                    Copiar
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
            Enviar al cliente
          </Button>
          <div className="text-sm text-muted-foreground">
            <span>{clientEmail}</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
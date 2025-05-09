import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EventForm from "@/components/events/event-form";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  eventId?: number;
  defaultClientId?: string;
  defaultProjectId?: string;
  defaultType?: string;
}

export default function EventDialog({
  isOpen,
  onClose,
  eventId,
  defaultClientId,
  defaultProjectId,
  defaultType,
}: EventDialogProps) {
  // Si hay un eventId, buscamos la información del evento
  const { isLoading } = useQuery({
    queryKey: ["/api/protected/events", eventId],
    enabled: !!eventId && isOpen,
  });

  const handleSuccess = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {eventId ? "Editar Evento" : "Crear Nuevo Evento"}
          </DialogTitle>
          <DialogDescription>
            {eventId
              ? "Actualice los detalles del evento existente"
              : "Complete los detalles para programar un nuevo evento"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <EventForm
            eventId={eventId}
            defaultClientId={defaultClientId}
            defaultProjectId={defaultProjectId}
            defaultType={defaultType}
            onSuccess={handleSuccess}
            onCancel={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
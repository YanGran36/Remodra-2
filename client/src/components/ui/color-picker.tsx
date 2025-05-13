import React, { useState, useEffect, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Paintbrush } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function ColorPicker({ value, onChange, className, disabled }: ColorPickerProps) {
  const [color, setColor] = useState(value || '#000000');
  const [tempColor, setTempColor] = useState(color);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setColor(value);
    setTempColor(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempColor(e.target.value);
  };

  const handleApply = () => {
    setColor(tempColor);
    onChange(tempColor);
    setOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setTempColor(color);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 border-dashed flex gap-2 items-center",
            className
          )}
          disabled={disabled}
        >
          <div
            className="h-4 w-4 rounded-full border"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs font-mono uppercase">{color}</span>
          <Paintbrush className="h-3 w-3 ml-auto text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="color-picker">Color</Label>
            <div className="h-32 rounded-md border overflow-hidden">
              <input
                ref={inputRef}
                type="color"
                id="color-picker"
                value={tempColor}
                onChange={handleInputChange}
                className="h-full w-full cursor-pointer"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="color-code">Código de color</Label>
            <Input
              id="color-code"
              value={tempColor}
              onChange={handleInputChange}
              className="font-mono text-sm"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" className="flex-1" onClick={handleApply}>
              Aplicar color
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
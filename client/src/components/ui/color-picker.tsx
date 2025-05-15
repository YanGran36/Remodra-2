import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";

export interface ColorPickerProps {
  value?: string;
  onChange?: (value: string) => void;
  color?: string; // For backward compatibility
}

export function ColorPicker({ value, onChange, color }: ColorPickerProps) {
  // Use color prop for backward compatibility
  const colorValue = value || color || "#000000";
  const handleChange = onChange;
  
  const predefinedColors = [
    "#000000", "#ffffff", "#f44336", "#e91e63", "#9c27b0", "#673ab7",
    "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50",
    "#8bc34a", "#cddc39", "#ffeb3b", "#ffc107", "#ff9800", "#ff5722",
    "#795548", "#607d8b", "#0f766e", "#2563eb", "#be123c", "#db2777",
    "#6d28d9", "#4f46e5", "#1e293b", "#64748b", "#003366", "#336699"
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-8 h-8 p-0 border-2"
          style={{ backgroundColor: colorValue }}
        >
          <span className="sr-only">Open color picker</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="grid grid-cols-5 gap-2">
          {predefinedColors.map((color) => (
            <button
              key={color}
              className="w-8 h-8 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
              style={{ backgroundColor: color }}
              onClick={() => handleChange && handleChange(color)}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
        <div className="flex items-center mt-4">
          <input
            type="color"
            value={colorValue}
            onChange={(e) => handleChange && handleChange(e.target.value)}
            className="w-8 h-8"
            id="custom-color-picker"
          />
          <label htmlFor="custom-color-picker" className="ml-2 text-sm font-medium">
            Custom color
          </label>
        </div>
      </PopoverContent>
    </Popover>
  );
}
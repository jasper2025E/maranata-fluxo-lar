import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Pipette, RotateCcw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface HSLColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  defaultValue?: string;
}

interface HSLValues {
  h: number;
  s: number;
  l: number;
}

function parseHSL(hslString: string): HSLValues {
  const parts = hslString.split(" ");
  if (parts.length >= 3) {
    return {
      h: parseInt(parts[0]) || 0,
      s: parseInt(parts[1].replace("%", "")) || 0,
      l: parseInt(parts[2].replace("%", "")) || 0,
    };
  }
  return { h: 262, s: 83, l: 58 };
}

function formatHSL(values: HSLValues): string {
  return `${values.h} ${values.s}% ${values.l}%`;
}

export function HSLColorPicker({ value, onChange, label, defaultValue = "262 83% 58%" }: HSLColorPickerProps) {
  const [hsl, setHsl] = useState<HSLValues>(() => parseHSL(value));
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    const parsed = parseHSL(value);
    setHsl(parsed);
    setInputValue(value);
  }, [value]);

  const updateColor = useCallback((newHsl: HSLValues) => {
    setHsl(newHsl);
    const formatted = formatHSL(newHsl);
    setInputValue(formatted);
    onChange(formatted);
  }, [onChange]);

  const handleHueChange = (values: number[]) => {
    updateColor({ ...hsl, h: values[0] });
  };

  const handleSaturationChange = (values: number[]) => {
    updateColor({ ...hsl, s: values[0] });
  };

  const handleLightnessChange = (values: number[]) => {
    updateColor({ ...hsl, l: values[0] });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const parsed = parseHSL(inputValue);
    updateColor(parsed);
  };

  const handleReset = () => {
    const parsed = parseHSL(defaultValue);
    updateColor(parsed);
  };

  const previewColor = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>

      {/* Color Preview */}
      <motion.div
        className="relative h-16 rounded-xl overflow-hidden border border-border/50"
        style={{ backgroundColor: previewColor }}
        animate={{ backgroundColor: previewColor }}
        transition={{ duration: 0.15 }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-1.5">
            <span className="text-white text-sm font-mono">{formatHSL(hsl)}</span>
          </div>
        </div>
      </motion.div>

      {/* Hue Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Matiz (Hue)</span>
          <span className="text-xs font-mono text-foreground">{hsl.h}°</span>
        </div>
        <div 
          className="h-3 rounded-full"
          style={{
            background: "linear-gradient(to right, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%))"
          }}
        >
          <Slider
            value={[hsl.h]}
            min={0}
            max={360}
            step={1}
            onValueChange={handleHueChange}
            className="[&>span:first-child]:h-3 [&>span:first-child]:bg-transparent [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:border-2 [&_[role=slider]]:border-white [&_[role=slider]]:shadow-md"
          />
        </div>
      </div>

      {/* Saturation Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Saturação</span>
          <span className="text-xs font-mono text-foreground">{hsl.s}%</span>
        </div>
        <div 
          className="h-3 rounded-full"
          style={{
            background: `linear-gradient(to right, hsl(${hsl.h}, 0%, ${hsl.l}%), hsl(${hsl.h}, 100%, ${hsl.l}%))`
          }}
        >
          <Slider
            value={[hsl.s]}
            min={0}
            max={100}
            step={1}
            onValueChange={handleSaturationChange}
            className="[&>span:first-child]:h-3 [&>span:first-child]:bg-transparent [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:border-2 [&_[role=slider]]:border-white [&_[role=slider]]:shadow-md"
          />
        </div>
      </div>

      {/* Lightness Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Luminosidade</span>
          <span className="text-xs font-mono text-foreground">{hsl.l}%</span>
        </div>
        <div 
          className="h-3 rounded-full"
          style={{
            background: `linear-gradient(to right, hsl(${hsl.h}, ${hsl.s}%, 0%), hsl(${hsl.h}, ${hsl.s}%, 50%), hsl(${hsl.h}, ${hsl.s}%, 100%))`
          }}
        >
          <Slider
            value={[hsl.l]}
            min={0}
            max={100}
            step={1}
            onValueChange={handleLightnessChange}
            className="[&>span:first-child]:h-3 [&>span:first-child]:bg-transparent [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:border-2 [&_[role=slider]]:border-white [&_[role=slider]]:shadow-md"
          />
        </div>
      </div>

      {/* Manual Input */}
      <div className="flex items-center gap-2">
        <Pipette className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder="262 83% 58%"
          className="font-mono text-sm h-9"
        />
      </div>
    </div>
  );
}

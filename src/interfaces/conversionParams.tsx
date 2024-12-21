import { ConversionStep } from "@/types/conversionStep";

export interface ConversionParams {
  step: ConversionStep;
  userId?: string;
  method?: string;
  tier?: string;
  value?: number;
}

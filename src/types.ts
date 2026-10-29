export interface Watch {
  id: string;
  name: string;
  brand: string;
  collection: string;
  style: string;
  price: number;
  currency: 'USD';
  image: string;
  description: string;
  features: string[];
  diameterMm: number;
  waterResistanceM: number;
  powerReserveH: number;
  featured: boolean;
  details: {
    reference: string;
    movement: string;
    case: string;
    diameter: string;
    waterResistance: string;
    powerReserve: string;
  };
}
export interface History {
  points: { date: string; price: number }[];
  synthetic: boolean;
  source: string;
  period: string;
  currency: string;
}
export interface Insights {
  count: number;
  min: number | null;
  max: number | null;
  average: number | null;
  median: number | null;
  brands: { brand: string; count: number; average: number; min: number; max: number }[];
  styles: { style: string; count: number }[];
  source: string;
  seriesPeriod: string;
  currency: string;
}
export interface ChatReply {
  reply: string;
  recommendations: string[];
  mode: 'catalogue' | 'ai' | 'fallback';
}
export const money = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
export const compactMoney = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    signal: options?.signal ?? AbortSignal.timeout(15000),
    headers: {
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
      ...options?.headers,
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Unable to connect. Please try again.');
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

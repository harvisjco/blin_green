function itemAreaM2(widthCm: number, heightCm: number) {
  return (widthCm / 100) * (heightCm / 100);
}

export function itemAmount(widthCm: number, heightCm: number, quantity: number, unitPrice: number) {
  return Math.round(itemAreaM2(widthCm, heightCm) * unitPrice * quantity);
}

export function itemCost(widthCm: number, heightCm: number, quantity: number, unitCost: number) {
  return Math.round(itemAreaM2(widthCm, heightCm) * unitCost * quantity);
}

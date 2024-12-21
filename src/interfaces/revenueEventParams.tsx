export interface RevenueEventParams {
    transaction_id: string;
    value: number;
    currency: string;
    items: Array<{
      item_id: string;
      item_name: string;
      price: number;
    }>;
  }
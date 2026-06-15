export interface TCGCategory {
  categoryId: number;
  name: string;
  modifiedOn: string;
  displayName: string;
  seoCategoryName: string;
  sealedLabel: string;
  nonSealedLabel: string;
  conditionGuideUrl: string;
  isScannable: boolean;
  popularity: number;
}

export interface TCGProduct {
  productId: number;
  name: string;
  cleanName: string;
  imageUrl: string;
  categoryId: number;
  groupId: number;
  url: string;
  modifiedOn: string;
  imageCount: number;
  presaleInfo: {
    isPresale: boolean;
    releasedOn: string | null;
    note: string;
  };
  extendedData: Array<{ name: string; displayName: string; value: string }>;
  customAttributes: { alias: string };
}

export interface TCGPrice {
  productId: number;
  lowPrice: number;
  midPrice: number;
  highPrice: number;
  marketPrice: number;
  directLowPrice: number | null;
  subTypeName: string; // "Normal" | "Foil"
}

export interface CollectionCard {
  productId: number;
  name: string;
  imageUrl: string;
  categoryId: number;
  condition: string;
  quantity: number;
  addedAt: string;
  marketPrice?: number;
}

export interface SearchResult {
  totalItems: number;
  results: TCGProduct[];
}

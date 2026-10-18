export interface CartItem {
  publicationId: string;
  /** Opcional: carritos guardados antes del checkout no lo traen. */
  sellerId?: string;
  title: string;
  price: number;
  primaryImage: string | null;
  sellerUsername: string;
}

export interface IEcategory {
  name: string;
  slug: string;
  description?: string;
  image?: {
    public_id: string;
    url: string;
  };
  isActive: boolean;
}

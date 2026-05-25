
export interface ICovarImage {
  public_id: string;
  url: string;
}

export type ICoverImage = ICovarImage;

export interface ICover {
  title: string;
  description: string;
  image: ICovarImage;
  edition: string;
}
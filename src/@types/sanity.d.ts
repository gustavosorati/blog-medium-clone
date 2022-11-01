export interface Post {
  _id: string;
  _createdAt: string;
  title: string;
  description: string;
  author: {
    name: string;
    image: string;
  };
  description: string;
  mainImage: {
    asset: {
      url: string;
    }
  };
  slug: {
    current: string;
  };
  body: [object];
  comments: {
    _id: string;
    name: string;
    email: string;
    comment: string;
  }[];
}
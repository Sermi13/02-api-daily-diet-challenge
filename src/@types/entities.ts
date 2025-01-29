export type User = {
  id: string;
  name: string;
  email: string;
  password?: string;
  image: string;
  created_at: string;
};

export type Meal = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  in_diet: boolean;
  created_at: string;
};

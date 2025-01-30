import { Meal } from '../@types/entities';

export class MealsViewModel {
  static createToHttp(meal: Meal) {
    return {
      meal: {
        id: meal.id,
        user_id: meal.user_id,
        name: meal.name,
        description: meal.description,
        in_diet: Boolean(meal.in_diet),
        created_at: meal.created_at,
      },
    };
  }
  static updateToHttp(meal: Meal) {
    return {
      meal: {
        id: meal.id,
        user_id: meal.user_id,
        name: meal.name,
        description: meal.description,
        in_diet: Boolean(meal.in_diet),
        created_at: meal.created_at,
      },
    };
  }
  static listToHttp(meals: Meal[]) {
    return {
      meals: meals.map((meal) => {
        return {
          id: meal.id,
          user_id: meal.user_id,
          name: meal.name,
          description: meal.description,
          in_diet: Boolean(meal.in_diet),
          created_at: meal.created_at,
        };
      }),
    };
  }
  static detailToHttp(meal: Meal) {
    return {
      meal: {
        id: meal.id,
        user_id: meal.user_id,
        name: meal.name,
        description: meal.description,
        in_diet: Boolean(meal.in_diet),
        created_at: meal.created_at,
      },
    };
  }
}

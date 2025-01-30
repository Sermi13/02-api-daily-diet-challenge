import { Meal } from '../@types/entities';

export class MealsViewModel {
  static createToHttp(meal: Meal) {
    return {
      meal: {
        id: meal.id,
        user_id: meal.user_id,
        name: meal.name,
        date: meal.date,
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
        date: meal.date,
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
          date: meal.date,
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
        date: meal.date,
        description: meal.description,
        in_diet: Boolean(meal.in_diet),
        created_at: meal.created_at,
      },
    };
  }

  static summaryToHttp(data: {
    totalMeals: number;
    totalMealsInDiet: number;
    totalMealsOutOfDiet: number;
    longestDietStreak: number;
  }) {
    return {
      summary: {
        totalMeals: data.totalMeals,
        totalMealsInDiet: data.totalMealsInDiet,
        totalMealsOutOfDiet: data.totalMealsOutOfDiet,
        longestDietStreak: data.longestDietStreak,
      },
    };
  }
}

import type { Recipe, RecipeFilters, RecipeIngredient, RecipeServings } from './recipeTypes';

export function filterRecipes(items: Recipe[], filters: RecipeFilters, favorites: readonly string[]) {
  const terms = filters.query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return items.filter((recipe) => {
    const search = [recipe.name, recipe.flavor, ...recipe.ingredients.map((item) => item.name), ...(recipe.searchTerms ?? [])].join(' ').toLocaleLowerCase();
    return (filters.meal === '全部' || recipe.meal === filters.meal)
      && (!filters.collection || (filters.collection === '港式菜单' ? recipe.collection === '港式菜单' : !recipe.collection))
      && (filters.cuisine === '全部口味' || recipe.cuisine === filters.cuisine)
      && (!filters.quickOnly || recipe.minutes <= 20)
      && (!filters.favoritesOnly || favorites.includes(recipe.id))
      && terms.every((term) => search.includes(term));
  });
}

export function ingredientQuantity(item: RecipeIngredient, servings: RecipeServings) {
  return `${Number((item.amount * servings).toFixed(1))} ${item.unit}`;
}

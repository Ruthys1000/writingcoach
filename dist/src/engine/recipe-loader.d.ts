import type { Recipe } from '../types';
export declare class RecipeLoader {
    private recipesDir;
    private cache;
    constructor(recipesDir?: string);
    private ensureDataDirRecipes;
    /** Load a recipe by its id (filename without .yaml). */
    load(id: string): Recipe;
    /** List all available recipe ids. */
    listAvailable(): Array<{
        id: string;
        name: string;
        description: string;
        criteria_count: number;
    }>;
    /** Save (create or update) a recipe to disk and refresh the cache. */
    save(recipe: Recipe): void;
    /** Delete a recipe file and remove from cache. */
    delete(id: string): void;
    /** Invalidate a cached entry so next load re-reads from disk. */
    invalidate(id?: string): void;
    private validate;
}
//# sourceMappingURL=recipe-loader.d.ts.map
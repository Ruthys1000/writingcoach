// ============================================================
// WritingCoach — Recipe Loader
// Loads document-type "recipes" from YAML config files.
// Adding a new document type = adding a new YAML file.
// No code changes required.
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import type { Recipe } from '../types';

export class RecipeLoader {
  private recipesDir: string;
  private cache: Map<string, Recipe> = new Map();

  constructor(recipesDir?: string) {
    this.recipesDir =
      recipesDir ??
      process.env.RECIPES_DIR ??
      path.join(process.cwd(), 'recipes');
  }

  /** Load a recipe by its id (filename without .yaml). */
  load(id: string): Recipe {
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    const filePath = path.join(this.recipesDir, `${id}.yaml`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Recipe not found: ${filePath}`);
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    const recipe = yaml.load(raw) as Recipe;
    this.validate(recipe, filePath);
    this.cache.set(id, recipe);
    return recipe;
  }

  /** List all available recipe ids. */
  listAvailable(): Array<{ id: string; name: string; description: string }> {
    if (!fs.existsSync(this.recipesDir)) {
      throw new Error(`Recipes directory not found: ${this.recipesDir}`);
    }

    return fs
      .readdirSync(this.recipesDir)
      .filter((f) => f.endsWith('.yaml'))
      .map((f) => {
        const id = f.replace('.yaml', '');
        const recipe = this.load(id);
        return { id, name: recipe.name, description: recipe.description };
      });
  }

  /** Save (create or update) a recipe to disk and refresh the cache. */
  save(recipe: Recipe): void {
    this.validate(recipe, `<in-memory:${recipe.id}>`);
    const filePath = path.join(this.recipesDir, `${recipe.id}.yaml`);
    const yamlStr = yaml.dump(recipe, { lineWidth: 120 });
    fs.writeFileSync(filePath, yamlStr, 'utf8');
    this.cache.set(recipe.id, recipe);
  }

  /** Delete a recipe file and remove from cache. */
  delete(id: string): void {
    const filePath = path.join(this.recipesDir, `${id}.yaml`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    this.cache.delete(id);
  }

  /** Invalidate a cached entry so next load re-reads from disk. */
  invalidate(id?: string): void {
    if (id) this.cache.delete(id);
    else this.cache.clear();
  }

  private validate(recipe: Recipe, filePath: string): void {
    if (!recipe.id || !recipe.name || !recipe.criteria) {
      throw new Error(`Invalid recipe at ${filePath}: missing id, name, or criteria`);
    }
    for (const c of recipe.criteria) {
      if (!c.id || !c.question || !c.weight || !c.layer || !c.micro_lesson) {
        throw new Error(
          `Invalid criterion in ${filePath}: ${JSON.stringify(c)}`,
        );
      }
    }
  }
}

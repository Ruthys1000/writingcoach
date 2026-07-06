"use strict";
// ============================================================
// WritingCoach — Recipe Loader
// Loads document-type "recipes" from YAML config files.
// Adding a new document type = adding a new YAML file.
// No code changes required.
// ============================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipeLoader = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
class RecipeLoader {
    constructor(recipesDir) {
        this.cache = new Map();
        const dataDir = process.env.DATA_DIR;
        this.recipesDir =
            recipesDir ??
                process.env.RECIPES_DIR ??
                (dataDir ? path.join(dataDir, 'recipes') : path.join(process.cwd(), 'recipes'));
        // When DATA_DIR is configured (persistent volume), ensure the recipes dir
        // exists and seed it from the bundled defaults if it is empty.
        if (dataDir && !recipesDir && !process.env.RECIPES_DIR) {
            this.ensureDataDirRecipes();
        }
    }
    ensureDataDirRecipes() {
        if (!fs.existsSync(this.recipesDir)) {
            fs.mkdirSync(this.recipesDir, { recursive: true });
        }
        const hasRecipes = fs
            .readdirSync(this.recipesDir)
            .some((f) => f.endsWith('.yaml'));
        if (!hasRecipes) {
            const defaultDir = path.join(process.cwd(), 'default-recipes');
            if (fs.existsSync(defaultDir)) {
                for (const file of fs.readdirSync(defaultDir)) {
                    if (file.endsWith('.yaml')) {
                        fs.copyFileSync(path.join(defaultDir, file), path.join(this.recipesDir, file));
                    }
                }
                console.log(`[RecipeLoader] Seeded recipes from default-recipes/ into ${this.recipesDir}`);
            }
        }
    }
    /** Load a recipe by its id (filename without .yaml). */
    load(id) {
        if (this.cache.has(id)) {
            return this.cache.get(id);
        }
        const filePath = path.join(this.recipesDir, `${id}.yaml`);
        if (!fs.existsSync(filePath)) {
            throw new Error(`Recipe not found: ${filePath}`);
        }
        const raw = fs.readFileSync(filePath, 'utf8');
        const recipe = yaml.load(raw);
        this.validate(recipe, filePath);
        this.cache.set(id, recipe);
        return recipe;
    }
    /** List all available recipe ids. */
    listAvailable() {
        if (!fs.existsSync(this.recipesDir)) {
            throw new Error(`Recipes directory not found: ${this.recipesDir}`);
        }
        return fs
            .readdirSync(this.recipesDir)
            .filter((f) => f.endsWith('.yaml'))
            .map((f) => {
            const id = f.replace('.yaml', '');
            const recipe = this.load(id);
            return { id, name: recipe.name, description: recipe.description, criteria_count: recipe.criteria.length };
        });
    }
    /** Save (create or update) a recipe to disk and refresh the cache. */
    save(recipe) {
        this.validate(recipe, `<in-memory:${recipe.id}>`);
        const filePath = path.join(this.recipesDir, `${recipe.id}.yaml`);
        const yamlStr = yaml.dump(recipe, { lineWidth: 120 });
        fs.writeFileSync(filePath, yamlStr, 'utf8');
        this.cache.set(recipe.id, recipe);
    }
    /** Delete a recipe file and remove from cache. */
    delete(id) {
        const filePath = path.join(this.recipesDir, `${id}.yaml`);
        if (fs.existsSync(filePath))
            fs.unlinkSync(filePath);
        this.cache.delete(id);
    }
    /** Invalidate a cached entry so next load re-reads from disk. */
    invalidate(id) {
        if (id)
            this.cache.delete(id);
        else
            this.cache.clear();
    }
    validate(recipe, filePath) {
        if (!recipe.id || !recipe.name || !recipe.criteria) {
            throw new Error(`Invalid recipe at ${filePath}: missing id, name, or criteria`);
        }
        for (const c of recipe.criteria) {
            if (!c.id || !c.question || !c.weight || !c.layer || !c.micro_lesson) {
                throw new Error(`Invalid criterion in ${filePath}: ${JSON.stringify(c)}`);
            }
        }
        const totalWeight = recipe.criteria.reduce((sum, c) => sum + c.weight, 0);
        if (Math.abs(totalWeight - 1.0) > 0.01) {
            console.warn(`[RecipeLoader] Recipe "${recipe.id}" weights sum to ${totalWeight.toFixed(3)}, expected 1.0. Scores may be inaccurate.`);
        }
    }
}
exports.RecipeLoader = RecipeLoader;
//# sourceMappingURL=recipe-loader.js.map
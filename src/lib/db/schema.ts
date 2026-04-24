import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  smallint,
  boolean,
  timestamp,
  date,
  numeric,
  jsonb,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const sexEnum = pgEnum("sex", ["M", "F"]);
export const activityEnum = pgEnum("activity_level", [
  "sedentary",
  "light",
  "moderate",
  "heavy",
]);
export const mealTypeEnum = pgEnum("meal_type", ["breakfast", "snack", "lunch", "dinner"]);
export const unitEnum = pgEnum("unit", ["g", "ml", "un"]);
export const workoutModeEnum = pgEnum("workout_mode", ["indoor", "outdoor"]);
export const priceSourceEnum = pgEnum("price_source", ["scrape", "manual"]);
export const scrapeStatusEnum = pgEnum("scrape_status", ["ok", "partial", "failed"]);
export const shoppingStatusEnum = pgEnum("shopping_status", ["draft", "active", "done"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  sex: sexEnum("sex").notNull(),
  birthdate: date("birthdate").notNull(),
  heightCm: numeric("height_cm", { precision: 5, scale: 1 }).notNull(),
  activityLevel: activityEnum("activity_level").notNull(),
  targetWeightKg: numeric("target_weight_kg", { precision: 5, scale: 1 }).notNull(),
  deficitKcal: integer("deficit_kcal").notNull().default(300),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const weightLogs = pgTable(
  "weight_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    loggedOn: date("logged_on").notNull(),
    weightKg: numeric("weight_kg", { precision: 5, scale: 2 }).notNull(),
    note: text("note"),
  },
  (t) => ({
    userDayIdx: uniqueIndex("weight_user_day_idx").on(t.userId, t.loggedOn),
    userDateDesc: index("weight_user_date_desc_idx").on(t.userId, t.loggedOn),
  }),
);

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    continenteSku: text("continente_sku").unique(),
    continenteUrl: text("continente_url"),
    namePt: text("name_pt").notNull(),
    brand: text("brand"),
    category: text("category"),
    kcalPer100: numeric("kcal_per_100", { precision: 6, scale: 1 }),
    proteinG: numeric("protein_g", { precision: 5, scale: 2 }),
    carbsG: numeric("carbs_g", { precision: 5, scale: 2 }),
    fatG: numeric("fat_g", { precision: 5, scale: 2 }),
    fiberG: numeric("fiber_g", { precision: 5, scale: 2 }),
    unit: unitEnum("unit").notNull().default("g"),
    packSizeG: numeric("pack_size_g", { precision: 8, scale: 1 }),
    needsReview: boolean("needs_review").notNull().default(false),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  },
  (t) => ({
    nameIdx: index("products_name_idx").on(t.namePt),
    categoryIdx: index("products_category_idx").on(t.category),
  }),
);

export const productPrices = pgTable(
  "product_prices",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    priceEur: numeric("price_eur", { precision: 7, scale: 2 }).notNull(),
    pricePerKgEur: numeric("price_per_kg_eur", { precision: 7, scale: 2 }),
    promo: boolean("promo").notNull().default(false),
    scrapedAt: timestamp("scraped_at", { withTimezone: true }).defaultNow().notNull(),
    source: priceSourceEnum("source").notNull().default("scrape"),
  },
  (t) => ({
    productTimeIdx: index("prices_product_time_idx").on(t.productId, t.scrapedAt),
  }),
);

export const recipes = pgTable(
  "recipes",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    namePt: text("name_pt").notNull(),
    mealType: mealTypeEnum("meal_type").notNull(),
    servings: integer("servings").notNull().default(1),
    prepMin: integer("prep_min").notNull().default(15),
    instructionsMd: text("instructions_md").notNull(),
    tags: text("tags").array().notNull().default([] as unknown as string[]),
  },
  (t) => ({
    mealIdx: index("recipes_meal_idx").on(t.mealType),
  }),
);

export const recipeItems = pgTable(
  "recipe_items",
  {
    recipeId: integer("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    qtyG: numeric("qty_g", { precision: 8, scale: 2 }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.recipeId, t.productId] }),
  }),
);

export const mealPlan = pgTable(
  "meal_plan",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weekStart: date("week_start").notNull(),
    day: smallint("day").notNull(),
    mealType: mealTypeEnum("meal_type").notNull(),
    recipeId: integer("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "restrict" }),
    servings: numeric("servings", { precision: 4, scale: 2 }).notNull().default("1"),
  },
  (t) => ({
    userWeekIdx: index("mealplan_user_week_idx").on(t.userId, t.weekStart),
    slotUniq: uniqueIndex("mealplan_slot_uniq").on(
      t.userId,
      t.weekStart,
      t.day,
      t.mealType,
    ),
  }),
);

export const shoppingLists = pgTable("shopping_lists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  status: shoppingStatusEnum("status").notNull().default("draft"),
  totalEur: numeric("total_eur", { precision: 8, scale: 2 }),
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const shoppingItems = pgTable(
  "shopping_items",
  {
    id: serial("id").primaryKey(),
    listId: integer("list_id")
      .notNull()
      .references(() => shoppingLists.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    qtyG: numeric("qty_g", { precision: 10, scale: 2 }).notNull(),
    qtyUnits: numeric("qty_units", { precision: 6, scale: 2 }).notNull().default("1"),
    priceEur: numeric("price_eur", { precision: 8, scale: 2 }),
    checked: boolean("checked").notNull().default(false),
  },
  (t) => ({
    listIdx: index("shopitems_list_idx").on(t.listId),
  }),
);

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  namePt: text("name_pt").notNull(),
  mode: workoutModeEnum("mode").notNull(),
  durationMin: integer("duration_min").notNull().default(30),
  instructionsMd: text("instructions_md").notNull(),
  equipment: text("equipment").array().notNull().default([] as unknown as string[]),
});

export const workoutSchedule = pgTable(
  "workout_schedule",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dayOfWeek: smallint("day_of_week").notNull(),
    workoutId: integer("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "restrict" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.dayOfWeek] }),
  }),
);

export const scrapeRuns = pgTable("scrape_runs", {
  id: serial("id").primaryKey(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  status: scrapeStatusEnum("status").notNull().default("ok"),
  productsFound: integer("products_found").notNull().default(0),
  errors: jsonb("errors").$type<Array<{ sku: string; reason: string }>>(),
});

export const recipeRelations = relations(recipes, ({ many }) => ({
  items: many(recipeItems),
}));
export const recipeItemRelations = relations(recipeItems, ({ one }) => ({
  recipe: one(recipes, { fields: [recipeItems.recipeId], references: [recipes.id] }),
  product: one(products, { fields: [recipeItems.productId], references: [products.id] }),
}));
export const productRelations = relations(products, ({ many }) => ({
  prices: many(productPrices),
}));

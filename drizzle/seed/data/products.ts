export type SeedProduct = {
  sku: string;
  url: string;
  name: string;
  brand?: string;
  category: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  unit: "g" | "ml" | "un";
  packSizeG: number;
};

// Watchlist of ~60 SKUs Pedro actually buys at Continente.
// URLs are realistic patterns (https://www.continente.pt/produto/{slug}-{sku}.html);
// confirm after first scrape run.
export const SEED_PRODUCTS: SeedProduct[] = [
  // Proteínas
  { sku: "2143889", url: "peito-de-frango-fresco-continente-2143889.html", name: "Peito de Frango Fresco", brand: "Continente", category: "Proteína", kcal: 110, protein: 23, carbs: 0, fat: 1.5, unit: "g", packSizeG: 550 },
  { sku: "2249091", url: "coxa-frango-continente-2249091.html", name: "Coxa de Frango", brand: "Continente", category: "Proteína", kcal: 180, protein: 19, carbs: 0, fat: 11, unit: "g", packSizeG: 800 },
  { sku: "7071432", url: "carne-picada-bovino-continente-7071432.html", name: "Carne Picada Bovino 5%", brand: "Continente", category: "Proteína", kcal: 137, protein: 21, carbs: 0, fat: 5, unit: "g", packSizeG: 500 },
  { sku: "2055678", url: "lombo-porco-continente-2055678.html", name: "Lombo de Porco", brand: "Continente", category: "Proteína", kcal: 143, protein: 21, carbs: 0, fat: 6, unit: "g", packSizeG: 600 },
  { sku: "7088541", url: "lombos-pescada-congelada-pescanova-7088541.html", name: "Lombos de Pescada Congelados", brand: "Pescanova", category: "Proteína", kcal: 82, protein: 17, carbs: 0, fat: 1.5, unit: "g", packSizeG: 500 },
  { sku: "6543210", url: "salmao-fresco-continente-6543210.html", name: "Salmão Fresco Lombos", brand: "Continente", category: "Proteína", kcal: 206, protein: 22, carbs: 0, fat: 13, unit: "g", packSizeG: 400 },
  { sku: "5554321", url: "atum-agua-bom-petisco-5554321.html", name: "Atum em Água Posta", brand: "Bom Petisco", category: "Proteína", kcal: 112, protein: 25, carbs: 0, fat: 1, unit: "g", packSizeG: 120 },
  { sku: "2002002", url: "ovos-classe-m-10-continente-2002002.html", name: "Ovos Classe M (10 un)", brand: "Continente", category: "Proteína", kcal: 143, protein: 12.6, carbs: 0.7, fat: 9.9, unit: "un", packSizeG: 600 },
  { sku: "3210987", url: "queijo-flamengo-fatias-continente-3210987.html", name: "Queijo Flamengo Fatias", brand: "Continente", category: "Lacticínios", kcal: 340, protein: 26, carbs: 0.5, fat: 26, unit: "g", packSizeG: 200 },
  { sku: "3211111", url: "iogurte-grego-natural-continente-3211111.html", name: "Iogurte Grego Natural 0%", brand: "Continente", category: "Lacticínios", kcal: 58, protein: 10, carbs: 4, fat: 0.2, unit: "g", packSizeG: 500 },
  { sku: "3212222", url: "leite-magro-mimosa-3212222.html", name: "Leite Magro 1L", brand: "Mimosa", category: "Lacticínios", kcal: 35, protein: 3.2, carbs: 4.8, fat: 0.1, unit: "ml", packSizeG: 1000 },
  { sku: "3213333", url: "queijo-fresco-light-continente-3213333.html", name: "Queijo Fresco Light", brand: "Continente", category: "Lacticínios", kcal: 90, protein: 13, carbs: 2, fat: 3, unit: "g", packSizeG: 125 },
  { sku: "3214444", url: "whey-isolado-prozis-3214444.html", name: "Whey Isolado Baunilha", brand: "Prozis", category: "Proteína", kcal: 377, protein: 86, carbs: 3, fat: 1.5, unit: "g", packSizeG: 1000 },

  // Hidratos
  { sku: "4001001", url: "arroz-basmati-continente-4001001.html", name: "Arroz Basmati", brand: "Continente", category: "Hidratos", kcal: 355, protein: 8, carbs: 78, fat: 1, unit: "g", packSizeG: 1000 },
  { sku: "4001002", url: "arroz-agulha-continente-4001002.html", name: "Arroz Agulha", brand: "Continente", category: "Hidratos", kcal: 350, protein: 7, carbs: 79, fat: 0.6, unit: "g", packSizeG: 1000 },
  { sku: "4001003", url: "massa-esparguete-milaneza-4001003.html", name: "Esparguete", brand: "Milaneza", category: "Hidratos", kcal: 353, protein: 12, carbs: 72, fat: 1.5, unit: "g", packSizeG: 500 },
  { sku: "4001004", url: "massa-fusilli-integral-continente-4001004.html", name: "Fusilli Integral", brand: "Continente", category: "Hidratos", kcal: 335, protein: 13, carbs: 61, fat: 2.5, unit: "g", packSizeG: 500 },
  { sku: "4001005", url: "batata-saco-continente-4001005.html", name: "Batata Branca", brand: "Continente", category: "Hidratos", kcal: 77, protein: 2, carbs: 17, fat: 0.1, unit: "g", packSizeG: 2500 },
  { sku: "4001006", url: "batata-doce-continente-4001006.html", name: "Batata Doce", brand: "Continente", category: "Hidratos", kcal: 86, protein: 1.6, carbs: 20, fat: 0.1, unit: "g", packSizeG: 1000 },
  { sku: "4001007", url: "pao-integral-continente-4001007.html", name: "Pão de Forma Integral", brand: "Continente", category: "Hidratos", kcal: 240, protein: 11, carbs: 40, fat: 3, unit: "g", packSizeG: 500 },
  { sku: "4001008", url: "aveia-flocos-continente-4001008.html", name: "Flocos de Aveia", brand: "Continente", category: "Hidratos", kcal: 370, protein: 13, carbs: 60, fat: 7, unit: "g", packSizeG: 500 },
  { sku: "4001009", url: "wrap-integral-continente-4001009.html", name: "Wrap Integral", brand: "Continente", category: "Hidratos", kcal: 295, protein: 9, carbs: 52, fat: 6, unit: "un", packSizeG: 320 },
  { sku: "4001010", url: "tortilhas-milho-old-el-paso-4001010.html", name: "Tortilhas de Milho", brand: "Old El Paso", category: "Hidratos", kcal: 310, protein: 8, carbs: 55, fat: 6, unit: "un", packSizeG: 326 },

  // Legumes
  { sku: "5001001", url: "brocolos-continente-5001001.html", name: "Brócolos", brand: "Continente", category: "Legumes", kcal: 35, protein: 2.8, carbs: 4, fat: 0.4, unit: "g", packSizeG: 500 },
  { sku: "5001002", url: "espinafres-congelados-iglo-5001002.html", name: "Espinafres Congelados", brand: "Iglo", category: "Legumes", kcal: 23, protein: 2.9, carbs: 1, fat: 0.4, unit: "g", packSizeG: 750 },
  { sku: "5001003", url: "feijao-verde-congelado-continente-5001003.html", name: "Feijão Verde Congelado", brand: "Continente", category: "Legumes", kcal: 31, protein: 2, carbs: 5, fat: 0.2, unit: "g", packSizeG: 1000 },
  { sku: "5001004", url: "cenoura-continente-5001004.html", name: "Cenoura", brand: "Continente", category: "Legumes", kcal: 41, protein: 0.9, carbs: 8, fat: 0.2, unit: "g", packSizeG: 1000 },
  { sku: "5001005", url: "cebola-continente-5001005.html", name: "Cebola", brand: "Continente", category: "Legumes", kcal: 40, protein: 1.1, carbs: 9, fat: 0.1, unit: "g", packSizeG: 1000 },
  { sku: "5001006", url: "alho-continente-5001006.html", name: "Alho", brand: "Continente", category: "Legumes", kcal: 149, protein: 6, carbs: 33, fat: 0.5, unit: "g", packSizeG: 200 },
  { sku: "5001007", url: "tomate-continente-5001007.html", name: "Tomate Maduro", brand: "Continente", category: "Legumes", kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, unit: "g", packSizeG: 1000 },
  { sku: "5001008", url: "alface-continente-5001008.html", name: "Alface", brand: "Continente", category: "Legumes", kcal: 15, protein: 1.4, carbs: 2.9, fat: 0.2, unit: "g", packSizeG: 300 },
  { sku: "5001009", url: "pepino-continente-5001009.html", name: "Pepino", brand: "Continente", category: "Legumes", kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1, unit: "un", packSizeG: 400 },
  { sku: "5001010", url: "pimento-vermelho-continente-5001010.html", name: "Pimento Vermelho", brand: "Continente", category: "Legumes", kcal: 31, protein: 1, carbs: 6, fat: 0.3, unit: "g", packSizeG: 500 },
  { sku: "5001011", url: "courgette-continente-5001011.html", name: "Courgette", brand: "Continente", category: "Legumes", kcal: 17, protein: 1.2, carbs: 3.1, fat: 0.3, unit: "g", packSizeG: 500 },
  { sku: "5001012", url: "cogumelos-frescos-continente-5001012.html", name: "Cogumelos Brancos", brand: "Continente", category: "Legumes", kcal: 22, protein: 3.1, carbs: 3.3, fat: 0.3, unit: "g", packSizeG: 300 },
  { sku: "5001013", url: "tomate-pelado-guloso-5001013.html", name: "Tomate Pelado Lata", brand: "Guloso", category: "Legumes", kcal: 28, protein: 1.3, carbs: 4.9, fat: 0.2, unit: "g", packSizeG: 800 },

  // Leguminosas
  { sku: "6001001", url: "grao-bico-cozido-continente-6001001.html", name: "Grão-de-Bico Cozido", brand: "Continente", category: "Leguminosas", kcal: 119, protein: 8, carbs: 17, fat: 2, unit: "g", packSizeG: 800 },
  { sku: "6001002", url: "feijao-preto-cozido-continente-6001002.html", name: "Feijão Preto Cozido", brand: "Continente", category: "Leguminosas", kcal: 116, protein: 7.5, carbs: 16, fat: 1, unit: "g", packSizeG: 800 },
  { sku: "6001003", url: "lentilhas-cozidas-continente-6001003.html", name: "Lentilhas Cozidas", brand: "Continente", category: "Leguminosas", kcal: 103, protein: 7.5, carbs: 14, fat: 0.5, unit: "g", packSizeG: 800 },

  // Frutas
  { sku: "7001001", url: "banana-continente-7001001.html", name: "Banana", brand: "Continente", category: "Fruta", kcal: 89, protein: 1.1, carbs: 23, fat: 0.3, unit: "g", packSizeG: 1000 },
  { sku: "7001002", url: "maca-continente-7001002.html", name: "Maçã", brand: "Continente", category: "Fruta", kcal: 52, protein: 0.3, carbs: 14, fat: 0.2, unit: "g", packSizeG: 1000 },
  { sku: "7001003", url: "laranja-continente-7001003.html", name: "Laranja", brand: "Continente", category: "Fruta", kcal: 47, protein: 0.9, carbs: 12, fat: 0.1, unit: "g", packSizeG: 2000 },
  { sku: "7001004", url: "morangos-continente-7001004.html", name: "Morangos", brand: "Continente", category: "Fruta", kcal: 32, protein: 0.7, carbs: 8, fat: 0.3, unit: "g", packSizeG: 500 },
  { sku: "7001005", url: "frutos-vermelhos-congelados-continente-7001005.html", name: "Frutos Vermelhos Congelados", brand: "Continente", category: "Fruta", kcal: 43, protein: 0.8, carbs: 9, fat: 0.3, unit: "g", packSizeG: 500 },

  // Gorduras
  { sku: "8001001", url: "azeite-virgem-gallo-8001001.html", name: "Azeite Virgem Extra", brand: "Gallo", category: "Gorduras", kcal: 825, protein: 0, carbs: 0, fat: 91, unit: "ml", packSizeG: 1000 },
  { sku: "8001002", url: "manteiga-amendoim-continente-8001002.html", name: "Manteiga de Amendoim", brand: "Continente", category: "Gorduras", kcal: 600, protein: 25, carbs: 15, fat: 50, unit: "g", packSizeG: 350 },
  { sku: "8001003", url: "amendoas-continente-8001003.html", name: "Amêndoas", brand: "Continente", category: "Gorduras", kcal: 579, protein: 21, carbs: 22, fat: 50, unit: "g", packSizeG: 200 },
  { sku: "8001004", url: "nozes-continente-8001004.html", name: "Nozes", brand: "Continente", category: "Gorduras", kcal: 654, protein: 15, carbs: 14, fat: 65, unit: "g", packSizeG: 200 },
  { sku: "8001005", url: "abacate-continente-8001005.html", name: "Abacate", brand: "Continente", category: "Gorduras", kcal: 160, protein: 2, carbs: 9, fat: 15, unit: "un", packSizeG: 400 },

  // Temperos / básicos
  { sku: "9001001", url: "sal-fino-continente-9001001.html", name: "Sal Fino", brand: "Continente", category: "Tempero", kcal: 0, protein: 0, carbs: 0, fat: 0, unit: "g", packSizeG: 1000 },
  { sku: "9001002", url: "pimenta-preta-moida-continente-9001002.html", name: "Pimenta Preta", brand: "Continente", category: "Tempero", kcal: 255, protein: 10, carbs: 64, fat: 3, unit: "g", packSizeG: 50 },
  { sku: "9001003", url: "piripiri-continente-9001003.html", name: "Piripiri", brand: "Continente", category: "Tempero", kcal: 282, protein: 12, carbs: 57, fat: 17, unit: "g", packSizeG: 50 },
  { sku: "9001004", url: "oregaos-continente-9001004.html", name: "Orégãos", brand: "Continente", category: "Tempero", kcal: 265, protein: 9, carbs: 69, fat: 4, unit: "g", packSizeG: 20 },
  { sku: "9001005", url: "caldo-legumes-knorr-9001005.html", name: "Caldo de Legumes", brand: "Knorr", category: "Tempero", kcal: 210, protein: 7, carbs: 13, fat: 15, unit: "g", packSizeG: 80 },
  { sku: "9001006", url: "limao-continente-9001006.html", name: "Limão", brand: "Continente", category: "Fruta", kcal: 29, protein: 1.1, carbs: 9, fat: 0.3, unit: "g", packSizeG: 500 },
];

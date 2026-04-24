export type SeedWorkout = {
  slug: string;
  name: string;
  mode: "indoor" | "outdoor";
  durationMin: number;
  instructions: string;
  equipment?: string[];
};

export const SEED_WORKOUTS: SeedWorkout[] = [
  // INDOOR — bodyweight, sala de estar
  {
    slug: "indoor-push",
    name: "Empurrar (Peito + Ombros + Tricep)",
    mode: "indoor",
    durationMin: 30,
    instructions: `**Aquecimento (4 min)**
- 2 min marcha no sítio
- 20 rotações braços à frente + 20 atrás
- 10 inclinações laterais

**Circuito — 4 rondas (22 min)**
1. Flexões normais — 10 reps
2. Flexões pica — 8 reps
3. Dips em cadeira — 12 reps
4. Elevações laterais com garrafas (1 kg) — 15 reps
5. Prancha — 30 s

Descanso 60 s entre rondas.

**Alongamento (4 min)**: peito na ombreira, tricep, ombros.`,
    equipment: ["cadeira", "2 garrafas de água 1 kg"],
  },
  {
    slug: "indoor-pull-core",
    name: "Puxar + Core",
    mode: "indoor",
    durationMin: 30,
    instructions: `**Aquecimento (4 min)**: cat-cow, superman, rotações tronco.

**Circuito — 4 rondas (22 min)**
1. Remada invertida debaixo da mesa — 10 reps
2. Superman — 12 reps
3. Reverse fly com garrafas — 15 reps
4. Good mornings — 15 reps
5. Prancha lateral — 30 s cada lado

**Finisher (3 min)**: abdominais rotativos 3×20.

**Alongamento (1 min)**: criança, cobra.`,
    equipment: ["mesa resistente", "2 garrafas 1 kg"],
  },
  {
    slug: "indoor-legs",
    name: "Pernas + Glúteos",
    mode: "indoor",
    durationMin: 30,
    instructions: `**Aquecimento (5 min)**: elevações joelhos, rotações ancas.

**Circuito — 4 rondas (20 min)**
1. Agachamento livre — 20 reps
2. Afundos alternados — 10 cada perna
3. Elevação pélvica (glute bridge) — 15 reps
4. Agachamento búlgaro em cadeira — 8 cada perna
5. Calf raises — 20 reps

Descanso 45 s entre rondas.

**Alongamento (5 min)**: quadríceps, isquios, glúteos.`,
    equipment: ["cadeira"],
  },
  {
    slug: "indoor-hiit-fullbody",
    name: "HIIT Corpo Inteiro",
    mode: "indoor",
    durationMin: 30,
    instructions: `**Aquecimento (4 min)**: jumping jacks suaves, rotações.

**Tabata ×4 blocos (20 min)**
Cada bloco = 8 ciclos de 20 s ON / 10 s OFF:
- Bloco 1: burpees
- Bloco 2: mountain climbers
- Bloco 3: agachamento com salto
- Bloco 4: flexões (joelhos se precisar)

1 min descanso entre blocos.

**Alongamento (6 min)** completo.`,
  },
  {
    slug: "indoor-core-mobility",
    name: "Core + Mobilidade",
    mode: "indoor",
    durationMin: 30,
    instructions: `**Core (15 min) — 3 rondas**
1. Prancha frontal — 40 s
2. Prancha lateral — 30 s cada lado
3. Dead bug — 12 reps
4. Bicicleta — 20 reps
5. Hollow hold — 20 s

**Mobilidade (15 min)**: sequência yoga cat-cow, criança, cobra, cão olhando para baixo, afundo baixo com rotação, pombo. 1 min cada posição.`,
  },
  {
    slug: "indoor-fullbody-emom",
    name: "EMOM Corpo Inteiro 25 min",
    mode: "indoor",
    durationMin: 30,
    instructions: `**Aquecimento (3 min)**

**EMOM 25 min** (cada minuto on the minute):
- Min ímpares: 12 agachamentos + 8 flexões
- Min pares: 10 burpees

Se acabar antes do minuto → descanso restante.

**Alongamento (2 min)**.`,
  },
  {
    slug: "indoor-recovery",
    name: "Recuperação Activa (sala)",
    mode: "indoor",
    durationMin: 30,
    instructions: `Sequência lenta, respiração profunda.

**Mobilidade (30 min)**
- 3 min cat-cow
- 3 min afundos com rotação
- 3 min cão olhando para baixo ↔ prancha
- 3 min pombo cada lado
- 3 min postura criança
- 3 min abertura peito com braços no chão
- 3 min ancas (butterfly, happy baby)
- 3 min isquios sentado
- 3 min respiração diafragmática`,
  },

  // OUTDOOR — parque / rua
  {
    slug: "outdoor-easy-zone2",
    name: "Corrida Fácil Zona 2 (30 min)",
    mode: "outdoor",
    durationMin: 30,
    instructions: `**Aquecimento (5 min)**: caminhada rápida + 4 acelerações curtas.

**Corrida contínua (22 min)**: ritmo de conversa, nariz tapado deve ser possível; FC ~60-70%.

**Retorno à calma (3 min)**: caminhada.`,
  },
  {
    slug: "outdoor-intervals",
    name: "Intervalos 1:1 (400 m)",
    mode: "outdoor",
    durationMin: 30,
    instructions: `**Aquecimento (8 min)**: trote leve + mobilidade.

**Série principal**
- 8 × (400 m rápido / 400 m trote lento)
- Objectivo: ritmo "forte mas sustentado"

**Retorno (5 min)**: caminhada.`,
  },
  {
    slug: "outdoor-fartlek",
    name: "Fartlek 30 min",
    mode: "outdoor",
    durationMin: 30,
    instructions: `**Aquecimento (6 min)**: trote.

**Fartlek (20 min)**:
- 2 min forte / 2 min suave × 5 repetições
- Escolher referências do parque (árvore até fonte, etc.)

**Retorno (4 min)**: caminhada.`,
  },
  {
    slug: "outdoor-hills",
    name: "Subidas Curtas",
    mode: "outdoor",
    durationMin: 30,
    instructions: `**Aquecimento (8 min)**: trote.

**Subidas**: encontrar rampa 60-80 m.
- 10 × sprint a subir (85-90%) + recuperação a descer a caminhar
- 45 s extra de descanso entre.

**Retorno (5 min)**: caminhada.`,
  },
  {
    slug: "outdoor-walk-run",
    name: "Caminhada + Corrida",
    mode: "outdoor",
    durationMin: 30,
    instructions: `**Aquecimento (3 min)**: caminhada rápida.

**Principal (24 min)**:
- 2 min corrida / 2 min caminhada × 6 ciclos.

**Retorno (3 min)**: caminhada lenta.

Boa opção para dias cansados.`,
  },
  {
    slug: "outdoor-tempo",
    name: "Corrida Tempo",
    mode: "outdoor",
    durationMin: 30,
    instructions: `**Aquecimento (8 min)**: trote + 4 acelerações 50 m.

**Tempo (18 min)**:
- 2×8 min a ritmo "confortavelmente duro" (FC ~80-85%)
- 2 min trote entre blocos.

**Retorno (4 min)**: caminhada.`,
  },
  {
    slug: "outdoor-long-easy",
    name: "Longa Fácil 30 min",
    mode: "outdoor",
    durationMin: 30,
    instructions: `**Aquecimento (3 min)**: caminhada rápida.

**Corrida fácil (25 min)**: ritmo muito confortável, FC baixa, manter conversa.

**Retorno (2 min)**.

Acumular quilometragem sem stress.`,
  },
];

export const DEFAULT_SCHEDULE: { day: number; slug: string }[] = [
  { day: 0, slug: "indoor-push" },
  { day: 1, slug: "outdoor-easy-zone2" },
  { day: 2, slug: "indoor-legs" },
  { day: 3, slug: "outdoor-intervals" },
  { day: 4, slug: "indoor-core-mobility" },
  { day: 5, slug: "outdoor-long-easy" },
  { day: 6, slug: "indoor-recovery" },
];

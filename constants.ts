import { Character } from './types';

// NOTE: This data is used as a fallback or for initial loading.
// For the live app, ensure you run 'dummy_data_seed.sql.txt' in Supabase
// to populate the database with these exact values.

export const INITIAL_CHARACTERS: Character[] = [
  {
    id: 'c1',
    name: "Imperator Valerius Thorne",
    role: "Supreme Leader",
    description: "Pemimpin absolut The Obsidian Order. Dikabarkan telah hidup selama 500 tahun berkat darah naga yang mengalir di tubuhnya. Marga Thorne memegang kendali penuh atas ibukota.",
    imageUrl: "https://placehold.co/600x800/2a0a10/FFF?text=Valerius+Thorne",
    votes: 1250,
    themeColor: "from-red-600 to-rose-950",
    familyName: "The Obsidian Order",
    familyIcon: "crown",
    activeEffect: "fire"
  },
  {
    id: 'c2',
    name: "General Marcus Steel",
    role: "Grand Marshal",
    description: "Ahli strategi perang yang tidak pernah kalah dalam pertempuran. Marga Steel dikenal sebagai penempa senjata legendaris yang dapat membelah langit.",
    imageUrl: "https://placehold.co/600x800/1e293b/FFF?text=Marcus+Steel",
    votes: 980,
    themeColor: "from-slate-500 to-slate-900",
    familyName: "The Obsidian Order",
    familyIcon: "sword",
    activeEffect: "none"
  },
  {
    id: 'c3',
    name: "Lady Isabella Vane",
    role: "Spymaster",
    description: "Wanita misterius yang mengendalikan jaringan informasi bawah tanah. Marga Vane memiliki kemampuan leluhur untuk memanipulasi bayangan.",
    imageUrl: "https://placehold.co/600x800/4c1d95/FFF?text=Isabella+Vane",
    votes: 1120,
    themeColor: "from-violet-600 to-purple-950",
    familyName: "The Obsidian Order",
    familyIcon: "ghost",
    activeEffect: "shadow"
  },
  {
    id: 'c4',
    name: "Archmage Solonius Light",
    role: "High Arcanist",
    description: "Penyihir agung yang menjaga keseimbangan energi sihir kerajaan. Marga Light adalah satu-satunya keturunan yang bisa menyentuh Kristal Inti tanpa terbakar.",
    imageUrl: "https://placehold.co/600x800/fbbf24/FFF?text=Solonius+Light",
    votes: 890,
    themeColor: "from-amber-400 to-yellow-700",
    familyName: "The Obsidian Order",
    familyIcon: "zap",
    activeEffect: "lightning"
  },
  {
    id: 'c5',
    name: "Duchess Elara Moon",
    role: "Diplomat",
    description: "Wajah publik dari Order yang mempesona namun mematikan. Marga Moon memiliki koneksi spiritual dengan pasang surut lautan dan emosi manusia.",
    imageUrl: "https://placehold.co/600x800/0ea5e9/FFF?text=Elara+Moon",
    votes: 1050,
    themeColor: "from-sky-400 to-blue-900",
    familyName: "The Obsidian Order",
    familyIcon: "star",
    activeEffect: "none"
  }
];
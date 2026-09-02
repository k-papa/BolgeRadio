import type { LucideIcon } from "lucide-react";
import {
  Antenna,
  AudioLines,
  Building2,
  CloudRain,
  Coffee,
  Disc3,
  Flame,
  Flower2,
  Globe,
  Guitar,
  Headphones,
  Heart,
  Landmark,
  Leaf,
  Mic,
  Moon,
  Mountain,
  Music,
  TreePalm,
  Piano,
  Podcast,
  Radio,
  Rss,
  Sailboat,
  Star,
  Sun,
  Volume2,
  Waves,
  Wind,
  Zap,
} from "lucide-react";

export const ICONS = {
  radio: Radio,
  antenna: Antenna,
  waves: Waves,
  music: Music,
  headphones: Headphones,
  mic: Mic,
  disc: Disc3,
  podcast: Podcast,
  audio: AudioLines,
  volume: Volume2,
  rss: Rss,
  heart: Heart,
  star: Star,
  sun: Sun,
  moon: Moon,
  flame: Flame,
  zap: Zap,
  coffee: Coffee,
  globe: Globe,
  palmtree: TreePalm,
  mountain: Mountain,
  sailboat: Sailboat,
  building: Building2,
  landmark: Landmark,
  rain: CloudRain,
  wind: Wind,
  leaf: Leaf,
  flower: Flower2,
  guitar: Guitar,
  piano: Piano,
} as const satisfies Record<string, LucideIcon>;

export type IconKey = keyof typeof ICONS;

export const ICON_KEYS = Object.keys(ICONS) as IconKey[];

export const TINTS = [
  "ink",
  "steel",
  "ocean",
  "forest",
  "wine",
  "clay",
  "dusk",
  "fog",
] as const;

export type TintKey = (typeof TINTS)[number];

export type Station = {
  id: string;
  name: string;
  url: string;
  icon: IconKey;
  tint: TintKey;
};

export const PRESET_STATIONS: Station[] = [
  {
    id: "preset-p3",
    name: "DR P3",
    url: "https://live-icy.dr.dk/A/A05H.mp3",
    icon: "radio",
    tint: "wine",
  },
  {
    id: "preset-p1",
    name: "DR P1",
    url: "https://live-icy.dr.dk/A/A03H.mp3",
    icon: "mic",
    tint: "ink",
  },
  {
    id: "preset-p8",
    name: "DR P8 Jazz",
    url: "https://live-icy.dr.dk/A/A22H.mp3",
    icon: "piano",
    tint: "dusk",
  },
  {
    id: "preset-nova",
    name: "Nova",
    url: "https://live-bauerdk.sharp-stream.com/nova_dk_mp3",
    icon: "zap",
    tint: "clay",
  },
  {
    id: "preset-voice",
    name: "The Voice",
    url: "https://live-bauerdk.sharp-stream.com/thevoice_dk_mp3",
    icon: "headphones",
    tint: "ocean",
  },
  {
    id: "preset-fip",
    name: "FIP",
    url: "https://icecast.radiofrance.fr/fip-midfi.mp3",
    icon: "globe",
    tint: "forest",
  },
  {
    id: "preset-paradise",
    name: "Radio Paradise",
    url: "https://stream.radioparadise.com/aac-320",
    icon: "sun",
    tint: "steel",
  },
  {
    id: "preset-soma",
    name: "Groove Salad",
    url: "https://ice4.somafm.com/groovesalad-128-mp3",
    icon: "leaf",
    tint: "fog",
  },
];

export const TINT_BG: Record<TintKey, string> = {
  ink: "bg-tint-ink",
  steel: "bg-tint-steel",
  ocean: "bg-tint-ocean",
  forest: "bg-tint-forest",
  wine: "bg-tint-wine",
  clay: "bg-tint-clay",
  dusk: "bg-tint-dusk",
  fog: "bg-tint-fog",
};


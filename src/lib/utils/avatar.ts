export const AVATAR_BG_CLASSES = [
  'bg-rose-700',
  'bg-orange-700',
  'bg-amber-700',
  'bg-lime-700',
  'bg-emerald-700',
  'bg-teal-700',
  'bg-cyan-700',
  'bg-sky-700',
  'bg-blue-700',
  'bg-indigo-700',
  'bg-violet-700',
  'bg-fuchsia-700',
  'bg-pink-700'
] as const;

const toSeed = (value: string | null | undefined) => (value ?? '').trim().toLowerCase();

const hashSeed = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
};

export const getAvatarBgClass = (seedLike: string | null | undefined) => {
  const seed = toSeed(seedLike);
  if (!seed) return AVATAR_BG_CLASSES[0];
  const index = hashSeed(seed) % AVATAR_BG_CLASSES.length;
  return AVATAR_BG_CLASSES[index];
};

export const getRandomAvatarBgClass = () => {
  const index = Math.floor(Math.random() * AVATAR_BG_CLASSES.length);
  return AVATAR_BG_CLASSES[index];
};

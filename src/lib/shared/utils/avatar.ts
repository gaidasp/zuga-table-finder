export const AVATAR_BG_CLASSES = [
  'bg-rose-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-lime-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-sky-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-fuchsia-500',
  'bg-pink-500'
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

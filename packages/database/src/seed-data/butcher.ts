import type { ButcherKind } from './products';

/** Butcher option sets per meat kind. `group` maps to ButcherGroup in @oasisa2/types. */
export interface SeedButcherOption {
  group: 'cut' | 'pieceSize' | 'bone' | 'thickness' | 'skin' | 'fat';
  value: string;
  label: string;
  isDefault?: boolean;
}

const PIECE_SIZE: SeedButcherOption[] = [
  { group: 'pieceSize', value: 'whole', label: 'Whole' },
  { group: 'pieceSize', value: 'curry_cut', label: 'Curry Cut', isDefault: true },
  { group: 'pieceSize', value: 'small_pieces', label: 'Small Pieces' },
  { group: 'pieceSize', value: 'medium_pieces', label: 'Medium Pieces' },
  { group: 'pieceSize', value: 'large_pieces', label: 'Large Pieces' },
];
const BONE: SeedButcherOption[] = [
  { group: 'bone', value: 'bone_in', label: 'Bone-In', isDefault: true },
  { group: 'bone', value: 'boneless', label: 'Boneless' },
];
const THICKNESS: SeedButcherOption[] = [
  { group: 'thickness', value: 'thin_cut', label: 'Thin Cut' },
  { group: 'thickness', value: 'thick_cut', label: 'Thick Cut' },
];
const SKIN: SeedButcherOption[] = [
  { group: 'skin', value: 'skin_on', label: 'Skin On' },
  { group: 'skin', value: 'skin_off', label: 'Skin Off', isDefault: true },
];
const FAT: SeedButcherOption[] = [{ group: 'fat', value: 'fat_trimmed', label: 'Fat Trimmed' }];

export const BUTCHER_OPTIONS_BY_KIND: Record<ButcherKind, SeedButcherOption[]> = {
  beef: [...PIECE_SIZE, ...BONE, ...THICKNESS, ...FAT],
  goat: [...PIECE_SIZE, ...BONE, ...FAT],
  lamb: [...PIECE_SIZE, ...BONE, ...THICKNESS, ...FAT],
  chicken: [...PIECE_SIZE, ...BONE, ...SKIN],
};

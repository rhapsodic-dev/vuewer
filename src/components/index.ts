export interface VuewerImageObject {
  url: string;
  thumbUrl?: string;
}

export type VuewerImage = string | VuewerImageObject;

export interface VuewerProps {
  images: VuewerImage[];
  defaultIndex?: number;
}

export interface VuewerEmits {
  close: [void];
  select: [index: number];
}

export interface BeyFile {
  path: string;
  name: string;
  type: 'model' | 'texture';
  category: string;
  subcategory?: string;
}

export interface BeyManifest {
  stats: {
    totalFiles: number;
    models: number;
    textures: number;
  };
  categories: string[];
  models: BeyFile[];
  textures: BeyFile[];
}

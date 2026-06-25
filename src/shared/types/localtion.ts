export interface District {
  id: string;
  name: string;
  region?: Region | null;
}

export interface Region {
  id: string;
  name: string;
}

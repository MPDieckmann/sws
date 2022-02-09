type PickByType<Target, Type> = {
  [p in keyof Target as Target[p] extends Type ? p : never]: Target[p];
};

export const addHours = (date: Date, hours: number) => {
  const copy = new Date(date.getTime());
  copy.setHours(copy.getHours() + hours);
  return copy;
};

export const now = () => new Date();

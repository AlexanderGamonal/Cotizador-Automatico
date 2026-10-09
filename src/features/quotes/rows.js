let nextRowId = 1;

export const newRow = (partial = {}) => ({
  id: nextRowId++,
  name: '',
  costWithIGV: '',
  margin: '',
  qty: '1',
  ...partial,
});

export const emptyClient = { cliente: '', ruc: '', whatsapp: '' };

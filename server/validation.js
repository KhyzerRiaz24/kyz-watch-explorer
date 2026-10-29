export function validateWatch(body, id) {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    throw new Error('A watch object is required.');
  const text = (value, label, max = 160) => {
    if (typeof value !== 'string' || !value.trim() || value.trim().length > max)
      throw new Error(`${label} must contain 1–${max} characters.`);
    return value.trim();
  };
  const numeric = (value, label, max) => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > max)
      throw new Error(`${label} must be a positive number up to ${max}.`);
    return value;
  };
  const name = text(body.name, 'Name');
  const details = body.details;
  if (!details || typeof details !== 'object') throw new Error('Technical details are required.');
  const image = text(body.image, 'Image', 1000);
  if (
    !/^\/images\/[a-zA-Z0-9._-]+\.(jpg|jpeg|png|webp|svg)$/.test(image) &&
    !/^https:\/\/[a-zA-Z0-9.-]+(?::\d+)?\//.test(image)
  )
    throw new Error('Image must be a local /images/ asset or a full HTTPS image URL.');
  if (!Array.isArray(body.features) || body.features.length > 12)
    throw new Error('Provide up to 12 features.');
  if (!['Sport', 'Dress', 'Diving', 'Travel'].includes(body.style))
    throw new Error('Choose a supported watch style.');
  return {
    id,
    name,
    brand: text(body.brand, 'Brand'),
    collection: text(body.collection, 'Collection'),
    style: body.style,
    price: numeric(body.price, 'Price', 10000000),
    currency: 'USD',
    image,
    description: text(body.description, 'Description', 1200),
    features: body.features.map((f) => text(f, 'Feature', 100)),
    diameterMm: numeric(body.diameterMm, 'Diameter', 100),
    waterResistanceM: numeric(body.waterResistanceM, 'Water resistance', 20000),
    powerReserveH: numeric(body.powerReserveH, 'Power reserve', 1000),
    details: Object.fromEntries(
      ['reference', 'movement', 'case', 'diameter', 'waterResistance', 'powerReserve'].map(
        (key) => [key, text(details[key], key)],
      ),
    ),
    featured: body.featured === true,
  };
}

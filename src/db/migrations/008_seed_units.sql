BEGIN;

INSERT INTO units (
    name_en,
    name_hi,
    short_name,
    type
)
VALUES
    ('Piece', 'पीस', 'pcs', 'quantity'),
    ('Kilogram', 'किलोग्राम', 'kg', 'weight'),
    ('Gram', 'ग्राम', 'gm', 'weight'),
    ('Bag', 'बोरी', 'bag', 'quantity'),
    ('Litre', 'लीटर', 'L', 'volume'),
    ('Millilitre', 'मिलीलीटर', 'ml', 'volume'),
    ('Metre', 'मीटर', 'm', 'length'),
    ('Centimetre', 'सेंटीमीटर', 'cm', 'length'),
    ('Foot', 'फुट', 'ft', 'length'),
    ('Inch', 'इंच', 'in', 'length'),
    ('Bundle', 'बंडल', 'bundle', 'quantity'),
    ('Packet', 'पैकेट', 'pkt', 'quantity'),
    ('Carton', 'कार्टन', 'carton', 'quantity'),
    ('Set', 'सेट', 'set', 'quantity'),
    ('Pair', 'जोड़ी', 'pair', 'quantity'),
    ('Dozen', 'दर्जन', 'dozen', 'quantity'),
    ('Cubic Foot', 'घन फुट', 'cft', 'volume'),
    ('Square Foot', 'वर्ग फुट', 'sqft', 'area'),
    ('Square Metre', 'वर्ग मीटर', 'sqm', 'area'),
    ('Ton', 'टन', 'ton', 'weight')
ON CONFLICT DO NOTHING;

COMMIT;
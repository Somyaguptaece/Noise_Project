import { tokenize, TFIDFIndex } from '../src/utils/tfidf.js';

describe('TF-IDF Retrieval Engine', () => {
  const sampleDocs = [
    {
      id: 'POL-RET-01',
      text: '7-Day Return and Replacement Policy. Returns accepted within 7 calendar days from verified delivery date.',
      metadata: { category: 'RETURN', title: 'Return Policy' }
    },
    {
      id: 'POL-WAR-01',
      text: '1-Year Limited Manufacturing Warranty Coverage for hardware failure, touch screen defects, charging port failure.',
      metadata: { category: 'WARRANTY', title: 'Warranty Policy' }
    },
    {
      id: 'KB-BAT-01',
      text: 'Smartwatch battery drain and charging troubleshooting. Use 5V/1A charger, avoid fast charger, adjust continuous heart rate.',
      metadata: { category: 'TROUBLESHOOTING', title: 'Battery Guide' }
    },
    {
      id: 'KB-BLE-01',
      text: 'Bluetooth pairing and NoiseFit app connectivity guide. Unpair from phone bluetooth first, ensure location permissions.',
      metadata: { category: 'TROUBLESHOOTING', title: 'Bluetooth Guide' }
    }
  ];

  test('tokenizes and removes stopwords properly', () => {
    const tokens = tokenize('Please help me with the battery charging drain on my Noise watch');
    expect(tokens).toContain('battery');
    expect(tokens).toContain('charging');
    expect(tokens).toContain('drain');
    expect(tokens).toContain('watch');
    expect(tokens).not.toContain('the');
    expect(tokens).not.toContain('please');
  });

  test('ranks battery policy highest for battery drain query', () => {
    const index = new TFIDFIndex(sampleDocs);
    const results = index.scoreQuery('Battery draining very fast in 5 hours', 'BATTERY_CHARGING');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('KB-BAT-01');
    expect(results[0].score).toBeGreaterThan(0.2);
  });

  test('ranks warranty policy highest for screen touch failure query', () => {
    const index = new TFIDFIndex(sampleDocs);
    const results = index.scoreQuery('Display touch screen defect stopped working warranty', 'WARRANTY');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('POL-WAR-01');
  });

  test('ranks bluetooth guide highest for pairing query', () => {
    const index = new TFIDFIndex(sampleDocs);
    const results = index.scoreQuery('NoiseFit app bluetooth pairing failed unpair', 'TROUBLESHOOTING');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('KB-BLE-01');
  });
});

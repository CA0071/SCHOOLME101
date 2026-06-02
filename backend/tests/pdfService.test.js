const { splitTextIntoChunks, extractMetadata } = require('../src/services/pdfService');

describe('pdfService', () => {
  describe('splitTextIntoChunks', () => {
    it('splits text into chunks of approximately the given size', () => {
      const text = 'Hello world. '.repeat(200);
      const chunks = splitTextIntoChunks(text, 500, 100);
      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach((chunk) => {
        expect(chunk.content.length).toBeLessThanOrEqual(600);
        expect(typeof chunk.index).toBe('number');
      });
    });

    it('returns a single chunk for short text', () => {
      const text = 'Short text.';
      const chunks = splitTextIntoChunks(text, 1000, 100);
      expect(chunks.length).toBe(1);
      expect(chunks[0].content).toBe('Short text.');
    });

    it('assigns sequential chunk indices', () => {
      const text = 'Sentence one. Sentence two. Sentence three. '.repeat(50);
      const chunks = splitTextIntoChunks(text, 200, 50);
      chunks.forEach((chunk, i) => {
        expect(chunk.index).toBe(i);
      });
    });
  });

  describe('extractMetadata', () => {
    it('extracts grade from text', () => {
      const meta = extractMetadata('This is a Grade 7 Mathematics lesson.');
      expect(meta.grade).toBe('Grade 7');
    });

    it('extracts Grade R', () => {
      const meta = extractMetadata('Grade R Foundation Phase activities.');
      expect(meta.grade).toBe('Grade R');
    });

    it('extracts term from text', () => {
      const meta = extractMetadata('Term 2 content for this subject.');
      expect(meta.term).toBe(2);
    });

    it('extracts week range', () => {
      const meta = extractMetadata('Weeks 3-5: Introduction to fractions.');
      expect(meta.weekStart).toBe(3);
      expect(meta.weekEnd).toBe(5);
    });

    it('returns empty object for unrecognized text', () => {
      const meta = extractMetadata('Some random unrelated content here.');
      expect(Object.keys(meta).length).toBe(0);
    });
  });
});

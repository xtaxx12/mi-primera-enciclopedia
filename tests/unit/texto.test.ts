import { describe, it, expect } from 'vitest';
import { decodificarEntidades, recortar, textoPlano } from '../../src/lib/texto';

describe('decodificarEntidades', () => {
  it('decodifica entidades con nombre y numéricas', () => {
    expect(decodificarEntidades('a &amp; b &lt;c&gt; &#233; &#xE9; &nbsp;x &bogus;')).toBe('a & b <c> é é  x &bogus;');
  });
  it('deja intactos los códigos fuera de rango', () => {
    expect(decodificarEntidades('&#99999999;')).toBe('&#99999999;');
  });
});

describe('textoPlano', () => {
  it('quita etiquetas y colapsa espacios', () => {
    expect(textoPlano('<p>Hola <b>mundo</b></p>\n<p>¡Sí!</p>')).toBe('Hola mundo ¡Sí!');
  });
  it('no agrega espacios por etiquetas en línea', () => {
    expect(textoPlano('El león (<i>Panthera leo</i>) ruge')).toBe('El león (Panthera leo) ruge');
    expect(textoPlano('<p>Uno</p><p>Dos</p>')).toBe('Uno Dos');
  });
});

describe('recortar', () => {
  it('no toca textos cortos', () => {
    expect(recortar('Hola mundo', 300)).toBe('Hola mundo');
  });
  it('corta en un espacio y agrega puntos suspensivos', () => {
    const largo = Array.from({ length: 100 }, () => 'palabra').join(' ');
    const r = recortar(largo, 300);
    expect(r.length).toBeLessThanOrEqual(300);
    expect(r.endsWith('palabra…')).toBe(true);
  });
});

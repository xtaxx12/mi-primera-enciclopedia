import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { limpiarHtml, type ResultadoLimpieza } from '../../scripts/import/limpiar';

const fixture = (nombre: string) =>
  JSON.parse(readFileSync(`tests/fixtures/vikidia/${nombre}.json`, 'utf8')).parse.text as string;

const sinEnlaces = { slugPorTitulo: new Map<string, string>() };
const html = (r: ResultadoLimpieza) =>
  r.bloques.flatMap((b) => (b.tipo === 'html' ? [b.html] : [])).join('\n');

describe('limpiarHtml con artículos reales', () => {
  const op = { slugPorTitulo: new Map([['panthera leo', 'leon'], ['sistema solar', 'sistema-solar'], ['sol', 'sol']]) };

  it('León: no deja restos de MediaWiki', () => {
    const r = limpiarHtml(fixture('leon'), op);
    expect(html(r)).not.toMatch(/mw-editsection|<img|style=|class=|<div|<table|<span/);
    expect(html(r)).not.toContain('<h2>Contenido</h2>');
    expect(r.palabras).toBeGreaterThan(150);
    expect(r.resumen.length).toBeGreaterThan(20);
    expect(r.resumen.length).toBeLessThanOrEqual(300);
  });

  it('León: lista primero la imagen de la ficha y descarta íconos', () => {
    const r = limpiarHtml(fixture('leon'), op);
    expect(r.imagenes[0]).toBe('Lion waiting in Namibia.jpg');
    expect(new Set(r.imagenes).size).toBe(r.imagenes.length);
  });

  it('Sistema solar: convierte la figura en un bloque', () => {
    const r = limpiarHtml(fixture('sistema-solar'), op);
    expect(r.bloques).toContainEqual({ tipo: 'figura', archivo: 'Uklad Sloneczny 2006-es.png', pie: 'Mapa del sistema solar' });
  });
});

describe('limpiarHtml con HTML de ejemplo', () => {
  it('quita atributos peligrosos y convierte enlaces internos', () => {
    const entrada =
      '<div class="mw-parser-output"><p onclick="robar()" style="color:red">Hola <a href="javascript:alert(1)">trampa</a> y ' +
      '<a href="/wiki/Le%C3%B3n" onmouseover="x()" title="León">el león</a><img src="x" onerror="y()"></p></div>';
    const r = limpiarHtml(entrada, { slugPorTitulo: new Map([['leon', 'leon']]) });
    expect(r.bloques).toEqual([{ tipo: 'html', html: '<p>Hola trampa y <a href="/articulo/leon">el león</a></p>' }]);
    expect(r.enlacesInternos).toEqual(['leon']);
  });

  it('descarta secciones de referencias y limpia los títulos', () => {
    const entrada =
      '<div class="mw-parser-output"><p>Intro del artículo.</p>' +
      '<h2><span class="mw-headline" id="Vida">Vida</span><span class="mw-editsection">[editar]</span></h2><p>Texto de vida.</p>' +
      '<h2><span class="mw-headline">Referencias</span></h2><p>Ref 1</p><ul><li>Ref 2</li></ul>' +
      '<h2><span class="mw-headline">Hábitat</span></h2><h3><span class="mw-headline">Selva &amp; sabana</span></h3><p>Texto.</p></div>';
    const r = limpiarHtml(entrada, sinEnlaces);
    expect(r.bloques).toEqual([
      {
        tipo: 'html',
        html: '<p>Intro del artículo.</p>\n<h2>Vida</h2>\n<p>Texto de vida.</p>\n<h2>Hábitat</h2>\n<h3>Selva &amp; sabana</h3>\n<p>Texto.</p>',
      },
    ]);
  });

  it('convierte figuras, desenvuelve enlaces rojos y descarta tablas y galerías', () => {
    const entrada =
      '<div class="mw-parser-output"><table><tr><td>Ficha</td></tr></table>' +
      '<figure typeof="mw:File/Thumb"><a href="/wiki/Archivo:Le%C3%B3n_rugiendo.jpg" class="mw-file-description">' +
      '<img src="//x/a.jpg" width="300" class="mw-file-element"></a><figcaption>Un <a href="/wiki/Le%C3%B3n">león</a> rugiendo</figcaption></figure>' +
      '<p>Vive en <a href="/w/index.php?title=Sabana&amp;action=edit&amp;redlink=1" class="new">la sabana</a>.</p>' +
      '<ul class="gallery"><li>foto</li></ul></div>';
    const r = limpiarHtml(entrada, sinEnlaces);
    expect(r.bloques).toEqual([
      { tipo: 'figura', archivo: 'León rugiendo.jpg', pie: 'Un león rugiendo' },
      { tipo: 'html', html: '<p>Vive en la sabana.</p>' },
    ]);
    expect(r.imagenes).toEqual(['León rugiendo.jpg']);
  });

  it('descarta el contenido de template, svg, iframe y similares sin limpiar', () => {
    const entrada =
      '<div class="mw-parser-output"><p>a <template><img src=x onerror=alert(1)></template> b' +
      '<svg><a href="javascript:alert(2)">x</a></svg><iframe src="https://malo"></iframe><noscript><img src=y></noscript></p></div>';
    const salida = html(limpiarHtml(entrada, sinEnlaces));
    expect(salida).not.toMatch(/<img|onerror|javascript:|<svg|<iframe|<template|<noscript/);
    expect(salida.startsWith('<p>a ')).toBe(true);
  });

  it('ignora imágenes de menos de 100 px', () => {
    const entrada =
      '<div class="mw-parser-output"><p><span typeof="mw:File"><a href="/wiki/Archivo:Icono.svg">' +
      '<img width="15" class="mw-file-element"></a></span>Texto</p></div>';
    expect(limpiarHtml(entrada, sinEnlaces).imagenes).toEqual([]);
  });

  it('cuenta palabras y recorta el resumen', () => {
    const largo = Array.from({ length: 80 }, (_, i) => `palabra${i}`).join(' ');
    const r = limpiarHtml(`<div class="mw-parser-output"><p>${largo}</p></div>`, sinEnlaces);
    expect(r.palabras).toBe(80);
    expect(r.resumen.endsWith('…')).toBe(true);
    expect(r.resumen.length).toBeLessThanOrEqual(300);
  });
});

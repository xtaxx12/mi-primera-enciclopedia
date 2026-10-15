import type { CategoriaSlug } from '../config';

export interface Subcategoria {
  slug: string;
  nombre: string;
  /** Código de OpenMoji. */
  icono: string;
  /** Slugs de los artículos, en el orden en que se muestran. */
  articulos: string[];
}

export const SUBCATEGORIAS: Record<CategoriaSlug, Subcategoria[]> = {
  animales: [
    { slug: 'mamiferos', nombre: 'Mamíferos', icono: '1F418', articulos: ['leon', 'elefante', 'ballena', 'delfin', 'gato', 'perro', 'lobo', 'ornitorrinco'] },
    { slug: 'aves', nombre: 'Aves', icono: '1F99C', articulos: ['guacamayo', 'pinguino'] },
    { slug: 'reptiles-y-dinosaurios', nombre: 'Reptiles y dinosaurios', icono: '1F995', articulos: ['cocodrilo', 'tortuga', 'dinosaurio'] },
    { slug: 'animales-del-mar', nombre: 'Animales del mar', icono: '1F988', articulos: ['tiburon', 'pulpo'] },
    { slug: 'insectos', nombre: 'Insectos', icono: '1F41D', articulos: ['abeja', 'mariposa'] },
  ],
  'planeta-tierra': [
    { slug: 'relieve', nombre: 'Relieve', icono: '26F0', articulos: ['volcan', 'terremoto', 'montana', 'isla', 'glaciar'] },
    { slug: 'el-agua', nombre: 'El agua', icono: '1F4A7', articulos: ['agua', 'ciclo-del-agua', 'oceano-pacifico', 'rio-amazonas', 'lago'] },
    { slug: 'clima-y-aire', nombre: 'Clima y aire', icono: '1F326', articulos: ['clima', 'atmosfera', 'huracan'] },
    { slug: 'paisajes', nombre: 'Paisajes', icono: '1F333', articulos: ['sabana', 'bosque', 'antartida'] },
  ],
  espacio: [
    { slug: 'sistema-solar', nombre: 'Sistema solar', icono: '1FA90', articulos: ['sistema-solar', 'sol', 'luna', 'tierra', 'mercurio', 'marte', 'pluton', 'planeta'] },
    { slug: 'el-universo', nombre: 'El universo', icono: '1F30C', articulos: ['estrella', 'galaxia', 'agujero-negro', 'cometa', 'asteroide'] },
    { slug: 'exploracion', nombre: 'Exploración', icono: '1F52D', articulos: ['telescopio', 'conquista-del-espacio'] },
  ],
  'cuerpo-humano': [
    { slug: 'organos', nombre: 'Órganos', icono: '1FAC1', articulos: ['corazon', 'cerebro', 'pulmon', 'estomago', 'rinon', 'sangre'] },
    { slug: 'los-sentidos', nombre: 'Los sentidos', icono: '1F441', articulos: ['ojo', 'oido', 'boca', 'piel', 'nervio'] },
    { slug: 'huesos-y-musculos', nombre: 'Huesos y músculos', icono: '1F9B4', articulos: ['esqueleto', 'hueso', 'musculo', 'diente'] },
  ],
  historia: [
    { slug: 'prehistoria', nombre: 'Prehistoria', icono: '1F525', articulos: ['prehistoria', 'stonehenge', 'escritura'] },
    { slug: 'antiguedad', nombre: 'Antigüedad', icono: '1F3FA', articulos: ['antiguo-egipto', 'piramide', 'antigua-grecia', 'imperio-romano'] },
    { slug: 'edad-media-y-renacimiento', nombre: 'Edad Media y Renacimiento', icono: '1F3F0', articulos: ['vikingos', 'edad-media', 'marco-polo', 'renacimiento', 'cristobal-colon'] },
    { slug: 'america-antigua', nombre: 'América antigua', icono: '1F33D', articulos: ['cultura-olmeca', 'mayas', 'aztecas', 'incas'] },
  ],
  'arte-y-musica': [
    { slug: 'pintura-y-escultura', nombre: 'Pintura y escultura', icono: '1F5BC', articulos: ['pintura', 'escultura', 'color', 'arte-prehistorico'] },
    { slug: 'grandes-artistas', nombre: 'Grandes artistas', icono: '1F9D1-200D-1F3A8', articulos: ['leonardo-da-vinci', 'diego-velazquez', 'francisco-de-goya', 'pablo-picasso', 'mondrian'] },
    { slug: 'musica-y-teatro', nombre: 'Música y teatro', icono: '1F3BC', articulos: ['orquesta', 'wolfgang-amadeus-mozart', 'ludwig-van-beethoven', 'frederic-chopin', 'rock', 'the-beatles', 'teatro'] },
  ],
  'ciencia-y-tecnologia': [
    { slug: 'inventos-y-maquinas', nombre: 'Inventos y máquinas', icono: '2699', articulos: ['rueda', 'imprenta', 'automovil', 'tren', 'computadora', 'internet', 'robot', 'microscopio'] },
    { slug: 'materia-y-energia', nombre: 'Materia y energía', icono: '26A1', articulos: ['electricidad', 'energia', 'luz', 'sonido', 'gravedad', 'atomo', 'isaac-newton'] },
    { slug: 'la-vida', nombre: 'La vida', icono: '1F9EC', articulos: ['celula', 'planta'] },
  ],
  paises: [
    { slug: 'america-del-norte-y-central', nombre: 'América del Norte y Central', icono: '1F30E', articulos: ['canada', 'estados-unidos', 'mexico', 'guatemala', 'honduras', 'el-salvador', 'nicaragua', 'costa-rica', 'panama', 'cuba', 'republica-dominicana', 'puerto-rico'] },
    { slug: 'america-del-sur', nombre: 'América del Sur', icono: '1F999', articulos: ['argentina', 'bolivia', 'brasil', 'chile', 'colombia', 'ecuador', 'paraguay', 'peru', 'uruguay', 'venezuela'] },
    { slug: 'europa', nombre: 'Europa', icono: '1F30D', articulos: ['alemania', 'espana', 'francia', 'grecia', 'italia', 'portugal', 'reino-unido'] },
    { slug: 'africa-asia-y-oceania', nombre: 'África, Asia y Oceanía', icono: '1F30F', articulos: ['argelia', 'egipto', 'india', 'turquia', 'australia'] },
  ],
};

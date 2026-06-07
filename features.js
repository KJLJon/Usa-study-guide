// All 27 features for the test.
// type: 'ocean'|'water'|'river'|'mountain'|'land'
// For rendering on the SVG map, each feature has either:
//   - cx, cy: center point (for mountains/land click zones, ocean labels)
//   - points: array of [x,y] in SVG coordinate space (rivers as polylines)
//   - shape: 'triangle'|'line'|'region'|'lake'|'label'
// Coordinates are in the 960x600 Albersusa projection space,
// with Alaska inset at bottom-left and Hawaii inset at bottom-left area.

const FEATURES = [
  // ─── OCEANS / GULF / STRAIT ───
  {
    id: 1, name: "Océano Pacífico", cat: "ocean",
    hint: "Al oeste de EE.UU. — el océano más grande del mundo",
    shape: "label",
    cx: 60, cy: 300,
  },
  {
    id: 2, name: "Océano Atlántico", cat: "ocean",
    hint: "Al este de EE.UU.",
    shape: "label",
    cx: 890, cy: 310,
  },
  {
    id: 3, name: "Golfo de México", cat: "ocean",
    hint: "Al sur de EE.UU. — entre México y Florida",
    shape: "label",
    cx: 620, cy: 530,
  },
  {
    id: 4, name: "Estrecho de Bering", cat: "ocean",
    hint: "Separa Alaska de Rusia — ver esquina inferior izquierda",
    shape: "label",
    cx: 95, cy: 468,
  },

  // ─── GREAT LAKES ───
  {
    id: 5, name: "Lago Superior", cat: "water",
    hint: "El más grande de los Grandes Lagos",
    shape: "lake",
    cx: 619, cy: 92,
    // shifted ~17px left to match AlbersUSA projection
    points: [[563,77],[583,67],[613,62],[643,65],[669,72],[679,85],[674,99],[654,105],[629,107],[599,102],[573,95],[561,87]],
  },
  {
    id: 6, name: "Lago Huron", cat: "water",
    hint: "Al este de la Península de Michigan",
    shape: "lake",
    cx: 705, cy: 146,
    points: [[690,121],[705,116],[720,124],[730,136],[733,151],[727,166],[715,171],[700,166],[690,154],[688,138]],
  },
  {
    id: 7, name: "Lago Michigan", cat: "water",
    hint: "El único de los Grandes Lagos completamente dentro de EE.UU.",
    shape: "lake",
    cx: 637, cy: 174,
    points: [[627,144],[637,138],[647,146],[650,161],[648,178],[640,192],[630,194],[623,184],[620,168],[622,154]],
  },
  {
    id: 8, name: "Lago Ontario", cat: "water",
    hint: "El más pequeño de los Grandes Lagos — al norte de Nueva York",
    shape: "lake",
    cx: 780, cy: 160,
    points: [[760,154],[772,150],[788,152],[800,158],[802,166],[790,170],[772,170],[760,164]],
  },
  {
    id: 9, name: "Lago Erie", cat: "water",
    hint: "El más poco profundo de los Grandes Lagos",
    shape: "lake",
    cx: 731, cy: 188,
    points: [[713,184],[725,180],[741,180],[751,184],[753,192],[739,196],[723,196],[711,192]],
  },

  // ─── RIVERS ───
  {
    id: 10, name: "Río Mississippi", cat: "river",
    hint: "El río más largo de EE.UU. — corre de norte a sur hasta el Golfo de México",
    shape: "line",
    cx: 592, cy: 324,
    // source: Lake Itasca 95.2°W,47.2°N (y≈183) → Twin Cities → St. Louis 90°W,38.6°N (y≈305) → Gulf
    points: [[502,108],[534,161],[564,213],[591,299],[599,377],[574,441],[605,493]],
  },
  {
    id: 11, name: "Río Missouri", cat: "river",
    hint: "Afluente más largo del Mississippi — viene desde Montana hacia el este",
    shape: "line",
    cx: 474, cy: 214,
    points: [[250,118],[332,87],[417,116],[468,191],[484,215],[515,291],[592,294]],
  },
  {
    id: 12, name: "Río Ohio", cat: "river",
    hint: "Corre de Pittsburgh hacia el oeste hasta el Mississippi",
    shape: "line",
    cx: 710, cy: 275,
    points: [[790,228],[768,240],[745,252],[722,262],[702,275],[682,292],[662,310],[648,325],[635,338],[614,342]],
  },
  {
    id: 13, name: "Río Colorado", cat: "river",
    hint: "Formó el Gran Cañón — desemboca en el Golfo de California",
    shape: "line",
    cx: 182, cy: 314,
    points: [[331,251],[275,278],[249,297],[216,319],[204,335],[157,328],[144,401]],
  },
  {
    id: 14, name: "Río Grande", cat: "river",
    hint: "Frontera natural entre EE.UU. y México",
    shape: "line",
    cx: 422, cy: 528,
    points: [[288,308],[298,371],[292,445],[395,507],[421,550],[460,587]],
  },
  {
    id: 15, name: "Río Minnesota", cat: "river",
    hint: "Corre por el sur de Minnesota hacia el Mississippi",
    shape: "line",
    cx: 508, cy: 156,
    // Big Stone Lake 96.4°W,45.6°N (x≈518,y≈207) → Twin Cities 93°W,44.9°N meets Mississippi (x≈553,y≈215)
    points: [[483,146],[509,156],[534,161]],
  },
  {
    id: 16, name: "Río San Lorenzo", cat: "river",
    hint: "Drena los Grandes Lagos hacia el Océano Atlántico por Canadá",
    shape: "line",
    cx: 845, cy: 97,
    points: [[804,143],[839,106],[866,69]],
  },

  // ─── MOUNTAINS ───
  {
    id: 17, name: "Montañas Rocosas", cat: "mountain",
    hint: "Gran cordillera al oeste — de Alaska a Nuevo México",
    shape: "triangle",
    cx: 321, cy: 262,
    // peaks cover Montana → Wyoming → Colorado → New Mexico (N to S)
    peaks: [[274,145],[287,182],[287,162],[301,200],[297,190],[311,228],[309,215],[323,252],[321,242],[335,280],[333,265],[347,302],[341,290],[354,328],[347,315],[359,352]],
  },
  {
    id: 18, name: "Montañas de Sierra Nevada", cat: "mountain",
    hint: "Al este de California — incluye el Monte Whitney",
    shape: "triangle",
    cx: 79, cy: 287,
    peaks: [[62,252],[74,287],[86,252],[96,284],[106,254],[114,282],[122,256]],
  },
  {
    id: 19, name: "Montes Apalaches", cat: "mountain",
    hint: "Antigua cordillera al este de EE.UU. — de Alabama a Maine",
    shape: "triangle",
    cx: 761, cy: 305,
    // peaks cover Maine → Pennsylvania (north) → Virginia → North Carolina → Alabama (south)
    peaks: [[815,181],[815,208],[808,185],[809,213],[801,189],[803,218],[793,193],[795,221],[785,198],[787,228],[773,205],[775,235],[761,233],[763,261],[751,261],[753,291],[738,291],[740,321],[723,321],[725,351],[711,351],[713,381],[701,381],[703,408],[691,408],[693,435]],
  },

  // ─── LAND FEATURES ───
  {
    id: 20, name: "Desierto de Mojave", cat: "land",
    hint: "Desierto caliente en California/Nevada",
    shape: "region",
    cx: 120, cy: 348,
    // 116.5°W, 34.5°N → x≈205, y≈362 (below Great Basin, SE California/S Nevada)
    points: [[95,330],[128,325],[158,332],[165,348],[160,365],[138,372],[110,366],[93,350]],
  },
  {
    id: 21, name: "Gran Cuenca", cat: "land",
    hint: "Región árida sin salida al mar entre las Rocosas y Sierra Nevada",
    shape: "region",
    cx: 137, cy: 232,
    points: [[92,190],[137,184],[177,190],[200,207],[200,234],[187,257],[157,270],[124,270],[97,257],[80,237],[82,214]],
  },
  {
    id: 22, name: "Grandes Llanuras", cat: "land",
    hint: "Enorme llanura en el centro de EE.UU.",
    shape: "region",
    cx: 423, cy: 269,
    points: [[348,159],[433,156],[473,166],[485,189],[483,224],[478,259],[471,292],[461,319],[443,342],[418,352],[388,342],[363,319],[348,292],[341,259],[341,226],[343,192]],
  },
  {
    id: 23, name: "Gran Cañón", cat: "land",
    hint: "En Arizona — tallado por el Río Colorado durante millones de años",
    shape: "region",
    cx: 204, cy: 334,
    // 112.1°W, 36.1°N → x=618-(112.1-90)*15.6=273, y=305+(38.6-36.1)*14=340
    points: [[186,324],[206,318],[223,326],[226,340],[221,354],[203,358],[184,352],[179,338]],
  },
  {
    id: 24, name: "Meseta de Ozark", cat: "land",
    hint: "Región montañosa en Missouri y Arkansas",
    shape: "region",
    cx: 562, cy: 335,
    // 93.5°W, 36.5°N → x=618-(93.5-90)*15.6=563, y=305+(38.6-36.5)*14=334
    points: [[535,318],[562,312],[588,318],[598,335],[588,355],[562,362],[535,355],[522,340]],
  },
  {
    id: 25, name: "Monte McKinley", cat: "mountain",
    hint: "El pico más alto de América del Norte — en Alaska (Denali)",
    shape: "triangle",
    cx: 106, cy: 521,
    peaks: [[96,515],[106,501],[116,515]],
  },
  {
    id: 26, name: "Mauna Kea", cat: "mountain",
    hint: "Volcán en Hawái — el más alto del mundo medido desde su base oceánica",
    shape: "triangle",
    cx: 313, cy: 573,
    peaks: [[305,567],[313,553],[321,567]],
  },
  {
    id: 27, name: "Monte Rushmore", cat: "mountain",
    hint: "En Dakota del Sur — cuatro presidentes esculpidos en roca",
    shape: "triangle",
    cx: 371, cy: 179,
    // 103.5°W, 43.9°N → x=618-(103.5-90)*15.6=407, y=305+(38.6-43.9)*14=231
    peaks: [[363,175],[371,163],[379,175]],
  },
];

// Badge config
const BADGE = {
  ocean:    { label: "🌊 Océano/Golfo/Estrecho", cls: "badge-ocean" },
  water:    { label: "💧 Lago",                  cls: "badge-water" },
  river:    { label: "〰 Río",                   cls: "badge-river" },
  mountain: { label: "⛰ Montaña",               cls: "badge-mountain" },
  land:     { label: "🗺 Región/Desierto",        cls: "badge-land" },
};

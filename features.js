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
    cx: 628, cy: 145,
    // shifted ~17px left to match AlbersUSA projection
    points: [[572,130],[592,120],[622,115],[652,118],[678,125],[688,138],[683,152],[663,158],[638,160],[608,155],[582,148],[570,140]],
  },
  {
    id: 6, name: "Lago Huron", cat: "water",
    hint: "Al este de la Península de Michigan",
    shape: "lake",
    cx: 703, cy: 170,
    points: [[688,145],[703,140],[718,148],[728,160],[731,175],[725,190],[713,195],[698,190],[688,178],[686,162]],
  },
  {
    id: 7, name: "Lago Michigan", cat: "water",
    hint: "El único de los Grandes Lagos completamente dentro de EE.UU.",
    shape: "lake",
    cx: 665, cy: 178,
    points: [[655,148],[665,142],[675,150],[678,165],[676,182],[668,196],[658,198],[651,188],[648,172],[650,158]],
  },
  {
    id: 8, name: "Lago Ontario", cat: "water",
    hint: "El más pequeño de los Grandes Lagos — al norte de Nueva York",
    shape: "lake",
    cx: 753, cy: 168,
    points: [[733,162],[745,158],[761,160],[773,166],[775,174],[763,178],[745,178],[733,172]],
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
    cx: 610, cy: 345,
    // source: Lake Itasca 95.2°W,47.2°N (y≈183) → Twin Cities → St. Louis 90°W,38.6°N (y≈305) → Gulf
    points: [[540,183],[545,197],[550,212],[562,228],[575,248],[588,265],[600,285],[608,305],[612,325],[614,350],[614,375],[614,400],[616,425],[618,455],[618,480],[617,505],[618,535]],
  },
  {
    id: 11, name: "Río Missouri", cat: "river",
    hint: "Afluente más largo del Mississippi — viene desde Montana hacia el este",
    shape: "line",
    cx: 520, cy: 220,
    points: [[290,185],[320,188],[355,190],[390,192],[425,195],[460,200],[495,205],[530,210],[560,218],[585,228],[605,248],[612,275],[612,305]],
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
    cx: 318, cy: 352,
    points: [[378,278],[365,300],[350,320],[335,340],[320,358],[305,375],[290,392],[276,408],[265,422]],
  },
  {
    id: 14, name: "Río Grande", cat: "river",
    hint: "Frontera natural entre EE.UU. y México",
    shape: "line",
    cx: 430, cy: 460,
    points: [[332,328],[345,348],[360,368],[378,388],[400,408],[425,428],[450,448],[478,463],[505,475],[530,483]],
  },
  {
    id: 15, name: "Río Minnesota", cat: "river",
    hint: "Corre por el sur de Minnesota hacia el Mississippi",
    shape: "line",
    cx: 535, cy: 211,
    // Big Stone Lake 96.4°W,45.6°N (x≈518,y≈207) → Twin Cities 93°W,44.9°N meets Mississippi (x≈553,y≈215)
    points: [[518,207],[528,210],[540,212],[553,215]],
  },
  {
    id: 16, name: "Río San Lorenzo", cat: "river",
    hint: "Drena los Grandes Lagos hacia el Océano Atlántico por Canadá",
    shape: "line",
    cx: 820, cy: 148,
    points: [[790,168],[802,162],[815,156],[828,150],[842,145],[856,140],[870,136]],
  },

  // ─── MOUNTAINS ───
  {
    id: 17, name: "Montañas Rocosas", cat: "mountain",
    hint: "Gran cordillera al oeste — de Alaska a Nuevo México",
    shape: "triangle",
    cx: 342, cy: 272,
    // peaks cover Montana → Wyoming → Colorado → New Mexico (N to S)
    peaks: [[295,155],[308,192],[308,172],[322,210],[318,200],[332,238],[330,225],[344,262],[342,252],[356,290],[354,275],[368,312],[362,300],[375,338],[368,325],[380,362]],
  },
  {
    id: 18, name: "Montañas de Sierra Nevada", cat: "mountain",
    hint: "Al este de California — incluye el Monte Whitney",
    shape: "triangle",
    cx: 175, cy: 275,
    peaks: [[158,240],[170,275],[182,240],[192,272],[202,242],[210,270],[218,244]],
  },
  {
    id: 19, name: "Montes Apalaches", cat: "mountain",
    hint: "Antigua cordillera al este de EE.UU. — de Alabama a Maine",
    shape: "triangle",
    cx: 808, cy: 292,
    // peaks cover Maine → Pennsylvania (north) → Virginia → North Carolina → Alabama (south)
    peaks: [[862,168],[862,195],[855,172],[856,200],[848,176],[850,205],[840,180],[842,208],[832,185],[834,215],[820,192],[822,222],[808,220],[810,248],[798,248],[800,278],[785,278],[787,308],[770,308],[772,338],[758,338],[760,368],[748,368],[750,395],[738,395],[740,422]],
  },

  // ─── LAND FEATURES ───
  {
    id: 20, name: "Desierto de Mojave", cat: "land",
    hint: "Desierto caliente en California/Nevada",
    shape: "region",
    cx: 210, cy: 358,
    // 116.5°W, 34.5°N → x≈205, y≈362 (below Great Basin, SE California/S Nevada)
    points: [[185,340],[218,335],[248,342],[255,358],[250,375],[228,382],[200,376],[183,360]],
  },
  {
    id: 21, name: "Gran Cuenca", cat: "land",
    hint: "Región árida sin salida al mar entre las Rocosas y Sierra Nevada",
    shape: "region",
    cx: 255, cy: 270,
    points: [[210,228],[255,222],[295,228],[318,245],[318,272],[305,295],[275,308],[242,308],[215,295],[198,275],[200,252]],
  },
  {
    id: 22, name: "Grandes Llanuras", cat: "land",
    hint: "Enorme llanura en el centro de EE.UU.",
    shape: "region",
    cx: 510, cy: 295,
    points: [[435,185],[520,182],[560,192],[572,215],[570,250],[565,285],[558,318],[548,345],[530,368],[505,378],[475,368],[450,345],[435,318],[428,285],[428,252],[430,218]],
  },
  {
    id: 23, name: "Gran Cañón", cat: "land",
    hint: "En Arizona — tallado por el Río Colorado durante millones de años",
    shape: "region",
    cx: 273, cy: 340,
    // 112.1°W, 36.1°N → x=618-(112.1-90)*15.6=273, y=305+(38.6-36.1)*14=340
    points: [[255,330],[275,324],[292,332],[295,346],[290,360],[272,364],[253,358],[248,344]],
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
    cx: 118, cy: 488,
    peaks: [[108,482],[118,468],[128,482]],
  },
  {
    id: 26, name: "Mauna Kea", cat: "mountain",
    hint: "Volcán en Hawái — el más alto del mundo medido desde su base oceánica",
    shape: "triangle",
    cx: 220, cy: 548,
    peaks: [[212,542],[220,528],[228,542]],
  },
  {
    id: 27, name: "Monte Rushmore", cat: "mountain",
    hint: "En Dakota del Sur — cuatro presidentes esculpidos en roca",
    shape: "triangle",
    cx: 407, cy: 231,
    // 103.5°W, 43.9°N → x=618-(103.5-90)*15.6=407, y=305+(38.6-43.9)*14=231
    peaks: [[399,227],[407,215],[415,227]],
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

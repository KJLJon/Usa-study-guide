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
    cx: 645, cy: 145,
    // rough polygon points for Lake Superior
    points: [[590,130],[610,120],[640,115],[670,118],[695,125],[705,138],[700,152],[680,158],[655,160],[625,155],[600,148],[588,140]],
  },
  {
    id: 6, name: "Lago Huron", cat: "water",
    hint: "Al este de la Península de Michigan",
    shape: "lake",
    cx: 720, cy: 170,
    points: [[705,145],[720,140],[735,148],[745,160],[748,175],[742,190],[730,195],[715,190],[705,178],[703,162]],
  },
  {
    id: 7, name: "Lago Michigan", cat: "water",
    hint: "El único de los Grandes Lagos completamente dentro de EE.UU.",
    shape: "lake",
    cx: 682, cy: 178,
    points: [[672,148],[682,142],[692,150],[695,165],[693,182],[685,196],[675,198],[668,188],[665,172],[667,158]],
  },
  {
    id: 8, name: "Lago Ontario", cat: "water",
    hint: "El más pequeño de los Grandes Lagos — al norte de Nueva York",
    shape: "lake",
    cx: 770, cy: 168,
    points: [[750,162],[762,158],[778,160],[790,166],[792,174],[780,178],[762,178],[750,172]],
  },
  {
    id: 9, name: "Lago Erie", cat: "water",
    hint: "El más poco profundo de los Grandes Lagos",
    shape: "lake",
    cx: 748, cy: 188,
    points: [[730,184],[742,180],[758,180],[768,184],[770,192],[756,196],[740,196],[728,192]],
  },

  // ─── RIVERS ───
  {
    id: 10, name: "Río Mississippi", cat: "river",
    hint: "El río más largo de EE.UU. — corre de norte a sur hasta el Golfo de México",
    shape: "line",
    cx: 620, cy: 320,
    points: [[650,155],[645,180],[638,210],[628,240],[620,270],[615,300],[612,330],[610,360],[615,390],[618,420],[622,450],[625,480],[620,510],[618,535]],
  },
  {
    id: 11, name: "Río Missouri", cat: "river",
    hint: "Afluente más largo del Mississippi — viene desde Montana hacia el este",
    shape: "line",
    cx: 520, cy: 220,
    points: [[290,185],[320,188],[355,190],[390,192],[425,195],[460,200],[495,205],[530,210],[565,215],[595,222],[618,235]],
  },
  {
    id: 12, name: "Río Ohio", cat: "river",
    hint: "Corre de Pittsburgh hacia el oeste hasta el Mississippi",
    shape: "line",
    cx: 700, cy: 255,
    points: [[790,228],[770,235],[745,242],[718,248],[692,253],[665,258],[640,262],[618,268]],
  },
  {
    id: 13, name: "Río Colorado", cat: "river",
    hint: "Formó el Gran Cañón — desemboca en el Golfo de California",
    shape: "line",
    cx: 295, cy: 310,
    points: [[355,205],[345,225],[335,248],[322,268],[310,288],[300,308],[292,328],[285,350],[278,372],[272,395]],
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
    cx: 588, cy: 188,
    points: [[510,188],[530,192],[552,193],[572,192],[590,190],[608,190],[622,196]],
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
    cx: 340, cy: 250,
    // multiple triangles along the range
    peaks: [[305,195],[325,240],[340,195],[360,235],[380,195],[398,240],[415,195],[430,238],[445,200],[458,242],[470,205],[480,248],[490,218],[498,260],[505,230],[510,272]],
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
    cx: 790, cy: 260,
    peaks: [[800,165],[808,195],[816,168],[822,198],[828,172],[834,202],[840,175],[845,206],[850,180],[854,210],[858,186],[860,215],[862,195],[862,222]],
  },

  // ─── LAND FEATURES ───
  {
    id: 20, name: "Desierto de Mojave", cat: "land",
    hint: "Desierto caliente en California/Nevada",
    shape: "region",
    cx: 215, cy: 318,
    points: [[188,295],[230,290],[258,298],[262,315],[258,335],[235,345],[205,340],[185,325]],
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
    cx: 295, cy: 335,
    points: [[278,325],[298,322],[312,328],[315,342],[310,352],[292,355],[275,348],[272,338]],
  },
  {
    id: 24, name: "Meseta de Ozark", cat: "land",
    hint: "Región montañosa en Missouri y Arkansas",
    shape: "region",
    cx: 620, cy: 340,
    points: [[588,318],[618,312],[645,318],[655,335],[648,355],[622,362],[595,355],[582,340]],
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
    cx: 488, cy: 198,
    peaks: [[480,194],[488,182],[496,194]],
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

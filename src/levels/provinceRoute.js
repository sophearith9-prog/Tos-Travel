// A geographic game tour based on the supplied Cambodia map, not a road itinerary.
// Positions are normalized coordinates for the illustrated route map.
export const PROVINCE_ROUTE = [
  { id: 'siem-reap', name: 'Siem Reap', khmer: 'សៀមរាប', places: 'Angkor Wat · Kampong Phluk', theme: 'angkor', sky: '#e7b978', water: '#557c79', land: '#76956c', map: [0.30, 0.22] },
  { id: 'banteay-meanchey', name: 'Banteay Meanchey', khmer: 'បន្ទាយមានជ័យ', places: 'Banteay Chhmar · Trapeang Thmor', theme: 'temple-lake', sky: '#dbca9a', water: '#689c99', land: '#728760', map: [0.14, 0.22] },
  { id: 'oddar-meanchey', name: 'Oddar Meanchey', khmer: 'ឧត្តរមានជ័យ', places: 'Ta Muen temples · Border forests', theme: 'forest-temple', sky: '#c6d7ac', water: '#608d85', land: '#547951', map: [0.30, 0.11] },
  { id: 'preah-vihear', name: 'Preah Vihear', khmer: 'ព្រះវិហារ', places: 'Preah Vihear temple · Koh Ker', theme: 'cliff-temple', sky: '#b6d5cb', water: '#688d90', land: '#69845a', map: [0.50, 0.24] },
  { id: 'stung-treng', name: 'Stung Treng', khmer: 'ស្ទឹងត្រែង', places: 'Preah Rumkel · Mekong islands', theme: 'river-islands', sky: '#cadbd0', water: '#56a2a5', land: '#6b955d', map: [0.69, 0.21] },
  { id: 'ratanakiri', name: 'Ratanakiri', khmer: 'រតនគីរី', places: 'Yeak Laom lake · Kachanh waterfall', theme: 'crater-lake', sky: '#a8d9cc', water: '#318f9d', land: '#4c885c', map: [0.87, 0.22] },
  { id: 'mondulkiri', name: 'Mondulkiri', khmer: 'មណ្ឌលគីរី', places: 'Bousra waterfall · Forested hills', theme: 'highland-falls', sky: '#c4d5d2', water: '#70b5ba', land: '#668965', map: [0.86, 0.44] },
  { id: 'kratie', name: 'Kratie', khmer: 'ក្រចេះ', places: 'Kampi · Mekong dolphins', theme: 'dolphin-river', sky: '#e8ab82', water: '#579b9e', land: '#80a06f', map: [0.68, 0.43] },
  { id: 'tboung-khmum', name: 'Tboung Khmum', khmer: 'ត្បូងឃ្មុំ', places: 'Suong · Rubber plantations', theme: 'rubber', sky: '#c9dda8', water: '#76a49a', land: '#588455', map: [0.62, 0.58] },
  { id: 'svay-rieng', name: 'Svay Rieng', khmer: 'ស្វាយរៀង', places: 'Bavet · Rice-field countryside', theme: 'border-fields', sky: '#e6d29c', water: '#7ea9a3', land: '#a3b967', map: [0.65, 0.82] },
  { id: 'prey-veng', name: 'Prey Veng', khmer: 'ព្រៃវែង', places: 'Ba Phnom · Rural lakes', theme: 'lotus-fields', sky: '#e9c796', water: '#7aa9a2', land: '#a3b56e', map: [0.59, 0.73] },
  { id: 'kandal', name: 'Kandal', khmer: 'កណ្តាល', places: 'Koh Oknha Tei · Ta Khmau', theme: 'river-village', sky: '#c1ddcc', water: '#619fa2', land: '#8bac73', map: [0.48, 0.80] },
  { id: 'phnom-penh', name: 'Phnom Penh', khmer: 'ភ្នំពេញ', places: 'Royal Palace · Wat Phnom', theme: 'palace-night', sky: '#273954', water: '#365577', land: '#53765b', map: [0.46, 0.73] },
  { id: 'takeo', name: 'Takeo', khmer: 'តាកែវ', places: 'Phnom Da · Angkor Borei', theme: 'rice-temple', sky: '#e6ce9d', water: '#7ba7a0', land: '#a0b574', map: [0.43, 0.88] },
  { id: 'kep', name: 'Kep', khmer: 'កែប', places: 'Rabbit Island · Kep beach', theme: 'island-coast', sky: '#ace0df', water: '#46adb9', land: '#e2c990', map: [0.34, 0.97] },
  { id: 'kampot', name: 'Kampot', khmer: 'កំពត', places: 'Bokor · Kampot river', theme: 'misty-coast', sky: '#dda99a', water: '#6c9f9f', land: '#6e8e73', map: [0.31, 0.89] },
  { id: 'preah-sihanouk', name: 'Preah Sihanouk', khmer: 'ព្រះសីហនុ', places: 'Koh Rong · Koh Rong Sanloem', theme: 'turquoise-coast', sky: '#a8e2e4', water: '#27b7be', land: '#f0deb3', map: [0.20, 0.94] },
  { id: 'koh-kong', name: 'Koh Kong', khmer: 'កោះកុង', places: 'Tatai waterfall · Mangroves', theme: 'mangrove-falls', sky: '#b7d8c7', water: '#599f98', land: '#52795d', map: [0.14, 0.74] },
  { id: 'pailin', name: 'Pailin', khmer: 'ប៉ៃលិន', places: 'O Tavau waterfall · Phnom Yat', theme: 'hill-pagoda', sky: '#d6bd9b', water: '#6ba6aa', land: '#6e955f', map: [0.04, 0.43] },
  { id: 'battambang', name: 'Battambang', khmer: 'បាត់ដំបង', places: 'Phnom Sampov · Sunset bat caves', theme: 'bat-caves', sky: '#e4a578', water: '#708f87', land: '#8c9a67', map: [0.17, 0.40] },
  { id: 'pursat', name: 'Pursat', khmer: 'ពោធិ៍សាត់', places: 'Thma Da · Veal Veng', theme: 'mountain-falls', sky: '#b8cfc7', water: '#73a9af', land: '#668968', map: [0.29, 0.55] },
  { id: 'kampong-speu', name: 'Kampong Speu', khmer: 'កំពង់ស្ពឺ', places: 'Kirirom · Pine forests', theme: 'pine-forest', sky: '#c4dcd5', water: '#7ba9ad', land: '#719773', map: [0.32, 0.74] },
  { id: 'kampong-chhnang', name: 'Kampong Chhnang', khmer: 'កំពង់ឆ្នាំង', places: 'Tonle Sap villages · Rural hills', theme: 'floating-village', sky: '#dccda6', water: '#709e9f', land: '#899968', map: [0.40, 0.60] },
  { id: 'kampong-thom', name: 'Kampong Thom', khmer: 'កំពង់ធំ', places: 'Sambor Prei Kuk · Stung Sen', theme: 'brick-temple', sky: '#d6d3af', water: '#789e90', land: '#70905c', map: [0.51, 0.43] },
  { id: 'kampong-cham', name: 'Kampong Cham', khmer: 'កំពង់ចាម', places: 'Koh Pen bamboo bridge · Mekong', theme: 'bamboo-bridge', sky: '#d6dfbe', water: '#72a7a9', land: '#90ad6c', map: [0.53, 0.61] }
];

export const TOTAL_LEVELS = 3 + PROVINCE_ROUTE.length;

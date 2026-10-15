export interface DalilItem {
  id: string;
  source: string;
  topic: 'emas' | 'padi' | 'umum';
  arabic?: string;
  translation: string;
  explanation: string;
}

export const DALIL_LIST: DalilItem[] = [
  {
    id: 'umum-1',
    source: 'QS. At-Taubah: 103',
    topic: 'umum',
    arabic: 'خُذْ مِنْ أَمْوَالِهِمْ صَدَقَةً تُطَهِّرُهُمْ وَتُزَكِّيهِمْ بِهَا وَصَلِّ عَلَيْهِمْ',
    translation: 'Ambillah zakat dari sebagian harta mereka, dengan zakat itu kamu membersihkan dan mensucikan mereka dan mendoalah untuk mereka.',
    explanation: 'Zakat berfungsi sebagai pembersih harta dan jiwa, serta mendatangkan keberkahan dan ketenteraman.',
  },
  {
    id: 'umum-2',
    source: 'QS. Al-Baqarah: 267',
    topic: 'umum',
    arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا أَنْفِقُوا مِنْ طَيِّبَاتِ مَا كَسَبْتُمْ وَمِمَّا أَخْرَجْنَا لَكُمْ مِنَ الْأَرْضِ',
    translation: 'Wahai orang-orang yang beriman! Infakkanlah sebagian dari hasil usahamu yang baik-baik dan sebagian dari apa yang Kami keluarkan dari bumi untukmu.',
    explanation: 'Kewajiban zakat mencakup perniagaan/simpanan (termasuk emas) dan hasil bumi (pertanian).',
  },
  {
    id: 'emas-1',
    source: 'HR. Abu Dawud No. 1573 & Baihaqi',
    topic: 'emas',
    arabic: 'فَإِذَا كَانَتْ لَكَ مِائَتَا دِرْهَمٍ وَحَالَ عَلَيْهَا الْحَوْلُ فَفِيهَا خَمْسَةُ دَرَاهِمَ وَلَيْسَ عَلَيْكَ شَيْءٌ حَتَّى يَكُونَ لَكَ عِشْرُونَ دِينَارًا',
    translation: 'Bila engkau memiliki 20 dinar (setara 85 gram emas) dan telah berlalu satu tahun (haul), maka padanya wajib zakat 1/2 dinar (2,5%).',
    explanation: 'Nishab emas adalah 20 dinar atau setara 85 gram emas murni. Syarat wajibnya adalah mencapai nishab dan telah tersimpan genap 1 tahun (haul).',
  },
  {
    id: 'padi-1',
    source: 'HR. Bukhari No. 1483',
    topic: 'padi',
    arabic: 'فِيمَا سَقَتِ السَّمَاءُ وَالْعُيُونُ أَوْ كَانَ عَثَرِيًّا الْعُشْرُ، وَمَا سُقِيَ بِالنَّضْحِ نِصْفُ الْعُشْرِ',
    translation: 'Pada tanaman yang diairi oleh air hujan dan mata air atau yang hidup dengan air tanah, zakatnya sepersepuluh (10%), sedangkan yang disiram dengan kincir/alat penyiram (berbiaya) zakatnya seperdua puluh (5%).',
    explanation: 'Zakat pertanian wajib ditunaikan saat panen jika mencapai nishab 5 wasaq (653 kg GKG / 520 kg beras). Tarifnya 10% untuk tadah hujan/alami, atau 5% untuk irigasi mekanik berbiaya.',
  },
  {
    id: 'padi-2',
    source: 'Fatwa MUI No. 3 Tahun 2003',
    topic: 'padi',
    arabic: 'وَآتُوا حَقَّهُ يَوْمَ حَصَادِهِ',
    translation: 'Dan tunaikanlah haknya (zakatnya) di hari memetik hasilnya (panen). (QS. Al-An\'am: 141)',
    explanation: 'Zakat pertanian tidak mensyaratkan haul 1 tahun, melainkan wajib dikeluarkan setiap kali musim panen tiba dan hasilnya mencapai nishab.',
  },
];

export const FIQIH_SUMMARY = {
  emas: {
    nishab: '85 gram emas',
    haul: '1 tahun penuh (Hijriah 354 hari / Masehi 365 hari)',
    rate: '2,5%',
    syarat: 'Milik sempurna, mencapai nishab, melewati haul, dan bukan perhiasan yang dipakai secara wajar (di luar batas berlebihan).',
  },
  padi: {
    nishab: '5 wasaq ≈ 653 kg GKG (Gabah Kering Giling) atau ≈ 520 kg Beras',
    haul: 'Tidak ada haul — wajib dibayarkan saat panen (QS. Al-An\'am: 141)',
    rate: '10% (air hujan/alami) atau 5% (irigasi mesin/pompa berbiaya)',
    syarat: 'Mencapai nishab saat panen. Apabila belum mencapai nishab, disunnahkan berinfaq atau sedekah sukarela.',
  },
};

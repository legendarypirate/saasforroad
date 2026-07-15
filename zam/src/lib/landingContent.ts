import { STANDART_CERTIFICATES, STANDART_SECTIONS } from './standart';

export interface HomepageHeroSlide {
  badge: string;
  title: string;
  subtitle: string;
}

export interface HomepageAward {
  title: string;
  issuer: string;
  year: string;
  /** Certificate / батламж image URL */
  image?: string;
}

export interface HomepagePartner {
  name: string;
  /** Partner logo URL */
  logo?: string;
}

export interface HomepageValue {
  title: string;
  desc: string;
}

export interface HomepageMachinery {
  name: string;
  count: string;
}

export interface HomepagePlant {
  title: string;
  capacity: string;
  detail: string;
}

export interface HomepageTechItem {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
}

export interface HomepageHrBenefit {
  icon: string;
  title: string;
  desc: string;
}

export interface HomepageHrStep {
  step: number;
  title: string;
  desc: string;
}

export interface HomepageHrPosition {
  title: string;
  type: string;
}

export interface HomepagePageHero {
  badge: string;
  title: string;
  subtitle: string;
}

export interface HomepageNewsArticle {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  date: string;
  category: string;
  image: string;
  isNew?: boolean;
}

export interface HomepageStandartCertificate {
  name: string;
  desc: string;
}

export interface HomepageStandartSection {
  id: string;
  label: string;
  title: string;
  /** TipTap HTML — preferred for long sections (paragraphs + lists). */
  body?: string;
  /** Legacy plain paragraphs; used when `body` is empty. */
  paragraphs: string[];
  /** Legacy bullet list; used when `body` is empty. */
  bullets?: string[];
}

export const DEFAULT_HERO_SLIDES: HomepageHeroSlide[] = [
  {
    badge: 'Your badge',
    title: 'Your headline goes here',
    subtitle:
      'Add your company story, services, and strengths from the homepage editor.',
  },
];

export const DEFAULT_AWARDS: HomepageAward[] = [];

export const DEFAULT_PARTNERS: HomepagePartner[] = [];

export const DEFAULT_VALUES: HomepageValue[] = [
  { title: 'ХҮН ТӨВТ', desc: 'Бидний үйл ажиллагаа хүний сайн сайхны төлөө чиглэнэ.' },
  { title: 'БАЙГАЛЬ, ОРЧИНД ЭЭЛТЭЙ', desc: 'Байгаль, хүрээлэн буй орчиндоо ээлтэйгээр ажиллана.' },
  { title: 'БҮТЭЭЛЧ СЭТГЭЛГЭЭ', desc: 'Шинэ санал санаачилга, илүү сайжрах эрмэлзлийг бид дэмжинэ.' },
  { title: 'ЁС ЗҮЙ', desc: 'Бизнесийн болон хувь хүний ёс зүйг өдөр тутамдаа баримтална.' },
  { title: 'ЧАНАР', desc: 'Бүтээн байгуулалт, гүйцэтгэл өндөр чанартай байна.' },
];

export const DEFAULT_DIRECTOR_PARAGRAPHS = [
  'Add a short director message from Admin → Homepage.',
];

export const DEFAULT_MACHINERY: HomepageMachinery[] = [
  { name: 'Экскаватор', count: '13 ширхэг' },
  { name: 'Бульдозер D8', count: '4 ширхэг' },
  { name: 'Бульдозер D6', count: '1 ширхэг' },
  { name: 'Доргиурт индүү', count: '14 ширхэг' },
  { name: 'Хийн дугуйт индүү', count: '5 ширхэг' },
  { name: 'Асфальт дэвсэгч', count: '3 ширхэг' },
  { name: 'Өөрөө буулгагч', count: '51 ширхэг' },
];

export const DEFAULT_PLANTS: HomepagePlant[] = [
  { title: 'Асфальт бетон хольц', capacity: 'Цагт 270 тонн', detail: 'LB2000, LB1500 маркийн үйлдвэрүүд тогтвортой ажиллаж байна.' },
  { title: 'СТВ хольц', capacity: 'Цагт 1400 тонн', detail: 'WBZ-800T, WBM-300 маркийн 2 ширхэг үйлдвэр.' },
  { title: 'Чулуу бутлан ангилах', capacity: 'Цагт 800 м³', detail: 'Power screen, Liming, Zenit явуулын болон суурин үйлдвэрүүд.' },
];

export const DEFAULT_TECH_STACK: HomepageTechItem[] = [
  {
    id: 'dekispart',
    title: 'Dekispart',
    summary: 'Замын тендерээс хүлээлгэн өгөх хүртэлх бүх бичиг баримтын ажлыг цахим хэлбэрээр гүйцэтгэх цогц программ.',
    bullets: [
      'Тендерийн материал бэлтгэхээс эхлээд замыг хүлээлгэж өгөх хүртэлх ажлыг хянах',
      'Ажлын төлөвлөгөө, график боловсруулах',
      'Зураг төсөл, хөндлөн дагуу огтлол боловсруулах',
      'Машин механизмын удирдлагын систем',
      'Явцын гүйцэтгэл, дижитал зурган хяналт',
      'Төмөр бетон бүтээгдэхүүний чанар шалгах систем',
    ],
  },
  {
    id: 'trimble',
    title: 'Trimble Business Center (HCE)',
    summary: 'Авто замын ажилд зориулагдсан оффисын программ — талбар болон оффисын мэдээллийн урсгалыг нэгтгэн удирдана.',
    bullets: [
      'Олон эх сурвалжаас мэдээлэл авч нэгдсэн үр дүн гаргах',
      'Ажлын бүтээмжийг нэмэгдүүлж, алдааны зардлыг бууруулах',
      'Trimble 3D машин удирдлагын системтэй холбогдох',
      'Connected Site — оффис, радио, машин удирдлагын 3 хэсэг',
      '3D загварт холбогдон хөрс хуулалт, тэгшлэх ажлыг нарийвчлалтай гүйцэтгэх',
    ],
  },
  {
    id: 'excavator-scale',
    title: 'Excavator Scale',
    summary: 'Экскаваторын шанаганд суурилуулсан жингийн хэмжилт — газар шорооны ажлын бодит тоо хэмжээг нарийвчлан бүртгэнэ.',
    bullets: [
      'Цикл бүрт шорооны жинг хэмжиж, ачилтын хэмжээг бодитоор тооцох',
      'Үргүй зардлыг багасгах, ажлын явцыг өдөр бүр хянах',
      'Инженерт өдрийн ажлын мэдээг шуурхай хүргэх',
      '2015 оноос зам барилгын ажлын явцад амжилттай ашиглаж байна',
    ],
  },
];

export const DEFAULT_HR_BENEFITS: HomepageHrBenefit[] = [
  { icon: 'rise', title: 'Карьерын боломж', desc: 'Ажил, албан тушаалын хувьд өсөж, хөгжих боломж.' },
  { icon: 'team', title: 'Эвтэй хамт олон', desc: 'Эерэг зөв хандлагатай, ёс зүйг эрхэмлэдэг багтай хамтран ажиллах.' },
  { icon: 'heart', title: 'Эерэг соёл', desc: 'Ажилтнуудын дуу хоолойг сонсож, хамтран шийдвэр гаргах орчин.' },
  { icon: 'check', title: 'Нэмэлт боломж', desc: 'Хөнгөлөлт, орон байрны дэмжлэг, зусланд гарах боломж зэрэг.' },
  { icon: 'safety', title: 'Эрүүл, аюулгүй орчин', desc: 'Тав тухтай, тохилог оффис, аюулгүй ажиллагааны стандарт.' },
];

export const DEFAULT_HR_STEPS: HomepageHrStep[] = [
  { step: 1, title: 'Анкет бөглөх', desc: 'Нээлттэй ажлын байранд анкет илгээнэ.' },
  { step: 2, title: 'Анхан шатны ярилцлага', desc: 'HR болон шууд удирдлагатай танилцах.' },
  { step: 3, title: 'Тестийн шалгалт', desc: 'Мэргэжлийн болон ерөнхий чадварын үнэлгээ.' },
  { step: 4, title: 'Эцсийн ярилцлага', desc: 'Гүйцэтгэх удирдлагатай эцсийн шатны ярилцлага.' },
  { step: 5, title: 'Шийдвэр, санал', desc: 'Шалгаруулалтын үр дүнг мэдэгдэн, санал тавина.' },
];

export const DEFAULT_HR_POSITIONS: HomepageHrPosition[] = [
  { title: 'Геодезийн инженер', type: 'Байнгын' },
  { title: 'Дугуйт экскаваторын оператор', type: 'Байнгын' },
  { title: 'Авто ачигчийн оператор', type: 'Байнгын' },
  { title: 'Эрүүл ахуйч эмч', type: 'Байнгын' },
  { title: 'Лабораторийн туслах ажилтан', type: 'Байнгын' },
  { title: 'Бутлуурын үйлдвэрийн туслах ажилтан', type: 'Байнгын' },
  { title: 'Авто замын тулах ажилтан', type: 'Гэрээт' },
  { title: 'Төслийн нягтлан бодогч', type: 'Түр ажлын байр' },
  { title: 'ХЭМАБ ажилтан', type: 'Түр ажлын байр' },
  { title: 'Сэлбэгийн нягтлан бодогч', type: 'Түр ажлын байр' },
  { title: 'Няравын туслах', type: 'Түр ажлын байр' },
];

export const DEFAULT_FOOTER_SERVICES = [
  'Замын барилга',
  'Асфальт хучилт',
  'Гүүр, дэд бүтэц',
  'Төслийн удирдлага',
];

export const DEFAULT_NEWS_ARTICLES: HomepageNewsArticle[] = [
  {
    id: '175376',
    title: 'Таны бизнест хүч нэмэх техникүүдийг бид худалдаалж байна.',
    excerpt:
      'Манай компани зам барилга, тээвэр ложистикийн зориулалттай ашиглагдаж байсан хүнд даацын техник, тоног төхөөрөмжүүдийг худалдаалж байна.',
    body:
      'Манай компани зам барилга, тээвэр ложистикийн зориулалттай ашиглагдаж байсан хүнд даацын техник, тоног төхөөрөмжүүдийг худалдаалж байна. Экскаватор, бульдозер, өөрөө буулгагч зэрэг техникүүдийг захиалагчдын хэрэгцээнд нийцүүлэн санал болгож байна.\n\nДэлгэрэнгүй мэдээлэл авахыг хүссэн байгууллага, хувь хүн бидэнтэй холбогдоно уу.',
    date: '2026-05-20',
    category: 'Компанийн мэдээлэл',
    image: '/p1.png',
    isNew: true,
  },
  {
    id: '168981',
    title: 'Хамтран ажиллахыг урьж байна',
    excerpt:
      'Улаанбаатар хот Өнөр-Баянхошуу чиглэлийн 8.3 км авто замын борооны ус зайлуулах шугамын газар шорооны ажилд үнийн санал ирүүлж хамтран ажиллахыг урьж байна.',
    body:
      'Улаанбаатар хот Өнөр-Баянхошуу чиглэлийн 8.3 км авто замын борооны ус зайлуулах шугамын газар шорооны ажилд үнийн санал ирүүлж хамтран ажиллахыг урьж байна.\n\nТендерийн баримт бичиг, техникийн нөхцөлийн дэлгэрэнгүй мэдээллийг манай оффисоос авна уу.',
    date: '2025-10-10',
    category: 'Тендер',
    image: '/p2.png',
    isNew: true,
  },
  {
    id: '169064',
    title: '"Zero to Road" ажил мэргэжлийн уралдаан амжилттай үргэлжилж дууслаа.',
    excerpt:
      'Монгол Улсад авто замын салбар үүсэж хөгжсөний 96 жилийн ойд зориулсан "Zero to Road" ажил мэргэжлийн уралдаан амжилттай үргэлжилж дууслаа.',
    body:
      'Монгол Улсад авто замын салбар үүсэж хөгжсөний 96 жилийн ойд зориулсан "Zero to Road" ажил мэргэжлийн уралдаан амжилттай үргэлжилж дууслаа. Манай компанийн төлөөлөгчид замчин, экскаваторын оператор төрлүүдээр өрсөлдөн оролцож, сайн үр дүн гаргалаа.',
    date: '2025-09-30',
    category: 'Компанийн мэдээлэл',
    image: '/p3.png',
    isNew: true,
  },
  {
    id: '166048',
    title: 'Өнөр хороолол гудамжийг иж бүрэн гудамж зам болгон хөгжүүлэх ажлын танилцуулга',
    excerpt:
      'Өнөр хороолол гудамжийг иж бүрэн гудамж зам болгон хөгжүүлэх зам барилгын ажлыг амжилттай эхлүүлээд байна.',
    body:
      'Өнөр хороолол гудамжийг иж бүрэн гудамж зам болгон хөгжүүлэх зам барилгын ажлыг амжилттай эхлүүлээд байна. Төслийн хүрээнд хатуу хучилт, зураг төсөл, гүйцэтгэлийн бүх үе шатыг олон улсын стандартаар хэрэгжүүлж байна.',
    date: '2025-05-01',
    category: 'Төсөл',
    image: '/p1.png',
    isNew: true,
  },
  {
    id: '166047',
    title: 'Үйлдвэрчний эвлэлийн гудамжийг иж бүрэн гудамж зам болгон хөгжүүлэх ажлын танилцуулга',
    excerpt:
      'Баянхошууны гудамжийг иж бүрэн гудамж зам болгон хөгжүүлэх зам барилгын ажлыг амжилттай эхлүүлээд байна.',
    body:
      'Үйлдвэрчний эвлэлийн (Баянхошууны) гудамжийг иж бүрэн гудамж зам болгон хөгжүүлэх зам барилгын ажлыг амжилттай эхлүүлээд байна. Орон нутгийн иргэдэд тав тухтай, аюулгүй орчин бүрдүүлэх зорилгоор хурдан темптэй ажиллаж байна.',
    date: '2025-04-29',
    category: 'Төсөл',
    image: '/p2.png',
    isNew: true,
  },
  {
    id: '166039',
    title: 'Баянхошууны гудамжийн зам барилгын талаар олон нийтэд мэдээлэл хүргэх уулзалт',
    excerpt:
      'Үйлдвэрчний эвлэлийн гудамжийг иж бүрэн гудамж зам болгон хөгжүүлэх ажилтай холбогдуулан олон нийтэд мэдээлэл хүргэх уулзалтыг зохион байгууллаа.',
    body:
      'Үйлдвэрчний эвлэлийн гудамж (Баянхошууны гудамж)-ийг иж бүрэн гудамж болгох зам барилгын ажилтай холбогдуулан олон нийтэд мэдээлэл хүргэх уулзалтыг зохион байгууллаа. Төслийн явц, аюулгүй байдал, оршин суугчдад учирч болзошгүй нөлөөллийн талаар иргэдийн асуултад хариуллаа.',
    date: '2025-04-18',
    category: 'Төсөл',
    image: '/p3.png',
  },
  {
    id: '166046',
    title: 'Өнөр хорооллын гудамжийн зам барилгын талаар олон нийтэд мэдээлэл хүргэх уулзалт',
    excerpt:
      'Өнөр хорооллын гудамжийг иж бүрэн гудамж зам болгон хөгжүүлэх ажилтай холбогдуулан олон нийтэд мэдээлэл хүргэх уулзалтыг зохион байгууллаа.',
    body:
      'Өнөр хорооллын гудамжийг иж бүрэн гудамж зам болгон хөгжүүлэх зам барилгын ажилтай холбогдуулан олон нийтэд мэдээлэл хүргэх уулзалтыг зохион байгууллаа. Төслийн инженер, удирдлагын баг иргэдэд дэлгэрэнгүй тайлбар өгч, санал хүсэлтийг хүлээн авлаа.',
    date: '2025-04-17',
    category: 'Төсөл',
    image: '/p1.png',
  },
  {
    id: '157927',
    title: 'Ажил мэргэжлийн уралдааны эхний шатанд "ДЭД" байранд шалгарлаа.',
    excerpt: 'Тэмцээний Замчин төрөлд "дэд" байранд шалгарлаа.',
    body:
      'Ажил мэргэжлийн уралдааны эхний шатанд манай компанийн төлөөлөгч Замчин төрөлд "дэд" байранд шалгарлаа. Дараагийн шатанд амжилттай оролцож, салбарын мэргэжилтнүүдийн чадварыг харуулах болно.',
    date: '2024-08-19',
    category: 'Компанийн мэдээлэл',
    image: '/p2.png',
  },
  {
    id: '155960',
    title: 'Витаминжуулалтын аян, нийт ажилчдын хурал амжилттай зохион байгуулагдлаа.',
    excerpt:
      'Компаний удирдлагын баг бүрэлдэхүүн байгууллагын стратегийн бодлогыг танилцуулахаас гадна ажилчдын санал, гомдлыг хүлээн авч хэлэлцлээ.',
    body:
      'Витаминжуулалтын аян, нийт ажилчдын хурал амжилттай зохион байгуулагдлаа. Компаний удирдлагын баг бүрэлдэхүүн байгууллагын стратегийн бодлогыг танилцуулахаас гадна ажилчдын санал, гомдлыг хүлээн авч хэлэлцлээ.',
    date: '2024-05-24',
    category: 'Компанийн мэдээлэл',
    image: '/p3.png',
  },
];

export const DEFAULT_LANDING_PAGE_FIELDS = {
  awards_label: 'ШАГНАЛ УРАМШУУЛАЛ',
  awards_title: 'Салбартаа хүлээн зөвшөөрөгдсөн амжилтууд',
  partners_label: 'Хамтран ажилласан байгууллагууд',
  partners_title: 'Итгэл харилцаанд суурилсан хамтын ажиллагаа',
  about_hero_badge: 'КОМПАНИ',
  about_hero_title: 'Бидний тухай',
  director_image: '/p1.png',
  director_role: 'Гүйцэтгэх захирал',
  mission_text:
    'Монгол Улсын хатуу дэд бүтцийг дэлхийн жишгээр бүтээн, иргэдийн амьдралын чанарыг сайжруулах зам, гүүр, дэд бүтцийн шийдлийг хүргэх.',
  vision_text:
    'Олон улсын стандартад нийцсэн аюулгүй ажиллагаа, техник технологийн хэрэглээг дэлхийн түвшинд хүргэсэн, чадварлаг инженерийн баг бүхий салбарын тэргүүлэгч компани болох.',
  technology_hero: {
    badge: 'ИННОВАЦ',
    title: 'Технологи',
    subtitle:
      'Дэлхийн стандартын техник, тоног төхөөрөмж болон дэвшилтэт программ хангамжаар замын төслийг чанартай, хугацаанд нь хэрэгжүүлнэ.',
  } satisfies HomepagePageHero,
  projects_hero: {
    badge: 'ТӨСЛҮҮД',
    title: 'Төслүүд',
    subtitle: 'Монгол Улсын өнцөг булан бүрт гүйцэтгэсэн, явагдаж буй замын төслүүд.',
  } satisfies HomepagePageHero,
  hr_hero: {
    badge: 'КАРЬЕР',
    title: 'Ажлын байр',
    subtitle: 'Монгол Улсын дэд бүтцийн томоохон төслүүд дээр мэргэжлээ хөгжүүлээрэй.',
  } satisfies HomepagePageHero,
  news_hero: {
    badge: 'МЭДЭЭЛЭЛ',
    title: 'Мэдээлэл',
    subtitle: 'Компанийн сүүлийн үеийн мэдээ, төслийн мэдээлэл, тендерийн зар.',
  } satisfies HomepagePageHero,
  standart_hero: {
    badge: 'СТАНДАРТ',
    title: 'Стандарт & ХЭМАБ',
    subtitle: 'Чанар, аюулгүй байдал, байгаль орчны удирдлагын тогтолцоо — олон улсын стандартад нийцсэн үйл ажиллагаа.',
  } satisfies HomepagePageHero,
  technology_machinery_text1:
    'Манай компанийн техникийн газар нь 150 гаруй машин механизмыг удирдан зохион байгуулж, бэлэн байдлыг ханган ажиллаж байна. Техникийн ухааны магистраар удирдуулсан баг хамт олонд Монгол Улсын онц тээвэрчин 15 хүн ажиллаж, авто замын бүтээн байгуулалтад нөр их ажлыг гүйцэтгэж байна.',
  technology_machinery_text2:
    'Дэлхийн бусад улс оронд авто замын ажилд түгээмэл ашиглагддаг сүүлийн үеийн техник, тоног төхөөрөмжүүдээс:',
  hr_training_title: 'Сургалт, хөгжил',
  hr_training_text:
    'Ажилтнуудын мэргэжлийн ур чадвар, аюулгүй ажиллагааны мэдлэгийг байнга дээшлүүлэх зорилгоор дотоод болон гадаад сургалтад хамруулдаг.',
  hero_slides: DEFAULT_HERO_SLIDES,
  awards: DEFAULT_AWARDS,
  partners: DEFAULT_PARTNERS,
  values: DEFAULT_VALUES,
  director_paragraphs: DEFAULT_DIRECTOR_PARAGRAPHS,
  machinery: DEFAULT_MACHINERY,
  plants: DEFAULT_PLANTS,
  tech_stack: DEFAULT_TECH_STACK,
  hr_benefits: DEFAULT_HR_BENEFITS,
  hr_steps: DEFAULT_HR_STEPS,
  hr_positions: DEFAULT_HR_POSITIONS,
  footer_services: DEFAULT_FOOTER_SERVICES,
  news_articles: DEFAULT_NEWS_ARTICLES,
  standart_certificates: STANDART_CERTIFICATES as HomepageStandartCertificate[],
  standart_sections: STANDART_SECTIONS as HomepageStandartSection[],
};

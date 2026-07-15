/** Platform marketing catalog — mirrors backend module groups for rcos.mn landing. */

export type PlatformModule = {
  id: string;
  label: string;
  blurb: string;
};

export const PLATFORM_ERP_MODULES: PlatformModule[] = [
  {
    id: "road-engineering",
    label: "Замын инженеринг",
    blurb: "Трасса, хөндлөн огтлол, газрын ажил, хучилт, зураг төсөл.",
  },
  {
    id: "operations",
    label: "Үйл ажиллагаа",
    blurb: "Төсөл, ажлын даалгавар, өдөр тутмын явц, тайлан.",
  },
  {
    id: "hr",
    label: "Хүний нөөц",
    blurb: "Ажилтан, бүтэц, чөлөө, цалин, нэгдсэн бүртгэл.",
  },
  {
    id: "finance",
    label: "Санхүү",
    blurb: "Гүйлгээ, төсөв, зардал, компанийн санхүүгийн хяналт.",
  },
  {
    id: "inventory",
    label: "Агуулах",
    blurb: "Бараа материал, нөөц, хөдөлгөөн, захиалга.",
  },
  {
    id: "fleet",
    label: "Шатахуун / авто",
    blurb: "Шатахуун худалдан авалт, зарцуулалт, автопарк.",
  },
  {
    id: "equipment",
    label: "Техник",
    blurb: "Машин механизм, түрээс, ашиглалт.",
  },
  {
    id: "hse",
    label: "ХАБЭА",
    blurb: "Эрсдэл, осол, сургалт, зөвшөөрөл, аюулгүй ажиллагаа.",
  },
  {
    id: "plant",
    label: "Үйлдвэр",
    blurb: "Үйлдвэрийн талбай, бүтээгдэхүүн, өдрийн тайлан.",
  },
  {
    id: "tender",
    label: "Тендер",
    blurb: "Тендерийн баримт, санал, AI дэмжлэгтэй бэлтгэл.",
  },
  {
    id: "document",
    label: "Баримт бичиг",
    blurb: "Дотоод баримт, стандарт, хадгалалт.",
  },
  {
    id: "homepage",
    label: "Нүүр хуудас",
    blurb: "Байгууллагын нийтийн сайт, мэдээ, төслүүд.",
  },
];

export const PLATFORM_DATA_MODULES: PlatformModule[] = [
  {
    id: "data-factory",
    label: "Үйлдвэр",
    blurb: "Батлагдсан үйлдвэрийн газрын зураг, нэгдсэн мэдээллийн сан.",
  },
  {
    id: "data-technique",
    label: "Техник",
    blurb: "Техникийн бүртгэл, байршил, ашиглалтын өгөгдөл.",
  },
  {
    id: "data-brigade",
    label: "Бригад",
    blurb: "Бригадын бүтэц, хүчин чадал, байршил.",
  },
  {
    id: "data-laboratory",
    label: "Лаборатори",
    blurb: "Лабораторийн үр дүн, чанарын бүртгэл.",
  },
  {
    id: "data-job-seeker",
    label: "Ажил хайгч",
    blurb: "Ажил хайгчдын нэгдсэн бүртгэл.",
  },
  {
    id: "data-student",
    label: "Оюутан",
    blurb: "Оюутны дадлага, холбоо барих мэдээлэл.",
  },
  {
    id: "data-road-sign",
    label: "Замын тэмдэг",
    blurb: "Замын тэмдгийн каталог, байршил.",
  },
];

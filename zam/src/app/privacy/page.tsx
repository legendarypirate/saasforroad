import React from 'react';
import Head from 'next/head';

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy | Замын Төслийн Апп</title>
        <meta name="description" content="Privacy Policy for Замын Төслийн Апп" />
      </Head>
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Нууцлалын бодлого</h1>
        <p className="mb-4">
          Энэхүү нууцлалын бодлого нь манай компанийн гар утасны апп (цаашид “Апп” гэх)-ыг
          ашиглаж буй хэрэглэгчдийн хувийн мэдээллийг хэрхэн цуглуулж, ашиглаж, хамгаалж байгааг
          тайлбарлаж байна.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">1. Цуглуулах мэдээлэл</h2>
        <ul className="list-disc pl-5 mb-4">
          <li>Хэрэглэгчийн нэр, утасны дугаар</li>
          <li>Байршлын мэдээлэл (зөвшөөрөл өгсөн тохиолдолд)</li>
          <li>Төслийн өгөгдөл болон апп ашиглалтын мэдээлэл</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-2">2. Мэдээллийг ашиглах</h2>
        <p className="mb-4">
          Бид таны мэдээллийг зөвхөн дараах зорилгоор ашиглана:
        </p>
        <ul className="list-disc pl-5 mb-4">
          <li>Апп-ийн үйл ажиллагааг сайжруулах</li>
          <li>Төслийн явц, байршлыг хянах</li>
          <li>Аюулгүй байдал болон хэрэглэгчийн дэмжлэг үзүүлэх</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-2">3. Гуравдагч этгээдэд мэдээлэл өгөх</h2>
        <p className="mb-4">
          Бид таны мэдээллийг ямар ч тохиолдолд хэн нэгэн гуравдагч этгээдэд худалдах, түрээслэх
          болон хуваалцахгүй. Харин хууль эрх зүйн шаардлага гарсан тохиолдолд хуулийн байгууллагад
          өгөх боломжтой.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">4. Мэдээллийн хамгаалалт</h2>
        <p className="mb-4">
          Бид таны мэдээллийг аюулгүй байлгах үүднээс зохих техник болон зохион байгуулалтын
          арга хэмжээг авдаг.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">5. Холбоо барих</h2>
        <p className="mb-4">
          Хэрвээ та энэхүү нууцлалын бодлоготой холбоотой асуулт байвал бидэнтэй дараах
          хаягаар холбоо барина уу:
        </p>
        <p className="mb-2">Имэйл: info@vlemjiinzam.mn</p>
        <p>Утас: +976 99261745</p>

        <p className="text-sm text-gray-500 mt-10">Шинэчилсэн огноо: 2025-07-13</p>
      </main>
    </>
  );
}

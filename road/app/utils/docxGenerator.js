const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
} = require("docx");

function cell(text, bold = false) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text: String(text ?? "—"), bold, size: 22 })],
      }),
    ],
  });
}

function sectionTitle(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
  });
}

function bodyParagraph(text) {
  return new Paragraph({
    children: [new TextRun({ text: String(text ?? ""), size: 22 })],
    spacing: { after: 120 },
  });
}

function buildEngineerTable(doc, index) {
  const data = doc.extracted_data || {};
  const typeLabel = doc.doc_type || "other";

  return [
    sectionTitle(`${index + 1}. ${doc.engineer_name || data.full_name || "Инженер"} — ${typeLabel}`),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [cell("Талбар", true), cell("Утга", true)] }),
        new TableRow({ children: [cell("Овог нэр"), cell(data.full_name)] }),
        new TableRow({ children: [cell("Регистрийн дугаар"), cell(data.register_number)] }),
        new TableRow({ children: [cell("Үнэмжлэхийн дугаар"), cell(data.certificate_number)] }),
        new TableRow({ children: [cell("Мэргэжил / чиглэл"), cell(data.specialization)] }),
        new TableRow({ children: [cell("Зэрэг"), cell(data.degree_level)] }),
        new TableRow({ children: [cell("Олгосон огноо"), cell(data.issue_date)] }),
        new TableRow({ children: [cell("Дуусах огноо"), cell(data.expiry_date)] }),
        new TableRow({ children: [cell("Олгосон байгууллага"), cell(data.issuing_organization)] }),
        new TableRow({ children: [cell("И-Монгол лавлагаа"), cell(data.imongolia_reference)] }),
        new TableRow({ children: [cell("И-Монгол баталгаажсан"), cell(data.imongolia_verified_at)] }),
        new TableRow({ children: [cell("Утас"), cell(data.phone)] }),
        new TableRow({ children: [cell("И-мэйл"), cell(data.email)] }),
        new TableRow({ children: [cell("Хаяг"), cell(data.address)] }),
        new TableRow({ children: [cell("Ажлын туршлага"), cell(data.work_experience_years)] }),
        new TableRow({ children: [cell("Нэмэлт"), cell(data.additional_notes)] }),
      ],
    }),
    bodyParagraph(""),
  ];
}

async function generateTenderDocx(tenderPackage, documents) {
  const processed = documents.filter((d) => d.status === "processed");

  const children = [
    new Paragraph({
      text: "ТЕНДЕРИЙН МАТЕРИАЛ",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    bodyParagraph(`Тендерийн нэр: ${tenderPackage.title}`),
    bodyParagraph(`Тендерийн дугаар: ${tenderPackage.tender_number || "—"}`),
    bodyParagraph(`Төслийн нэр: ${tenderPackage.project_name || "—"}`),
    bodyParagraph(`Захиалагч: ${tenderPackage.client_name || "—"}`),
    bodyParagraph(`Бэлтгэсэн огноо: ${new Date().toLocaleDateString("mn-MN")}`),
    bodyParagraph(""),
    sectionTitle("1. Ерөнхий тайлбар"),
    bodyParagraph(
      tenderPackage.notes ||
        "Энэхүү баримт бичиг нь инженерийн үнэмжлэх, и-монгол лавлагаа зэрэг хавсралт баримтуудаас автоматаар боловсруулагдсан тендерийн материал юм."
    ),
    sectionTitle("2. Инженерийн болон хавсаргасан баримтууд"),
  ];

  if (processed.length === 0) {
    children.push(bodyParagraph("Боловсруулсан баримт байхгүй байна."));
  } else {
    processed.forEach((doc, idx) => {
      children.push(...buildEngineerTable(doc, idx));
    });
  }

  children.push(
    sectionTitle("3. Баталгаажуулалт"),
    bodyParagraph(
      "Дээрх мэдээлэл нь хавсаргасан албан ёсны баримт бичгүүдээс AI системээр задлан боловсруулагдсан бөгөөд эцсийн хяналт, баталгаажуулалтыг хариуцсан инженер хийнэ."
    )
  );

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const buffer = await Packer.toBuffer(doc);
  const safeName = (tenderPackage.title || "tender")
    .replace(/[^\w\u0400-\u04FF\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_");
  const filename = `tender_${safeName}_${Date.now()}.docx`;
  const outDir = path.join(__dirname, "..", "assets", "tender-exports");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, filename);
  fs.writeFileSync(outPath, buffer);

  return { filename, outPath, relativePath: `/assets/tender-exports/${filename}` };
}

module.exports = { generateTenderDocx };

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const OpenAI = require("openai");

const DOC_TYPE_LABELS = {
  engineer_certificate: "Инженерийн үнэмжлэх",
  imongolia: "И-Монгол лавлагаа",
  id_card: "Иргэний үнэмлэх",
  diploma: "Диплом",
  employment: "Ажиллах чадварын лавлагаа",
  other: "Бусад баримт",
};

const EXTRACTION_SCHEMA = `{
  "full_name": "бүтэн нэр",
  "register_number": "регистрийн дугаар",
  "certificate_number": "үнэмжлэхийн дугаар",
  "specialization": "мэргэжил / чиглэл",
  "degree_level": "зэрэг (бакалавр, магистр гэх мэт)",
  "issue_date": "олгосон огноо",
  "expiry_date": "дуусах огноо",
  "issuing_organization": "олгосон байгууллага",
  "imongolia_reference": "и-монгол лавлагааны дугаар/код",
  "imongolia_verified_at": "и-монгол баталгаажсан огноо",
  "phone": "утас",
  "email": "и-мэйл",
  "address": "хаяг",
  "work_experience_years": "ажлын туршлага (жил)",
  "additional_notes": "нэмэлт тайлбар"
}`;

function getClient() {
  const apiKey = (process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY тохируулаагүй байна. road/.env файлд OPENAI_API_KEY=sk-... нэмээд road серверийг дахин асаана уу."
    );
  }
  return new OpenAI({ apiKey });
}

async function readPdfText(filePath) {
  try {
    const pdfParse = require("pdf-parse");
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return (data.text || "").trim();
  } catch {
    return "";
  }
}

function fileToBase64Image(filePath, mimeType) {
  const buffer = fs.readFileSync(filePath);
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

async function extractFromText(text, docType) {
  const client = getClient();
  const label = DOC_TYPE_LABELS[docType] || docType;

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Та Монгол улсын тендерийн баримт бичгээс мэдээлэл задлах мэргэжилтэн. Зөвхөн JSON буцаана. Мэдээлэл олдохгүй бол хоосон string үлдээнэ.",
      },
      {
        role: "user",
        content: `Баримтын төрөл: ${label}\n\nДоорх текстээс тендерийн материалд хэрэгтэй мэдээллийг задлан JSON болгоно уу.\n\nСхем:\n${EXTRACTION_SCHEMA}\n\nТекст:\n${text}`,
      },
    ],
    temperature: 0.1,
  });

  const raw = response.choices[0]?.message?.content || "{}";
  return JSON.parse(raw);
}

async function extractFromImage(filePath, mimeType, docType) {
  const client = getClient();
  const label = DOC_TYPE_LABELS[docType] || docType;
  const imageUrl = fileToBase64Image(filePath, mimeType);

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Та Монгол улсын албан ёсны баримт (үнэмжлэх, и-монгол лавлагаа, иргэний үнэмлэх) зургаас мэдээлэл уншдаг мэргэжилтэн. Зөвхөн JSON буцаана.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Баримтын төрөл: ${label}\n\nЗургаас тендерийн материалд хэрэгтэй мэдээллийг монгол хэлээр задлан доорх JSON схемээр буцаана уу:\n${EXTRACTION_SCHEMA}`,
          },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
    temperature: 0.1,
  });

  const raw = response.choices[0]?.message?.content || "{}";
  return JSON.parse(raw);
}

async function extractDocument(filePath, mimeType, docType) {
  const isImage = mimeType?.startsWith("image/");
  const isPdf = mimeType === "application/pdf" || filePath.toLowerCase().endsWith(".pdf");

  if (isImage) {
    return extractFromImage(filePath, mimeType, docType);
  }

  if (isPdf) {
    const text = await readPdfText(filePath);
    if (text.length > 40) {
      return extractFromText(text, docType);
    }
    throw new Error(
      "PDF-д текст олдсонгүй. Сканнердсан PDF бол зураг (JPG/PNG) хэлбэрээр дахин upload хийнэ үү."
    );
  }

  throw new Error("Зөвхөн JPG, PNG, PDF файл дэмжигдэнэ.");
}

module.exports = {
  extractDocument,
  DOC_TYPE_LABELS,
};

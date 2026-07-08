'use client';

import { Button, Card, Divider, Form, Input } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import SectionDataTable from './SectionDataTable';

function pageHeroFields(prefix: string) {
  return (
    <>
      <Form.Item name={[prefix, 'badge']} label="Тэмдэглэгээ">
        <Input />
      </Form.Item>
      <Form.Item name={[prefix, 'title']} label="Гарчиг">
        <Input />
      </Form.Item>
      <Form.Item name={[prefix, 'subtitle']} label="Тайлбар">
        <Input.TextArea rows={2} />
      </Form.Item>
    </>
  );
}

export function getLandingAdminTabs() {
  return [
    {
      key: 'hero-slides',
      label: 'Hero слайд',
      children: (
        <SectionDataTable
          name="hero_slides"
          modalTitle="Hero слайд"
          addLabel="Нэмэх"
          defaultRow={{ badge: '', title: '', subtitle: '' }}
          columns={[
            { key: 'badge', title: 'Тэмдэглэгээ', width: 160 },
            { key: 'title', title: 'Гарчиг', width: 220 },
            { key: 'subtitle', title: 'Тайлбар' },
          ]}
          fields={[
            { name: 'badge', label: 'Тэмдэглэгээ' },
            { name: 'title', label: 'Гарчиг', rules: [{ required: true, message: 'Заавал' }] },
            { name: 'subtitle', label: 'Тайлбар', type: 'textarea' },
          ]}
        />
      ),
    },
    {
      key: 'awards-partners',
      label: 'Шагнал & Хамтрагч',
      children: (
        <>
          <Form.Item name="awards_label" label="Шагнал — хэсгийн нэр">
            <Input />
          </Form.Item>
          <Form.Item name="awards_title" label="Шагнал — гарчиг">
            <Input />
          </Form.Item>
          <SectionDataTable
            name="awards"
            modalTitle="Шагнал"
            addLabel="Нэмэх"
            defaultRow={{ title: '', issuer: '', year: '' }}
            columns={[
              { key: 'title', title: 'Гарчиг', width: 200 },
              { key: 'issuer', title: 'Олгосон байгууллага' },
              { key: 'year', title: 'Он', width: 80 },
            ]}
            fields={[
              { name: 'title', label: 'Гарчиг', rules: [{ required: true, message: 'Заавал' }] },
              { name: 'issuer', label: 'Олгосон байгууллага', type: 'textarea' },
              { name: 'year', label: 'Он' },
            ]}
          />
          <Divider />
          <Form.Item name="partners_label" label="Хамтрагч — хэсгийн нэр">
            <Input />
          </Form.Item>
          <Form.Item name="partners_title" label="Хамтрагч — гарчиг">
            <Input />
          </Form.Item>
          <SectionDataTable
            name="partners"
            modalTitle="Хамтрагч"
            addLabel="Нэмэх"
            defaultRow={{ name: '' }}
            columns={[{ key: 'name', title: 'Байгууллагын нэр' }]}
            fields={[{ name: 'name', label: 'Байгууллагын нэр', rules: [{ required: true, message: 'Заавал' }] }]}
          />
        </>
      ),
    },
    {
      key: 'about-full',
      label: 'About хуудас',
      children: (
        <>
          <Form.Item name="about_hero_badge" label="Hero тэмдэглэгээ">
            <Input />
          </Form.Item>
          <Form.Item name="about_hero_title" label="Hero гарчиг">
            <Input />
          </Form.Item>
          <Form.Item name="director_role" label="Захирлын албан тушаал">
            <Input />
          </Form.Item>
          <SectionDataTable
            name="director_paragraphs"
            modalTitle="Захирлын мэндчилгээ"
            addLabel="Нэмэх"
            defaultRow=""
            columns={[{ key: '_scalar', title: 'Текст' }]}
            fields={[{ name: '_scalar', label: 'Текст', type: 'richtext', rules: [{ required: true, message: 'Заавал' }] }]}
          />
          <Divider />
          <Form.Item name="mission_text" label="Эрхэм зорилго">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="vision_text" label="Алсын хараа">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Divider />
          <SectionDataTable
            name="values"
            modalTitle="Үнэт зүйл"
            addLabel="Нэмэх"
            defaultRow={{ title: '', desc: '' }}
            columns={[
              { key: 'title', title: 'Гарчиг', width: 180 },
              { key: 'desc', title: 'Тайлбар' },
            ]}
            fields={[
              { name: 'title', label: 'Гарчиг', rules: [{ required: true, message: 'Заавал' }] },
              { name: 'desc', label: 'Тайлбар', type: 'textarea' },
            ]}
          />
        </>
      ),
    },
    {
      key: 'technology',
      label: 'Технологи',
      children: (
        <>
          {pageHeroFields('technology_hero')}
          <Form.Item name="technology_machinery_text1" label="Машин механизм — текст 1">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="technology_machinery_text2" label="Машин механизм — текст 2">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Divider />
          <SectionDataTable
            name="machinery"
            modalTitle="Машин механизм"
            addLabel="Нэмэх"
            defaultRow={{ name: '', count: '' }}
            columns={[
              { key: 'name', title: 'Нэр', width: 220 },
              { key: 'count', title: 'Тоо', width: 120 },
            ]}
            fields={[
              { name: 'name', label: 'Нэр', rules: [{ required: true, message: 'Заавал' }] },
              { name: 'count', label: 'Тоо' },
            ]}
          />
          <Divider />
          <SectionDataTable
            name="plants"
            modalTitle="Үйлдвэр"
            addLabel="Нэмэх"
            defaultRow={{ title: '', capacity: '', detail: '' }}
            columns={[
              { key: 'title', title: 'Гарчиг', width: 180 },
              { key: 'capacity', title: 'Хүчин чадал', width: 140 },
              { key: 'detail', title: 'Дэлгэрэнгүй' },
            ]}
            fields={[
              { name: 'title', label: 'Гарчиг', rules: [{ required: true, message: 'Заавал' }] },
              { name: 'capacity', label: 'Хүчин чадал' },
              { name: 'detail', label: 'Дэлгэрэнгүй', type: 'richtext' },
            ]}
          />
          <Divider />
          <Form.List name="tech_stack">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Card key={field.key} size="small" style={{ marginBottom: 12 }}>
                    <Form.Item {...field} name={[field.name, 'id']} label="ID">
                      <Input />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'title']} label="Гарчиг">
                      <Input />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'summary']} label="Тайлбар">
                      <Input.TextArea rows={2} />
                    </Form.Item>
                    <SectionDataTable
                      name={['tech_stack', field.name, 'bullets']}
                      modalTitle="Жагсаалтын мөр"
                      addLabel="Мөр нэмэх"
                      defaultRow=""
                      columns={[{ key: '_scalar', title: 'Мөр' }]}
                      fields={[{ name: '_scalar', label: 'Мөр', rules: [{ required: true, message: 'Заавал' }] }]}
                    />
                    <Button danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} style={{ marginTop: 8 }}>
                      Технологи устгах
                    </Button>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  block
                  onClick={() => add({ id: '', title: '', summary: '', bullets: [] })}
                  icon={<PlusOutlined />}
                >
                  Технологи нэмэх
                </Button>
              </>
            )}
          </Form.List>
        </>
      ),
    },
    {
      key: 'hr',
      label: 'Ажлын байр',
      children: (
        <>
          {pageHeroFields('hr_hero')}
          <Form.Item name="hr_training_title" label="Сургалтын гарчиг">
            <Input />
          </Form.Item>
          <Form.Item name="hr_training_text" label="Сургалтын текст">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Divider />
          <SectionDataTable
            name="hr_benefits"
            modalTitle="Давуу тал"
            addLabel="Нэмэх"
            defaultRow={{ icon: 'check', title: '', desc: '' }}
            columns={[
              { key: 'title', title: 'Гарчиг', width: 180 },
              { key: 'icon', title: 'Icon', width: 90 },
              { key: 'desc', title: 'Тайлбар' },
            ]}
            fields={[
              { name: 'icon', label: 'Icon', placeholder: 'rise|team|heart|check|safety' },
              { name: 'title', label: 'Гарчиг', rules: [{ required: true, message: 'Заавал' }] },
              { name: 'desc', label: 'Тайлбар', type: 'textarea' },
            ]}
          />
          <Divider />
          <SectionDataTable
            name="hr_steps"
            modalTitle="Сонгон шалгаруулалтын алхам"
            addLabel="Нэмэх"
            defaultRow={{ step: 1, title: '', desc: '' }}
            columns={[
              { key: 'step', title: '№', width: 60 },
              { key: 'title', title: 'Гарчиг', width: 180 },
              { key: 'desc', title: 'Тайлбар' },
            ]}
            fields={[
              { name: 'step', label: 'Дугаар' },
              { name: 'title', label: 'Гарчиг', rules: [{ required: true, message: 'Заавал' }] },
              { name: 'desc', label: 'Тайлбар', type: 'textarea' },
            ]}
          />
          <Divider />
          <SectionDataTable
            name="hr_positions"
            modalTitle="Ажлын байр"
            addLabel="Нэмэх"
            defaultRow={{ title: '', type: 'Байнгын' }}
            columns={[
              { key: 'title', title: 'Албан тушаал', width: 260 },
              { key: 'type', title: 'Төрөл', width: 140 },
            ]}
            fields={[
              { name: 'title', label: 'Албан тушаал', rules: [{ required: true, message: 'Заавал' }] },
              { name: 'type', label: 'Төрөл', placeholder: 'Байнгын' },
            ]}
          />
        </>
      ),
    },
    {
      key: 'news',
      label: 'Мэдээлэл',
      children: (
        <>
          {pageHeroFields('news_hero')}
          <Divider />
          <SectionDataTable
            name="news_articles"
            modalTitle="Мэдээ"
            addLabel="Нэмэх"
            defaultRow={{
              id: String(Date.now()),
              title: '',
              excerpt: '',
              body: '',
              date: new Date().toISOString().slice(0, 10),
              category: 'Компанийн мэдээлэл',
              image: '/p1.png',
            }}
            scroll={{ x: 900 }}
            columns={[
              { key: 'title', title: 'Гарчиг', width: 240 },
              { key: 'category', title: 'Ангилал', width: 160 },
              { key: 'date', title: 'Огноо', width: 110 },
              { key: 'excerpt', title: 'Товч' },
            ]}
            fields={[
              { name: 'id', label: 'ID' },
              { name: 'title', label: 'Гарчиг', rules: [{ required: true, message: 'Заавал' }] },
              { name: 'excerpt', label: 'Товч', type: 'textarea' },
              { name: 'body', label: 'Бүтэн текст', type: 'richtext', rules: [{ required: true, message: 'Заавал' }] },
              { name: 'date', label: 'Огноо (YYYY-MM-DD)' },
              { name: 'category', label: 'Ангилал' },
              { name: 'image', label: 'Зураг', placeholder: '/p1.png' },
            ]}
          />
        </>
      ),
    },
    {
      key: 'standart',
      label: 'Стандарт',
      children: (
        <>
          {pageHeroFields('standart_hero')}
          <Divider />
          <SectionDataTable
            name="standart_certificates"
            modalTitle="Гэрчилгээ"
            addLabel="Нэмэх"
            defaultRow={{ name: '', desc: '' }}
            columns={[
              { key: 'name', title: 'Нэр', width: 200 },
              { key: 'desc', title: 'Тайлбар' },
            ]}
            fields={[
              { name: 'name', label: 'Нэр', rules: [{ required: true, message: 'Заавал' }] },
              { name: 'desc', label: 'Тайлбар', type: 'textarea' },
            ]}
          />
          <Divider />
          <Form.List name="standart_sections">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Card key={field.key} size="small" style={{ marginBottom: 12 }}>
                    <Form.Item {...field} name={[field.name, 'id']} label="ID">
                      <Input />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'label']} label="Тэмдэглэгээ">
                      <Input />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'title']} label="Гарчиг">
                      <Input />
                    </Form.Item>
                    <SectionDataTable
                      name={['standart_sections', field.name, 'paragraphs']}
                      modalTitle="Догол мөр"
                      addLabel="Нэмэх"
                      defaultRow=""
                      columns={[{ key: '_scalar', title: 'Догол мөр' }]}
                      fields={[{ name: '_scalar', label: 'Догол мөр', type: 'richtext', rules: [{ required: true, message: 'Заавал' }] }]}
                    />
                    <SectionDataTable
                      name={['standart_sections', field.name, 'bullets']}
                      modalTitle="Жагсаалтын мөр"
                      addLabel="Нэмэх"
                      defaultRow=""
                      columns={[{ key: '_scalar', title: 'Жагсаалт' }]}
                      fields={[{ name: '_scalar', label: 'Жагсаалт', rules: [{ required: true, message: 'Заавал' }] }]}
                    />
                    <Button danger icon={<DeleteOutlined />} onClick={() => remove(field.name)}>
                      Хэсэг устгах
                    </Button>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  block
                  onClick={() => add({ id: '', label: '', title: '', paragraphs: [], bullets: [] })}
                  icon={<PlusOutlined />}
                >
                  Хэсэг нэмэх
                </Button>
              </>
            )}
          </Form.List>
        </>
      ),
    },
    {
      key: 'pages-footer',
      label: 'Хуудас & Footer',
      children: (
        <>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Төслүүд хуудас</p>
          {pageHeroFields('projects_hero')}
          <Divider />
          <SectionDataTable
            name="footer_services"
            modalTitle="Footer үйлчилгээ"
            addLabel="Нэмэх"
            defaultRow=""
            columns={[{ key: '_scalar', title: 'Үйлчилгээ' }]}
            fields={[{ name: '_scalar', label: 'Үйлчилгээ', rules: [{ required: true, message: 'Заавал' }] }]}
          />
        </>
      ),
    },
  ];
}

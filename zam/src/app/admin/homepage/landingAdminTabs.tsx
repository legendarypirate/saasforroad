'use client';

import React, { useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
} from '@/components/admin/primitives';
import { DeleteOutlined, PlusOutlined } from '@/components/admin/icons';
import ImageUploadField from '@/components/admin/ImageUploadField';
import { cn } from '@/lib/utils';
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

function Panel({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6', className)}>
      {(title || description) && (
        <div className="mb-5 border-b border-border pb-4">
          {title && <h3 className="text-base font-semibold text-foreground">{title}</h3>}
          {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

/** Nested pill tabs for heavy pages */
function SubTabs({
  items,
  defaultKey,
}: {
  items: Array<{ key: string; label: string; children: React.ReactNode }>;
  defaultKey?: string;
}) {
  const [active, setActive] = useState(defaultKey ?? items[0]?.key ?? '');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-muted/40 p-1.5">
        {items.map((item) => {
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActive(item.key)}
              className={cn(
                'rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-background text-primary shadow-sm dark:text-[var(--neon-green)]'
                  : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div>{items.find((item) => item.key === active)?.children}</div>
    </div>
  );
}

/** Tabs aligned with public site nav */
export function getLandingAdminTabs(_form?: {
  getFieldValue: (name: string) => string | undefined;
  setFieldValue: (name: string, value: string) => void;
}) {
  return [
    {
      key: 'home',
      label: 'Company title',
      children: (
        <SubTabs
          defaultKey="brand"
          items={[
            {
              key: 'brand',
              label: 'Брэнд',
              children: (
                <Panel title="Брэнд" description="Компанийн нэр, лого">
                  <Form.Item name="company_name" label="Компанийн нэр" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="company_tagline" label="Дэд гарчиг">
                    <Input />
                  </Form.Item>
                  <Form.Item name="logo" label="Лого">
                    <ImageUploadField label="Лого" />
                  </Form.Item>
                </Panel>
              ),
            },
            {
              key: 'hero',
              label: 'Hero',
              children: (
                <div className="space-y-4">
                  <Panel title="Hero" description="Нүүр хуудасны гол хэсэг">
                    <Form.Item name="hero_badge" label="Тэмдэглэгээ">
                      <Input />
                    </Form.Item>
                    <Form.Item name="hero_title" label="Гарчиг">
                      <Input />
                    </Form.Item>
                    <Form.Item name="hero_title_highlight" label="Тодруулах үг">
                      <Input />
                    </Form.Item>
                    <Form.Item name="hero_subtitle" label="Тайлбар">
                      <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item name="hero_bg_image" label="Hero зураг">
                      <ImageUploadField label="Hero зураг" />
                    </Form.Item>
                  </Panel>
                  <Panel title="Hero слайд" description="Ээлжлэн солигдох слайдууд">
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
                  </Panel>
                </div>
              ),
            },
            {
              key: 'about-home',
              label: 'Товч танилцуулга',
              children: (
                <div className="space-y-4">
                  <Panel title="Нүүр — Бидний тухай" description="Нүүр хуудасны товч танилцуулга">
                    <Form.Item name="about_label" label="Хэсгийн нэр">
                      <Input />
                    </Form.Item>
                    <Form.Item name="about_title" label="Гарчиг">
                      <Input />
                    </Form.Item>
                    <Form.Item name="about_text1" label="Текст 1">
                      <Input.TextArea rows={4} />
                    </Form.Item>
                    <Form.Item name="about_text2" label="Текст 2">
                      <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item name="about_image" label="Зураг">
                      <ImageUploadField label="About зураг" />
                    </Form.Item>
                  </Panel>
                  <Panel title="Статистик">
                    <SectionDataTable
                      name="stats"
                      modalTitle="Статистик"
                      addLabel="Нэмэх"
                      defaultRow={{ value: '', label: '' }}
                      columns={[
                        { key: 'value', title: 'Утга', width: 120 },
                        { key: 'label', title: 'Нэр' },
                      ]}
                      fields={[
                        { name: 'value', label: 'Утга', rules: [{ required: true, message: 'Заавал' }] },
                        { name: 'label', label: 'Нэр', rules: [{ required: true, message: 'Заавал' }] },
                      ]}
                    />
                  </Panel>
                </div>
              ),
            },
            {
              key: 'features',
              label: 'Систем',
              children: (
                <Panel title="Систем / Онцлог" description="Удирдлагын системийн онцлогууд">
                  <Form.Item name="features_label" label="Хэсгийн нэр">
                    <Input />
                  </Form.Item>
                  <Form.Item name="features_title" label="Гарчиг">
                    <Input />
                  </Form.Item>
                  <Form.Item name="features_subtitle" label="Тайлбар">
                    <Input.TextArea rows={2} />
                  </Form.Item>
                  <SectionDataTable
                    name="features"
                    modalTitle="Онцлог"
                    addLabel="Нэмэх"
                    defaultRow={{ title: '', desc: '', icon: 'project' }}
                    columns={[
                      { key: 'title', title: 'Гарчиг', width: 180 },
                      { key: 'icon', title: 'Icon', width: 100 },
                      { key: 'desc', title: 'Тайлбар' },
                    ]}
                    fields={[
                      { name: 'title', label: 'Гарчиг', rules: [{ required: true, message: 'Заавал' }] },
                      { name: 'desc', label: 'Тайлбар', type: 'richtext' },
                      { name: 'icon', label: 'Icon', placeholder: 'project|safety|clock|team' },
                    ]}
                  />
                </Panel>
              ),
            },
            {
              key: 'awards',
              label: 'Шагнал',
              children: (
                <div className="space-y-4">
                  <Panel title="Шагнал">
                    <Form.Item name="awards_label" label="Хэсгийн нэр">
                      <Input />
                    </Form.Item>
                    <Form.Item name="awards_title" label="Гарчиг">
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
                  </Panel>
                  <Panel title="Хамтрагч">
                    <Form.Item name="partners_label" label="Хэсгийн нэр">
                      <Input />
                    </Form.Item>
                    <Form.Item name="partners_title" label="Гарчиг">
                      <Input />
                    </Form.Item>
                    <SectionDataTable
                      name="partners"
                      modalTitle="Хамтрагч"
                      addLabel="Нэмэх"
                      defaultRow={{ name: '' }}
                      columns={[{ key: 'name', title: 'Байгууллагын нэр' }]}
                      fields={[
                        {
                          name: 'name',
                          label: 'Байгууллагын нэр',
                          rules: [{ required: true, message: 'Заавал' }],
                        },
                      ]}
                    />
                  </Panel>
                </div>
              ),
            },
            {
              key: 'app',
              label: 'Апп',
              children: (
                <Panel title="Апп & Нэвтрэх" description="Мобайл апп болон нэвтрэх хуудас">
                  <Form.Item name="app_download_title" label="Апп татах гарчиг">
                    <Input />
                  </Form.Item>
                  <Form.Item name="app_download_text" label="Апп татах тайлбар">
                    <Input.TextArea rows={2} />
                  </Form.Item>
                  <Form.Item name="login_title" label="Нэвтрэх гарчиг">
                    <Input />
                  </Form.Item>
                  <Form.Item name="login_subtitle" label="Нэвтрэх тайлбар">
                    <Input />
                  </Form.Item>
                  <Form.Item name="login_bg_image" label="Нэвтрэх арын зураг">
                    <ImageUploadField label="Нэвтрэх арын зураг" />
                  </Form.Item>
                </Panel>
              ),
            },
          ]}
        />
      ),
    },
    {
      key: 'about',
      label: 'Бидний тухай',
      children: (
        <SubTabs
          items={[
            {
              key: 'hero',
              label: 'Hero',
              children: (
                <Panel title="About хуудас — Hero">
                  <Form.Item name="about_hero_badge" label="Hero тэмдэглэгээ">
                    <Input />
                  </Form.Item>
                  <Form.Item name="about_hero_title" label="Hero гарчиг">
                    <Input />
                  </Form.Item>
                </Panel>
              ),
            },
            {
              key: 'director',
              label: 'Захирал',
              children: (
                <Panel title="Захирлын мэндчилгээ">
                  <Form.Item name="director_image" label="Захирлын зураг">
                    <ImageUploadField label="Захирлын зураг" />
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
                    fields={[
                      {
                        name: '_scalar',
                        label: 'Текст',
                        type: 'richtext',
                        rules: [{ required: true, message: 'Заавал' }],
                      },
                    ]}
                  />
                </Panel>
              ),
            },
            {
              key: 'mission',
              label: 'Эрхэм зорилго',
              children: (
                <div className="space-y-4">
                  <Panel title="Эрхэм зорилго & Алсын хараа">
                    <Form.Item name="mission_text" label="Эрхэм зорилго">
                      <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item name="vision_text" label="Алсын хараа">
                      <Input.TextArea rows={3} />
                    </Form.Item>
                  </Panel>
                  <Panel title="Үнэт зүйл">
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
                  </Panel>
                </div>
              ),
            },
          ]}
        />
      ),
    },
    {
      key: 'technology',
      label: 'Технологи',
      children: (
        <SubTabs
          items={[
            {
              key: 'intro',
              label: 'Танилцуулга',
              children: (
                <Panel title="Технологи — танилцуулга">
                  {pageHeroFields('technology_hero')}
                  <Form.Item name="technology_machinery_text1" label="Машин механизм — текст 1">
                    <Input.TextArea rows={3} />
                  </Form.Item>
                  <Form.Item name="technology_machinery_text2" label="Машин механизм — текст 2">
                    <Input.TextArea rows={2} />
                  </Form.Item>
                </Panel>
              ),
            },
            {
              key: 'machinery',
              label: 'Машин',
              children: (
                <Panel title="Машин механизм">
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
                </Panel>
              ),
            },
            {
              key: 'plants',
              label: 'Үйлдвэр',
              children: (
                <Panel title="Үйлдвэр">
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
                </Panel>
              ),
            },
            {
              key: 'stack',
              label: 'Технологи',
              children: (
                <Panel title="Технологийн жагсаалт">
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
                              fields={[
                                {
                                  name: '_scalar',
                                  label: 'Мөр',
                                  rules: [{ required: true, message: 'Заавал' }],
                                },
                              ]}
                            />
                            <Button
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => remove(field.name)}
                              style={{ marginTop: 8 }}
                            >
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
                </Panel>
              ),
            },
          ]}
        />
      ),
    },
    {
      key: 'projects',
      label: 'Төслүүд',
      children: (
        <SubTabs
          items={[
            {
              key: 'list',
              label: 'Жагсаалт',
              children: (
                <Panel title="Төслүүд" description="Нүүр болон төслүүдийн жагсаалт">
                  <Form.Item name="projects_label" label="Хэсгийн нэр">
                    <Input />
                  </Form.Item>
                  <Form.Item name="projects_title" label="Гарчиг">
                    <Input />
                  </Form.Item>
                  <SectionDataTable
                    name="projects"
                    modalTitle="Төсөл"
                    addLabel="Нэмэх"
                    defaultRow={{ title: '', desc: '', tag: '', image: '/p1.png' }}
                    scroll={{ x: 800 }}
                    columns={[
                      { key: 'title', title: 'Гарчиг', width: 220 },
                      { key: 'tag', title: 'Төлөв', width: 120 },
                      { key: 'desc', title: 'Тайлбар' },
                    ]}
                    fields={[
                      { name: 'title', label: 'Гарчиг', rules: [{ required: true, message: 'Заавал' }] },
                      { name: 'desc', label: 'Тайлбар', type: 'richtext' },
                      { name: 'tag', label: 'Төлөв', placeholder: 'Дууссан / Явагдаж буй' },
                      { name: 'image', label: 'Зураг', type: 'image' },
                    ]}
                  />
                </Panel>
              ),
            },
            {
              key: 'page',
              label: 'Хуудас',
              children: (
                <Panel title="Төслүүд хуудас — Hero">{pageHeroFields('projects_hero')}</Panel>
              ),
            },
          ]}
        />
      ),
    },
    {
      key: 'hr',
      label: 'Ажлын байр',
      children: (
        <SubTabs
          items={[
            {
              key: 'intro',
              label: 'Танилцуулга',
              children: (
                <Panel title="Ажлын байр — танилцуулга">
                  {pageHeroFields('hr_hero')}
                  <Form.Item name="hr_training_title" label="Сургалтын гарчиг">
                    <Input />
                  </Form.Item>
                  <Form.Item name="hr_training_text" label="Сургалтын текст">
                    <Input.TextArea rows={3} />
                  </Form.Item>
                </Panel>
              ),
            },
            {
              key: 'benefits',
              label: 'Давуу тал',
              children: (
                <Panel title="Давуу тал">
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
                </Panel>
              ),
            },
            {
              key: 'steps',
              label: 'Алхам',
              children: (
                <Panel title="Сонгон шалгаруулалтын алхам">
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
                </Panel>
              ),
            },
            {
              key: 'positions',
              label: 'Байр',
              children: (
                <Panel title="Нээлттэй ажлын байр">
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
                      {
                        name: 'title',
                        label: 'Албан тушаал',
                        rules: [{ required: true, message: 'Заавал' }],
                      },
                      { name: 'type', label: 'Төрөл', placeholder: 'Байнгын' },
                    ]}
                  />
                </Panel>
              ),
            },
          ]}
        />
      ),
    },
    {
      key: 'news',
      label: 'Мэдээлэл',
      children: (
        <div className="space-y-4">
          <Panel title="Мэдээлэл хуудас — Hero">{pageHeroFields('news_hero')}</Panel>
          <Panel title="Мэдээний жагсаалт">
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
                {
                  name: 'body',
                  label: 'Бүтэн текст',
                  type: 'richtext',
                  rules: [{ required: true, message: 'Заавал' }],
                },
                { name: 'date', label: 'Огноо (YYYY-MM-DD)' },
                { name: 'category', label: 'Ангилал' },
                { name: 'image', label: 'Зураг', type: 'image' },
              ]}
            />
          </Panel>
        </div>
      ),
    },
    {
      key: 'standart',
      label: 'Стандарт',
      children: (
        <SubTabs
          items={[
            {
              key: 'intro',
              label: 'Танилцуулга',
              children: <Panel title="Стандарт — Hero">{pageHeroFields('standart_hero')}</Panel>,
            },
            {
              key: 'certs',
              label: 'Гэрчилгээ',
              children: (
                <Panel title="Гэрчилгээ">
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
                </Panel>
              ),
            },
            {
              key: 'sections',
              label: 'Хэсгүүд',
              children: (
                <Panel title="Стандарт хэсгүүд">
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
                              fields={[
                                {
                                  name: '_scalar',
                                  label: 'Догол мөр',
                                  type: 'richtext',
                                  rules: [{ required: true, message: 'Заавал' }],
                                },
                              ]}
                            />
                            <SectionDataTable
                              name={['standart_sections', field.name, 'bullets']}
                              modalTitle="Жагсаалтын мөр"
                              addLabel="Нэмэх"
                              defaultRow=""
                              columns={[{ key: '_scalar', title: 'Жагсаалт' }]}
                              fields={[
                                {
                                  name: '_scalar',
                                  label: 'Жагсаалт',
                                  rules: [{ required: true, message: 'Заавал' }],
                                },
                              ]}
                            />
                            <Button danger icon={<DeleteOutlined />} onClick={() => remove(field.name)}>
                              Хэсэг устгах
                            </Button>
                          </Card>
                        ))}
                        <Button
                          type="dashed"
                          block
                          onClick={() =>
                            add({ id: '', label: '', title: '', paragraphs: [], bullets: [] })
                          }
                          icon={<PlusOutlined />}
                        >
                          Хэсэг нэмэх
                        </Button>
                      </>
                    )}
                  </Form.List>
                </Panel>
              ),
            },
          ]}
        />
      ),
    },
    {
      key: 'contact',
      label: 'Холбоо барих',
      children: (
        <div className="space-y-4">
          <Panel title="Холбоо барих" description="Утас, и-мэйл, хаяг">
            <Form.Item name="phone" label="Утас" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="email" label="И-мэйл" rules={[{ required: true, type: 'email' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="address" label="Хаяг" rules={[{ required: true }]}>
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item name="footer_copyright" label="Footer текст">
              <Input />
            </Form.Item>
          </Panel>
          <Panel title="Footer үйлчилгээ">
            <SectionDataTable
              name="footer_services"
              modalTitle="Footer үйлчилгээ"
              addLabel="Нэмэх"
              defaultRow=""
              columns={[{ key: '_scalar', title: 'Үйлчилгээ' }]}
              fields={[
                {
                  name: '_scalar',
                  label: 'Үйлчилгээ',
                  rules: [{ required: true, message: 'Заавал' }],
                },
              ]}
            />
          </Panel>
        </div>
      ),
    },
  ];
}

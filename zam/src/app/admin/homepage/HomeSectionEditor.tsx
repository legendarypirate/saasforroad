'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import ImageUploadField from '@/components/admin/ImageUploadField';
import RichTextEditor from '@/components/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { HomepageContent, HomepageProject, HomepageStat } from '@/lib/homepage';
import type {
  HomepageAward,
  HomepageHeroSlide,
  HomepageHrBenefit,
  HomepageHrPosition,
  HomepageHrStep,
  HomepageMachinery,
  HomepageNewsArticle,
  HomepagePageHero,
  HomepagePartner,
  HomepagePlant,
  HomepageStandartCertificate,
  HomepageStandartSection,
  HomepageTechItem,
  HomepageValue,
} from '@/lib/landingContent';
import { standartSectionToHtml } from '@/lib/richText';

export type HomeEditSection =
  | 'brand'
  | 'hero'
  | 'about'
  | 'projects'
  | 'awards'
  | 'partners'
  | 'contact'
  | 'about-hero'
  | 'about-director'
  | 'about-mission'
  | 'tech-hero'
  | 'tech-machinery'
  | 'tech-plants'
  | 'tech-stack'
  | 'projects-hero'
  | 'hr-hero'
  | 'hr-benefits'
  | 'hr-steps'
  | 'hr-positions'
  | 'hr-training'
  | 'news-hero'
  | 'news-articles'
  | 'standart-hero'
  | 'standart-certs'
  | 'standart-sections'
  | null;

type Props = {
  section: HomeEditSection;
  content: HomepageContent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (patch: Partial<HomepageContent>) => void;
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}

function linesToArray(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function arrayToLines(items: string[]): string {
  return items.join('\n');
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex justify-end">
      <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={onClick}>
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}

function ListHeader({
  label,
  onAdd,
}: {
  label: string;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm font-medium">{label}</Label>
      <Button type="button" size="sm" variant="outline" onClick={onAdd}>
        <Plus className="size-3.5" />
        Нэмэх
      </Button>
    </div>
  );
}

export default function HomeSectionEditor({
  section,
  content,
  open,
  onOpenChange,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<HomepageContent>(content);

  useEffect(() => {
    if (open) setDraft(content);
  }, [open, content, section]);

  const patch = <K extends keyof HomepageContent>(key: K, value: HomepageContent[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const patchPageHero = (key: keyof Pick<
    HomepageContent,
    'technology_hero' | 'projects_hero' | 'hr_hero' | 'news_hero' | 'standart_hero'
  >, field: keyof HomepagePageHero, value: string) => {
    setDraft((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const titles: Record<Exclude<HomeEditSection, null>, { title: string; desc: string }> = {
    brand: { title: 'Брэнд', desc: 'Лого болон компанийн нэр' },
    hero: { title: 'Hero', desc: 'Арын зураг болон слайдууд' },
    about: { title: 'Бидний тухай', desc: 'Товч танилцуулга, статистик, зураг' },
    projects: { title: 'Төслүүд', desc: 'Гарчиг болон онцлох төслүүд' },
    awards: { title: 'Шагнал', desc: 'Шагнал урамшуулал' },
    partners: { title: 'Хамтрагч', desc: 'Хамтрагч байгууллагууд' },
    contact: { title: 'Холбоо барих', desc: 'Утас, и-мэйл, хаяг, footer' },
    'about-hero': { title: 'About — Hero', desc: 'Бидний тухай хуудасны hero' },
    'about-director': { title: 'Захирлын мэндчилгээ', desc: 'Албан тушаал болон мэндчилгээний текст' },
    'about-mission': { title: 'Эрхэм зорилго', desc: 'Эрхэм зорилго, алсын хараа, үнэт зүйл' },
    'tech-hero': { title: 'Технологи — Hero', desc: 'Технологи хуудасны hero' },
    'tech-machinery': { title: 'Машин механизм', desc: 'Танилцуулга болон машин механизмын жагсаалт' },
    'tech-plants': { title: 'Үйлдвэр', desc: 'Үйлдвэрийн жагсаалт' },
    'tech-stack': { title: 'Технологийн жагсаалт', desc: 'Программ, системүүд' },
    'projects-hero': { title: 'Төслүүд — Hero', desc: 'Төслүүд хуудасны hero' },
    'hr-hero': { title: 'Ажлын байр — Hero', desc: 'Ажлын байр хуудасны hero' },
    'hr-benefits': { title: 'Давуу тал', desc: 'Ажил олгогчийн давуу тал' },
    'hr-steps': { title: 'Сонгон шалгаруулалт', desc: 'Алхам алхмаар шалгаруулалт' },
    'hr-positions': { title: 'Нээлттэй байр', desc: 'Нээлттэй ажлын байр' },
    'hr-training': { title: 'Сургалт', desc: 'Сургалт, хөгжлийн хэсэг' },
    'news-hero': { title: 'Мэдээлэл — Hero', desc: 'Мэдээлэл хуудасны hero' },
    'news-articles': { title: 'Мэдээний жагсаалт', desc: 'Мэдээний нийтлэлүүд' },
    'standart-hero': { title: 'Стандарт — Hero', desc: 'Стандарт хуудасны hero' },
    'standart-certs': { title: 'Гэрчилгээ', desc: 'Стандарт гэрчилгээний жагсаалт' },
    'standart-sections': { title: 'Стандарт хэсгүүд', desc: 'Стандарт хэсгүүдийн агуулга' },
  };

  if (!section) return null;
  const meta = titles[section];

  const handleApply = () => {
    onSave(draft);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:!max-w-3xl md:!max-w-4xl lg:!max-w-5xl"
      >
        <SheetHeader className="border-b border-border px-6 pt-6 pb-4">
          <SheetTitle>{meta.title}</SheetTitle>
          <SheetDescription>{meta.desc}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {section === 'brand' && (
            <>
              <Field label="Компанийн нэр">
                <Input
                  value={draft.company_name}
                  onChange={(e) => patch('company_name', e.target.value)}
                />
              </Field>
              <Field label="Дэд гарчиг">
                <Input
                  value={draft.company_tagline}
                  onChange={(e) => patch('company_tagline', e.target.value)}
                />
              </Field>
              <Field label="Лого">
                <ImageUploadField
                  label="Лого"
                  value={draft.logo}
                  onChange={(v) => patch('logo', v)}
                />
              </Field>
            </>
          )}

          {section === 'hero' && (
            <>
              <Field label="Hero арын зураг">
                <ImageUploadField
                  label="Hero зураг"
                  value={draft.hero_bg_image}
                  onChange={(v) => patch('hero_bg_image', v)}
                />
              </Field>
              <div className="space-y-3">
                <ListHeader
                  label="Слайдууд"
                  onAdd={() =>
                    patch('hero_slides', [
                      ...draft.hero_slides,
                      { badge: '', title: 'Шинэ слайд', subtitle: '' },
                    ])
                  }
                />
                {draft.hero_slides.map((slide, index) => (
                  <SlideCard
                    key={index}
                    slide={slide}
                    onChange={(next) => {
                      const slides = [...draft.hero_slides];
                      slides[index] = next;
                      patch('hero_slides', slides);
                    }}
                    onRemove={() =>
                      patch(
                        'hero_slides',
                        draft.hero_slides.filter((_, i) => i !== index),
                      )
                    }
                    canRemove={draft.hero_slides.length > 1}
                  />
                ))}
              </div>
            </>
          )}

          {section === 'about' && (
            <>
              <Field label="Хэсгийн нэр">
                <Input value={draft.about_label} onChange={(e) => patch('about_label', e.target.value)} />
              </Field>
              <Field label="Гарчиг">
                <Input value={draft.about_title} onChange={(e) => patch('about_title', e.target.value)} />
              </Field>
              <Field label="Текст 1">
                <Textarea
                  rows={4}
                  value={draft.about_text1}
                  onChange={(e) => patch('about_text1', e.target.value)}
                />
              </Field>
              <Field label="Текст 2">
                <Textarea
                  rows={3}
                  value={draft.about_text2}
                  onChange={(e) => patch('about_text2', e.target.value)}
                />
              </Field>
              <Field label="Нүүр хуудасны зураг">
                <ImageUploadField
                  label="Бидний тухай зураг"
                  value={draft.about_image}
                  onChange={(v) => patch('about_image', v)}
                />
              </Field>
              <div className="space-y-3">
                <ListHeader
                  label="Статистик"
                  onAdd={() => patch('stats', [...draft.stats, { value: '', label: '' }])}
                />
                {draft.stats.map((stat, index) => (
                  <div key={index} className="rounded-lg border border-border p-3 space-y-2">
                    <RemoveButton
                      onClick={() => patch('stats', draft.stats.filter((_, i) => i !== index))}
                    />
                    <Input
                      placeholder="Утга"
                      value={stat.value}
                      onChange={(e) => {
                        const next = [...draft.stats] as HomepageStat[];
                        next[index] = { ...stat, value: e.target.value };
                        patch('stats', next);
                      }}
                    />
                    <Input
                      placeholder="Нэр"
                      value={stat.label}
                      onChange={(e) => {
                        const next = [...draft.stats] as HomepageStat[];
                        next[index] = { ...stat, label: e.target.value };
                        patch('stats', next);
                      }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {section === 'projects' && (
            <>
              <Field label="Хэсгийн нэр">
                <Input
                  value={draft.projects_label}
                  onChange={(e) => patch('projects_label', e.target.value)}
                />
              </Field>
              <Field label="Гарчиг">
                <Input
                  value={draft.projects_title}
                  onChange={(e) => patch('projects_title', e.target.value)}
                />
              </Field>
              <div className="space-y-3">
                <ListHeader
                  label="Төслүүд"
                  onAdd={() =>
                    patch('projects', [
                      ...draft.projects,
                      { title: '', desc: '', tag: 'Явагдаж буй', image: '' },
                    ])
                  }
                />
                {draft.projects.map((project, index) => (
                  <ProjectCard
                    key={index}
                    project={project}
                    onChange={(next) => {
                      const list = [...draft.projects];
                      list[index] = next;
                      patch('projects', list);
                    }}
                    onRemove={() =>
                      patch(
                        'projects',
                        draft.projects.filter((_, i) => i !== index),
                      )
                    }
                  />
                ))}
              </div>
            </>
          )}

          {section === 'awards' && (
            <>
              <Field label="Хэсгийн нэр">
                <Input
                  value={draft.awards_label}
                  onChange={(e) => patch('awards_label', e.target.value)}
                />
              </Field>
              <Field label="Гарчиг">
                <Input
                  value={draft.awards_title}
                  onChange={(e) => patch('awards_title', e.target.value)}
                />
              </Field>
              <div className="space-y-3">
                <ListHeader
                  label="Шагналууд"
                  onAdd={() =>
                    patch('awards', [
                      ...draft.awards,
                      { title: '', issuer: '', year: String(new Date().getFullYear()), image: '' },
                    ])
                  }
                />
                {draft.awards.map((award, index) => (
                  <div key={index} className="space-y-2 rounded-lg border border-border p-3">
                    <RemoveButton
                      onClick={() => patch('awards', draft.awards.filter((_, i) => i !== index))}
                    />
                    <Input
                      placeholder="Гарчиг"
                      value={award.title}
                      onChange={(e) => {
                        const next = [...draft.awards] as HomepageAward[];
                        next[index] = { ...award, title: e.target.value };
                        patch('awards', next);
                      }}
                    />
                    <Textarea
                      rows={2}
                      placeholder="Олгосон байгууллага"
                      value={award.issuer}
                      onChange={(e) => {
                        const next = [...draft.awards] as HomepageAward[];
                        next[index] = { ...award, issuer: e.target.value };
                        patch('awards', next);
                      }}
                    />
                    <Input
                      placeholder="Он"
                      value={award.year}
                      onChange={(e) => {
                        const next = [...draft.awards] as HomepageAward[];
                        next[index] = { ...award, year: e.target.value };
                        patch('awards', next);
                      }}
                    />
                    <ImageUploadField
                      label="Батламжийн зураг"
                      value={award.image}
                      onChange={(v) => {
                        const next = [...draft.awards] as HomepageAward[];
                        next[index] = { ...award, image: v };
                        patch('awards', next);
                      }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {section === 'partners' && (
            <>
              <Field label="Хэсгийн нэр">
                <Input
                  value={draft.partners_label}
                  onChange={(e) => patch('partners_label', e.target.value)}
                />
              </Field>
              <Field label="Гарчиг">
                <Input
                  value={draft.partners_title}
                  onChange={(e) => patch('partners_title', e.target.value)}
                />
              </Field>
              <div className="space-y-3">
                <ListHeader
                  label="Хамтрагчид"
                  onAdd={() => patch('partners', [...draft.partners, { name: '', logo: '' }])}
                />
                {draft.partners.map((partner, index) => (
                  <div key={index} className="space-y-2 rounded-lg border border-border p-3">
                    <RemoveButton
                      onClick={() =>
                        patch(
                          'partners',
                          draft.partners.filter((_, i) => i !== index),
                        )
                      }
                    />
                    <Input
                      placeholder="Байгууллагын нэр"
                      value={partner.name}
                      onChange={(e) => {
                        const next = [...draft.partners] as HomepagePartner[];
                        next[index] = { ...partner, name: e.target.value };
                        patch('partners', next);
                      }}
                    />
                    <ImageUploadField
                      label="Лого"
                      value={partner.logo}
                      onChange={(v) => {
                        const next = [...draft.partners] as HomepagePartner[];
                        next[index] = { ...partner, logo: v };
                        patch('partners', next);
                      }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {section === 'contact' && (
            <>
              <Field label="Утас">
                <Input value={draft.phone} onChange={(e) => patch('phone', e.target.value)} />
              </Field>
              <Field label="И-мэйл">
                <Input value={draft.email} onChange={(e) => patch('email', e.target.value)} />
              </Field>
              <Field label="Хаяг">
                <Textarea
                  rows={2}
                  value={draft.address}
                  onChange={(e) => patch('address', e.target.value)}
                />
              </Field>
              <Field label="Footer текст">
                <Input
                  value={draft.footer_copyright}
                  onChange={(e) => patch('footer_copyright', e.target.value)}
                />
              </Field>
            </>
          )}

          {section === 'about-hero' && (
            <>
              <Field label="Hero тэмдэглэгээ">
                <Input
                  value={draft.about_hero_badge}
                  onChange={(e) => patch('about_hero_badge', e.target.value)}
                />
              </Field>
              <Field label="Hero гарчиг">
                <Input
                  value={draft.about_hero_title}
                  onChange={(e) => patch('about_hero_title', e.target.value)}
                />
              </Field>
            </>
          )}

          {section === 'about-director' && (
            <>
              <Field label="Захирлын зураг">
                <ImageUploadField
                  label="Захирлын зураг"
                  value={draft.director_image}
                  onChange={(v) => patch('director_image', v)}
                />
              </Field>
              <Field label="Захирлын албан тушаал">
                <Input
                  value={draft.director_role}
                  onChange={(e) => patch('director_role', e.target.value)}
                />
              </Field>
              <div className="space-y-3">
                <ListHeader
                  label="Мэндчилгээний догол мөр"
                  onAdd={() => patch('director_paragraphs', [...draft.director_paragraphs, ''])}
                />
                {draft.director_paragraphs.map((paragraph, index) => (
                  <div key={index} className="space-y-2 rounded-lg border border-border p-3">
                    <RemoveButton
                      onClick={() =>
                        patch(
                          'director_paragraphs',
                          draft.director_paragraphs.filter((_, i) => i !== index),
                        )
                      }
                    />
                    <Textarea
                      rows={4}
                      placeholder={`Догол мөр ${index + 1}`}
                      value={paragraph}
                      onChange={(e) => {
                        const next = [...draft.director_paragraphs];
                        next[index] = e.target.value;
                        patch('director_paragraphs', next);
                      }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {section === 'about-mission' && (
            <>
              <Field label="Эрхэм зорилго">
                <Textarea
                  rows={3}
                  value={draft.mission_text}
                  onChange={(e) => patch('mission_text', e.target.value)}
                />
              </Field>
              <Field label="Алсын хараа">
                <Textarea
                  rows={3}
                  value={draft.vision_text}
                  onChange={(e) => patch('vision_text', e.target.value)}
                />
              </Field>
              <div className="space-y-3">
                <ListHeader
                  label="Үнэт зүйл"
                  onAdd={() => patch('values', [...draft.values, { title: '', desc: '' }])}
                />
                {draft.values.map((value, index) => (
                  <div key={index} className="space-y-2 rounded-lg border border-border p-3">
                    <RemoveButton
                      onClick={() => patch('values', draft.values.filter((_, i) => i !== index))}
                    />
                    <Input
                      placeholder="Гарчиг"
                      value={value.title}
                      onChange={(e) => {
                        const next = [...draft.values] as HomepageValue[];
                        next[index] = { ...value, title: e.target.value };
                        patch('values', next);
                      }}
                    />
                    <Textarea
                      rows={2}
                      placeholder="Тайлбар"
                      value={value.desc}
                      onChange={(e) => {
                        const next = [...draft.values] as HomepageValue[];
                        next[index] = { ...value, desc: e.target.value };
                        patch('values', next);
                      }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {section === 'tech-hero' && (
            <PageHeroFields
              hero={draft.technology_hero}
              onChange={(field, value) => patchPageHero('technology_hero', field, value)}
            />
          )}

          {section === 'tech-machinery' && (
            <>
              <Field label="Машин механизм — текст 1">
                <Textarea
                  rows={3}
                  value={draft.technology_machinery_text1}
                  onChange={(e) => patch('technology_machinery_text1', e.target.value)}
                />
              </Field>
              <Field label="Машин механизм — текст 2">
                <Textarea
                  rows={2}
                  value={draft.technology_machinery_text2}
                  onChange={(e) => patch('technology_machinery_text2', e.target.value)}
                />
              </Field>
              <div className="space-y-3">
                <ListHeader
                  label="Машин механизм"
                  onAdd={() => patch('machinery', [...draft.machinery, { name: '', count: '' }])}
                />
                {draft.machinery.map((item, index) => (
                  <div key={index} className="space-y-2 rounded-lg border border-border p-3">
                    <RemoveButton
                      onClick={() => patch('machinery', draft.machinery.filter((_, i) => i !== index))}
                    />
                    <Input
                      placeholder="Нэр"
                      value={item.name}
                      onChange={(e) => {
                        const next = [...draft.machinery] as HomepageMachinery[];
                        next[index] = { ...item, name: e.target.value };
                        patch('machinery', next);
                      }}
                    />
                    <Input
                      placeholder="Тоо"
                      value={item.count}
                      onChange={(e) => {
                        const next = [...draft.machinery] as HomepageMachinery[];
                        next[index] = { ...item, count: e.target.value };
                        patch('machinery', next);
                      }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {section === 'tech-plants' && (
            <div className="space-y-3">
              <ListHeader
                label="Үйлдвэр"
                onAdd={() => patch('plants', [...draft.plants, { title: '', capacity: '', detail: '' }])}
              />
              {draft.plants.map((plant, index) => (
                <div key={index} className="space-y-2 rounded-lg border border-border p-3">
                  <RemoveButton
                    onClick={() => patch('plants', draft.plants.filter((_, i) => i !== index))}
                  />
                  <Input
                    placeholder="Гарчиг"
                    value={plant.title}
                    onChange={(e) => {
                      const next = [...draft.plants] as HomepagePlant[];
                      next[index] = { ...plant, title: e.target.value };
                      patch('plants', next);
                    }}
                  />
                  <Input
                    placeholder="Хүчин чадал"
                    value={plant.capacity}
                    onChange={(e) => {
                      const next = [...draft.plants] as HomepagePlant[];
                      next[index] = { ...plant, capacity: e.target.value };
                      patch('plants', next);
                    }}
                  />
                  <Textarea
                    rows={3}
                    placeholder="Дэлгэрэнгүй"
                    value={plant.detail}
                    onChange={(e) => {
                      const next = [...draft.plants] as HomepagePlant[];
                      next[index] = { ...plant, detail: e.target.value };
                      patch('plants', next);
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {section === 'tech-stack' && (
            <div className="space-y-3">
              <ListHeader
                label="Технологи"
                onAdd={() =>
                  patch('tech_stack', [
                    ...draft.tech_stack,
                    { id: '', title: '', summary: '', bullets: [] },
                  ])
                }
              />
              {draft.tech_stack.map((item, index) => (
                <div key={index} className="space-y-2 rounded-lg border border-border p-3">
                  <RemoveButton
                    onClick={() => patch('tech_stack', draft.tech_stack.filter((_, i) => i !== index))}
                  />
                  <Input
                    placeholder="ID"
                    value={item.id}
                    onChange={(e) => {
                      const next = [...draft.tech_stack] as HomepageTechItem[];
                      next[index] = { ...item, id: e.target.value };
                      patch('tech_stack', next);
                    }}
                  />
                  <Input
                    placeholder="Гарчиг"
                    value={item.title}
                    onChange={(e) => {
                      const next = [...draft.tech_stack] as HomepageTechItem[];
                      next[index] = { ...item, title: e.target.value };
                      patch('tech_stack', next);
                    }}
                  />
                  <Textarea
                    rows={2}
                    placeholder="Тайлбар"
                    value={item.summary}
                    onChange={(e) => {
                      const next = [...draft.tech_stack] as HomepageTechItem[];
                      next[index] = { ...item, summary: e.target.value };
                      patch('tech_stack', next);
                    }}
                  />
                  <Field label="Жагсаалт (мөр бүрт нэг)">
                    <Textarea
                      rows={4}
                      placeholder="Мөр бүрт нэг жагсаалтын мөр"
                      value={arrayToLines(item.bullets)}
                      onChange={(e) => {
                        const next = [...draft.tech_stack] as HomepageTechItem[];
                        next[index] = { ...item, bullets: linesToArray(e.target.value) };
                        patch('tech_stack', next);
                      }}
                    />
                  </Field>
                </div>
              ))}
            </div>
          )}

          {section === 'projects-hero' && (
            <PageHeroFields
              hero={draft.projects_hero}
              onChange={(field, value) => patchPageHero('projects_hero', field, value)}
            />
          )}

          {section === 'hr-hero' && (
            <PageHeroFields
              hero={draft.hr_hero}
              onChange={(field, value) => patchPageHero('hr_hero', field, value)}
            />
          )}

          {section === 'hr-benefits' && (
            <div className="space-y-3">
              <ListHeader
                label="Давуу тал"
                onAdd={() =>
                  patch('hr_benefits', [...draft.hr_benefits, { icon: 'check', title: '', desc: '' }])
                }
              />
              {draft.hr_benefits.map((benefit, index) => (
                <div key={index} className="space-y-2 rounded-lg border border-border p-3">
                  <RemoveButton
                    onClick={() =>
                      patch('hr_benefits', draft.hr_benefits.filter((_, i) => i !== index))
                    }
                  />
                  <Input
                    placeholder="Icon (rise|team|heart|check|safety)"
                    value={benefit.icon}
                    onChange={(e) => {
                      const next = [...draft.hr_benefits] as HomepageHrBenefit[];
                      next[index] = { ...benefit, icon: e.target.value };
                      patch('hr_benefits', next);
                    }}
                  />
                  <Input
                    placeholder="Гарчиг"
                    value={benefit.title}
                    onChange={(e) => {
                      const next = [...draft.hr_benefits] as HomepageHrBenefit[];
                      next[index] = { ...benefit, title: e.target.value };
                      patch('hr_benefits', next);
                    }}
                  />
                  <Textarea
                    rows={2}
                    placeholder="Тайлбар"
                    value={benefit.desc}
                    onChange={(e) => {
                      const next = [...draft.hr_benefits] as HomepageHrBenefit[];
                      next[index] = { ...benefit, desc: e.target.value };
                      patch('hr_benefits', next);
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {section === 'hr-steps' && (
            <div className="space-y-3">
              <ListHeader
                label="Алхмууд"
                onAdd={() =>
                  patch('hr_steps', [
                    ...draft.hr_steps,
                    { step: draft.hr_steps.length + 1, title: '', desc: '' },
                  ])
                }
              />
              {draft.hr_steps.map((step, index) => (
                <div key={index} className="space-y-2 rounded-lg border border-border p-3">
                  <RemoveButton
                    onClick={() => patch('hr_steps', draft.hr_steps.filter((_, i) => i !== index))}
                  />
                  <Input
                    placeholder="Дугаар"
                    type="number"
                    value={step.step}
                    onChange={(e) => {
                      const next = [...draft.hr_steps] as HomepageHrStep[];
                      next[index] = { ...step, step: Number(e.target.value) || 0 };
                      patch('hr_steps', next);
                    }}
                  />
                  <Input
                    placeholder="Гарчиг"
                    value={step.title}
                    onChange={(e) => {
                      const next = [...draft.hr_steps] as HomepageHrStep[];
                      next[index] = { ...step, title: e.target.value };
                      patch('hr_steps', next);
                    }}
                  />
                  <Textarea
                    rows={2}
                    placeholder="Тайлбар"
                    value={step.desc}
                    onChange={(e) => {
                      const next = [...draft.hr_steps] as HomepageHrStep[];
                      next[index] = { ...step, desc: e.target.value };
                      patch('hr_steps', next);
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {section === 'hr-positions' && (
            <div className="space-y-3">
              <ListHeader
                label="Ажлын байр"
                onAdd={() => patch('hr_positions', [...draft.hr_positions, { title: '', type: 'Байнгын' }])}
              />
              {draft.hr_positions.map((position, index) => (
                <div key={index} className="space-y-2 rounded-lg border border-border p-3">
                  <RemoveButton
                    onClick={() =>
                      patch('hr_positions', draft.hr_positions.filter((_, i) => i !== index))
                    }
                  />
                  <Input
                    placeholder="Албан тушаал"
                    value={position.title}
                    onChange={(e) => {
                      const next = [...draft.hr_positions] as HomepageHrPosition[];
                      next[index] = { ...position, title: e.target.value };
                      patch('hr_positions', next);
                    }}
                  />
                  <Input
                    placeholder="Төрөл"
                    value={position.type}
                    onChange={(e) => {
                      const next = [...draft.hr_positions] as HomepageHrPosition[];
                      next[index] = { ...position, type: e.target.value };
                      patch('hr_positions', next);
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {section === 'hr-training' && (
            <>
              <Field label="Сургалтын гарчиг">
                <Input
                  value={draft.hr_training_title}
                  onChange={(e) => patch('hr_training_title', e.target.value)}
                />
              </Field>
              <Field label="Сургалтын текст">
                <Textarea
                  rows={3}
                  value={draft.hr_training_text}
                  onChange={(e) => patch('hr_training_text', e.target.value)}
                />
              </Field>
            </>
          )}

          {section === 'news-hero' && (
            <PageHeroFields
              hero={draft.news_hero}
              onChange={(field, value) => patchPageHero('news_hero', field, value)}
            />
          )}

          {section === 'news-articles' && (
            <div className="space-y-3">
              <ListHeader
                label="Мэдээ"
                onAdd={() =>
                  patch('news_articles', [
                    ...draft.news_articles,
                    {
                      id: String(Date.now()),
                      title: '',
                      excerpt: '',
                      body: '',
                      date: new Date().toISOString().slice(0, 10),
                      category: 'Компанийн мэдээлэл',
                      image: '',
                    },
                  ])
                }
              />
              {draft.news_articles.map((article, index) => (
                <NewsArticleCard
                  key={article.id || index}
                  article={article}
                  onChange={(next) => {
                    const list = [...draft.news_articles];
                    list[index] = next;
                    patch('news_articles', list);
                  }}
                  onRemove={() =>
                    patch(
                      'news_articles',
                      draft.news_articles.filter((_, i) => i !== index),
                    )
                  }
                />
              ))}
            </div>
          )}

          {section === 'standart-hero' && (
            <PageHeroFields
              hero={draft.standart_hero}
              onChange={(field, value) => patchPageHero('standart_hero', field, value)}
            />
          )}

          {section === 'standart-certs' && (
            <div className="space-y-3">
              <ListHeader
                label="Гэрчилгээ"
                onAdd={() => patch('standart_certificates', [...draft.standart_certificates, { name: '', desc: '' }])}
              />
              {draft.standart_certificates.map((cert, index) => (
                <div key={index} className="space-y-2 rounded-lg border border-border p-3">
                  <RemoveButton
                    onClick={() =>
                      patch(
                        'standart_certificates',
                        draft.standart_certificates.filter((_, i) => i !== index),
                      )
                    }
                  />
                  <Input
                    placeholder="Нэр"
                    value={cert.name}
                    onChange={(e) => {
                      const next = [...draft.standart_certificates] as HomepageStandartCertificate[];
                      next[index] = { ...cert, name: e.target.value };
                      patch('standart_certificates', next);
                    }}
                  />
                  <Textarea
                    rows={2}
                    placeholder="Тайлбар"
                    value={cert.desc}
                    onChange={(e) => {
                      const next = [...draft.standart_certificates] as HomepageStandartCertificate[];
                      next[index] = { ...cert, desc: e.target.value };
                      patch('standart_certificates', next);
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {section === 'standart-sections' && (
            <div className="space-y-4">
              <ListHeader
                label="Хэсгүүд"
                onAdd={() =>
                  patch('standart_sections', [
                    ...draft.standart_sections,
                    { id: '', label: '', title: '', body: '', paragraphs: [], bullets: [] },
                  ])
                }
              />
              {draft.standart_sections.map((sectionItem, index) => (
                <div key={index} className="space-y-3 rounded-lg border border-border p-3">
                  <RemoveButton
                    onClick={() =>
                      patch(
                        'standart_sections',
                        draft.standart_sections.filter((_, i) => i !== index),
                      )
                    }
                  />
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Input
                      placeholder="ID (quality)"
                      value={sectionItem.id}
                      onChange={(e) => {
                        const next = [...draft.standart_sections] as HomepageStandartSection[];
                        next[index] = { ...sectionItem, id: e.target.value };
                        patch('standart_sections', next);
                      }}
                    />
                    <Input
                      placeholder="Тэмдэглэгээ (ЧАНАР)"
                      value={sectionItem.label}
                      onChange={(e) => {
                        const next = [...draft.standart_sections] as HomepageStandartSection[];
                        next[index] = { ...sectionItem, label: e.target.value };
                        patch('standart_sections', next);
                      }}
                    />
                    <Input
                      placeholder="Гарчиг"
                      value={sectionItem.title}
                      onChange={(e) => {
                        const next = [...draft.standart_sections] as HomepageStandartSection[];
                        next[index] = { ...sectionItem, title: e.target.value };
                        patch('standart_sections', next);
                      }}
                    />
                  </div>
                  <Field label="Агуулга (догол мөр + жагсаалт)">
                    <RichTextEditor
                      minHeight={280}
                      placeholder="Догол мөр, жагсаалт бичнэ үү..."
                      value={standartSectionToHtml(sectionItem)}
                      onChange={(html) => {
                        const next = [...draft.standart_sections] as HomepageStandartSection[];
                        next[index] = {
                          ...sectionItem,
                          body: html,
                          paragraphs: [],
                          bullets: [],
                        };
                        patch('standart_sections', next);
                      }}
                    />
                  </Field>
                </div>
              ))}
            </div>
          )}
        </div>

        <SheetFooter className="border-t border-border px-6 pb-6 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Болих
          </Button>
          <Button type="button" onClick={handleApply}>
            Хэрэглэх
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function PageHeroFields({
  hero,
  onChange,
}: {
  hero: HomepagePageHero;
  onChange: (field: keyof HomepagePageHero, value: string) => void;
}) {
  return (
    <>
      <Field label="Тэмдэглэгээ">
        <Input value={hero.badge} onChange={(e) => onChange('badge', e.target.value)} />
      </Field>
      <Field label="Гарчиг">
        <Input value={hero.title} onChange={(e) => onChange('title', e.target.value)} />
      </Field>
      <Field label="Тайлбар">
        <Textarea
          rows={2}
          value={hero.subtitle}
          onChange={(e) => onChange('subtitle', e.target.value)}
        />
      </Field>
    </>
  );
}

function SlideCard({
  slide,
  onChange,
  onRemove,
  canRemove,
}: {
  slide: HomepageHeroSlide;
  onChange: (slide: HomepageHeroSlide) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-destructive"
          disabled={!canRemove}
          onClick={onRemove}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
      <Input
        placeholder="Тэмдэглэгээ"
        value={slide.badge}
        onChange={(e) => onChange({ ...slide, badge: e.target.value })}
      />
      <Input
        placeholder="Гарчиг"
        value={slide.title}
        onChange={(e) => onChange({ ...slide, title: e.target.value })}
      />
      <Textarea
        rows={2}
        placeholder="Тайлбар"
        value={slide.subtitle}
        onChange={(e) => onChange({ ...slide, subtitle: e.target.value })}
      />
    </div>
  );
}

function ProjectCard({
  project,
  onChange,
  onRemove,
}: {
  project: HomepageProject;
  onChange: (project: HomepageProject) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <RemoveButton onClick={onRemove} />
      <Input
        placeholder="Гарчиг"
        value={project.title}
        onChange={(e) => onChange({ ...project, title: e.target.value })}
      />
      <Input
        placeholder="Төлөв"
        value={project.tag}
        onChange={(e) => onChange({ ...project, tag: e.target.value })}
      />
      <Textarea
        rows={3}
        placeholder="Тайлбар"
        value={project.desc}
        onChange={(e) => onChange({ ...project, desc: e.target.value })}
      />
      <ImageUploadField
        label="Төслийн зураг"
        value={project.image}
        onChange={(v) => onChange({ ...project, image: v })}
      />
    </div>
  );
}

function NewsArticleCard({
  article,
  onChange,
  onRemove,
}: {
  article: HomepageNewsArticle;
  onChange: (article: HomepageNewsArticle) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <RemoveButton onClick={onRemove} />
      <Input
        placeholder="ID"
        value={article.id}
        onChange={(e) => onChange({ ...article, id: e.target.value })}
      />
      <Input
        placeholder="Гарчиг"
        value={article.title}
        onChange={(e) => onChange({ ...article, title: e.target.value })}
      />
      <Textarea
        rows={2}
        placeholder="Товч"
        value={article.excerpt}
        onChange={(e) => onChange({ ...article, excerpt: e.target.value })}
      />
      <Input
        placeholder="Огноо (YYYY-MM-DD)"
        value={article.date}
        onChange={(e) => onChange({ ...article, date: e.target.value })}
      />
      <Input
        placeholder="Ангилал"
        value={article.category}
        onChange={(e) => onChange({ ...article, category: e.target.value })}
      />
      <ImageUploadField
        label="Мэдээний зураг"
        value={article.image}
        onChange={(v) => onChange({ ...article, image: v })}
      />
      <Field label="Бүтэн текст">
        <Textarea
          rows={6}
          placeholder="Мэдээний бүтэн текст"
          value={article.body}
          onChange={(e) => onChange({ ...article, body: e.target.value })}
        />
      </Field>
    </div>
  );
}

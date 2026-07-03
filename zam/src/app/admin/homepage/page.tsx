'use client';

import React, { useEffect, useState } from 'react';
import {
  Button,
  Form,
  Input,
  Tabs,
  message,
  Spin,
  Upload,
  Card,
  Space,
  Divider,
} from 'antd';
import { PlusOutlined, SaveOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  fetchAdminHomepage,
  saveHomepage,
  uploadHomepageImage,
  resolveImageUrl,
  type HomepageContent,
} from '@/lib/homepage';

function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const path = await uploadHomepageImage(file);
    setUploading(false);
    if (path) {
      onChange?.(path);
      message.success('Зураг амжилттай хадгалагдлаа');
    } else {
      message.error('Зураг байршуулахад алдаа гарлаа');
    }
    return false;
  };

  return (
    <Form.Item label={label}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="/logo.jpeg эсвэл /assets/..."
        />
        <Upload beforeUpload={handleUpload} showUploadList={false} accept="image/*">
          <Button icon={<UploadOutlined />} loading={uploading}>
            Зураг байршуулах
          </Button>
        </Upload>
        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveImageUrl(value)}
            alt={label}
            style={{ maxWidth: 200, maxHeight: 120, objectFit: 'cover', borderRadius: 8 }}
          />
        )}
      </Space>
    </Form.Item>
  );
}

export default function HomepageAdminPage() {
  const [form] = Form.useForm<HomepageContent>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await fetchAdminHomepage();
      if (data) form.setFieldsValue(data);
      setLoading(false);
    })();
  }, [form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const ok = await saveHomepage(values);
      if (ok) message.success('Нүүр хуудас амжилттай хадгалагдлаа');
      else message.error('Хадгалахад алдаа гарлаа');
    } catch {
      message.error('Талбаруудыг шалгана уу');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'branding',
      label: 'Лого & Нэр',
      children: (
        <>
          <Form.Item name="company_name" label="Компанийн нэр" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="company_tagline" label="Дэд гарчиг">
            <Input />
          </Form.Item>
          <Form.Item noStyle shouldUpdate>
            {() => (
              <ImageField
                label="Лого"
                value={form.getFieldValue('logo')}
                onChange={(v) => form.setFieldValue('logo', v)}
              />
            )}
          </Form.Item>
        </>
      ),
    },
    {
      key: 'hero',
      label: 'Hero',
      children: (
        <>
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
          <Form.Item name="hero_bg_image" label="Арын зураг">
            <Input />
          </Form.Item>
          <Form.Item noStyle shouldUpdate>
            {() => (
              <ImageField
                label="Hero зураг"
                value={form.getFieldValue('hero_bg_image')}
                onChange={(v) => form.setFieldValue('hero_bg_image', v)}
              />
            )}
          </Form.Item>
        </>
      ),
    },
    {
      key: 'about',
      label: 'Бидний тухай',
      children: (
        <>
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
            <Input />
          </Form.Item>
          <Form.Item noStyle shouldUpdate>
            {() => (
              <ImageField
                label="About зураг"
                value={form.getFieldValue('about_image')}
                onChange={(v) => form.setFieldValue('about_image', v)}
              />
            )}
          </Form.Item>
        </>
      ),
    },
    {
      key: 'contact',
      label: 'Холбоо барих',
      children: (
        <>
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
        </>
      ),
    },
    {
      key: 'stats',
      label: 'Статистик',
      children: (
        <Form.List name="stats">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field) => (
                <Card key={field.key} size="small" style={{ marginBottom: 12 }}>
                  <Space align="start" style={{ width: '100%' }} wrap>
                    <Form.Item {...field} name={[field.name, 'value']} label="Утга" rules={[{ required: true }]}>
                      <Input style={{ width: 120 }} />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'label']} label="Нэр" rules={[{ required: true }]}>
                      <Input style={{ width: 220 }} />
                    </Form.Item>
                    <Button danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} style={{ marginTop: 30 }}>
                      Устгах
                    </Button>
                  </Space>
                </Card>
              ))}
              <Button type="dashed" onClick={() => add({ value: '', label: '' })} icon={<PlusOutlined />}>
                Статистик нэмэх
              </Button>
            </>
          )}
        </Form.List>
      ),
    },
    {
      key: 'features',
      label: 'Систем',
      children: (
        <>
          <Form.Item name="features_label" label="Хэсгийн нэр">
            <Input />
          </Form.Item>
          <Form.Item name="features_title" label="Гарчиг">
            <Input />
          </Form.Item>
          <Form.Item name="features_subtitle" label="Тайлбар">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Divider />
          <Form.List name="features">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Card key={field.key} size="small" style={{ marginBottom: 12 }}>
                    <Form.Item {...field} name={[field.name, 'title']} label="Гарчиг" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'desc']} label="Тайлбар">
                      <Input.TextArea rows={2} />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'icon']} label="Icon (project|safety|clock|team)">
                      <Input />
                    </Form.Item>
                    <Button danger icon={<DeleteOutlined />} onClick={() => remove(field.name)}>
                      Устгах
                    </Button>
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add({ title: '', desc: '', icon: 'project' })} icon={<PlusOutlined />}>
                  Онцлог нэмэх
                </Button>
              </>
            )}
          </Form.List>
        </>
      ),
    },
    {
      key: 'projects',
      label: 'Төслүүд',
      children: (
        <>
          <Form.Item name="projects_label" label="Хэсгийн нэр">
            <Input />
          </Form.Item>
          <Form.Item name="projects_title" label="Гарчиг">
            <Input />
          </Form.Item>
          <Divider />
          <Form.List name="projects">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Card key={field.key} size="small" style={{ marginBottom: 12 }}>
                    <Form.Item {...field} name={[field.name, 'title']} label="Гарчиг" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'desc']} label="Тайлбар">
                      <Input.TextArea rows={2} />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'tag']} label="Төлөв">
                      <Input placeholder="Дууссан / Явагдаж буй" />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'image']} label="Зураг зам">
                      <Input placeholder="/p1.png эсвэл /assets/..." />
                    </Form.Item>
                    <Button danger icon={<DeleteOutlined />} onClick={() => remove(field.name)}>
                      Устгах
                    </Button>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add({ title: '', desc: '', tag: '', image: '/p1.png' })}
                  icon={<PlusOutlined />}
                >
                  Төсөл нэмэх
                </Button>
              </>
            )}
          </Form.List>
        </>
      ),
    },
    {
      key: 'app',
      label: 'Апп & Нэвтрэх',
      children: (
        <>
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
            <Input />
          </Form.Item>
        </>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, color: '#082c5c' }}>Нүүр хуудас удирдлага</h2>
          <p style={{ margin: '4px 0 0', color: '#888' }}>
            Лого, утас, и-мэйл, hero, төслүүд зэрэг нүүр хуудасны контентыг засна
          </p>
        </div>
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave} size="large">
          Хадгалах
        </Button>
      </div>

      <Form form={form} layout="vertical">
        <Form.Item name="logo" hidden><Input /></Form.Item>
        <Form.Item name="hero_bg_image" hidden><Input /></Form.Item>
        <Form.Item name="about_image" hidden><Input /></Form.Item>
        <Tabs items={tabItems} />
      </Form>
    </div>
  );
}

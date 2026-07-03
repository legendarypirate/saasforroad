'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Tabs,
  Card,
  Descriptions,
  Typography,
  Button,
  Form,
  Input,
  Table,
  Space,
  Tag,
  Select,
  Popconfirm,
  message,
  Avatar,
  Upload,
  Spin,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, PlusOutlined, UserOutlined, CameraOutlined } from '@ant-design/icons';
import EmploymentTab, {
  type CareerChangeRow,
  type ContractTerminationRow,
  type UserAwardRow,
} from './EmploymentTab';

const { Title, Text } = Typography;

interface UserDetail {
  id: number;
  username?: string;
  email?: string;
  phone?: string;
  role?: string;
  roleRecord?: { id: number; name: string };
  profile_image?: string;
  gender?: string;
  department_number?: string;
  personal_case_number?: string;
  project_number?: string;
  position?: string;
  register_number?: string;
  sap_number?: string;
  social_insurance_years?: string;
  driver_license_class?: string;
  driver_license_number?: string;
  driver_license_expiry?: string;
  affiliation?: string;
  residential_address?: string;
  id_card_home_address?: string;
  bank_account_number?: string;
  company_email?: string;
  responsible_equipment?: string;
  working_conditions?: string;
  job_description?: string;
  employment_start_date?: string;
  employment_order_number?: string;
  labor_contract_number?: string;
  labor_contract_date?: string;
  golden_order?: string;
  probation_period?: string;
  probation_end_date?: string;
  permanent_order_number?: string;
  permanent_date?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ActionRow {
  id: number;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  createdAt: string;
}

interface SchoolRow {
  id: number;
  schoolName: string;
  major: string;
  degree: string;
  graduationYear: string;
}

interface FamilyRow {
  id: number;
  fullName: string;
  phone: string;
  job: string;
  relation: string;
}

interface EmergencyRow {
  id: number;
  name: string;
  relation: string;
  phone: string;
  address: string;
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [families, setFamilies] = useState<FamilyRow[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyRow[]>([]);
  const [careerChanges, setCareerChanges] = useState<CareerChangeRow[]>([]);
  const [contractTerminations, setContractTerminations] = useState<ContractTerminationRow[]>([]);
  const [userAwards, setUserAwards] = useState<UserAwardRow[]>([]);
  const [actionSaving, setActionSaving] = useState(false);
  const [emergencySaving, setEmergencySaving] = useState(false);
  const [schoolSaving, setSchoolSaving] = useState(false);
  const [familySaving, setFamilySaving] = useState(false);
  const [generalSaving, setGeneralSaving] = useState(false);
  const [generalEditing, setGeneralEditing] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const [generalForm] = Form.useForm();
  const [schoolForm] = Form.useForm();
  const [familyForm] = Form.useForm();
  const [emergencyForm] = Form.useForm();
  const [disciplineForm] = Form.useForm();

  const userId = useMemo(() => Number(id), [id]);

  const displayValue = (value?: string | number | null) =>
    value !== undefined && value !== null && String(value).trim() !== '' ? String(value) : '—';

  const genderLabel = (value?: string) => {
    if (value === 'male') return 'Эр';
    if (value === 'female') return 'Эм';
    return displayValue(value);
  };

  const populateGeneralForm = (data: UserDetail) => {
    generalForm.setFieldsValue({
      department_number: data.department_number,
      personal_case_number: data.personal_case_number,
      project_number: data.project_number,
      position: data.position,
      gender: data.gender,
      register_number: data.register_number,
      sap_number: data.sap_number,
      social_insurance_years: data.social_insurance_years,
      driver_license_class: data.driver_license_class,
      driver_license_number: data.driver_license_number,
      driver_license_expiry: data.driver_license_expiry,
      affiliation: data.affiliation,
      residential_address: data.residential_address,
      id_card_home_address: data.id_card_home_address,
      bank_account_number: data.bank_account_number,
      company_email: data.company_email,
    });
  };

  const startGeneralEdit = () => {
    if (user) populateGeneralForm(user);
    setGeneralEditing(true);
  };

  const cancelGeneralEdit = () => {
    if (user) populateGeneralForm(user);
    setGeneralEditing(false);
  };

  const fetchData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [userRes, actionRes, emergencyRes, schoolRes, familyRes, careerRes, terminationRes, awardRes] =
        await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/${userId}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/action?user_id=${userId}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/emergency_contact?user_id=${userId}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/education?user_id=${userId}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/family_member?user_id=${userId}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/career_change?user_id=${userId}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contract_termination?user_id=${userId}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user_award?user_id=${userId}`),
      ]);

      const userJson = await userRes.json();
      const actionJson = await actionRes.json();
      const emergencyJson = await emergencyRes.json();
      const schoolJson = await schoolRes.json();
      const familyJson = await familyRes.json();
      const careerJson = await careerRes.json();
      const terminationJson = await terminationRes.json();
      const awardJson = await awardRes.json();

      const userData = userJson.data ?? userJson;
      setUser(userData || null);
      if (userData) populateGeneralForm(userData);
      if (actionJson.success) setActions(actionJson.data || []);
      if (emergencyJson.success) setEmergencies(emergencyJson.data || []);
      if (schoolJson.success) {
        setSchools(
          (schoolJson.data || []).map((s: any) => ({
            id: s.id,
            schoolName: s.school_name,
            major: s.major || "",
            degree: s.degree || "",
            graduationYear: s.graduation_year || "",
          }))
        );
      }
      if (familyJson.success) {
        setFamilies(
          (familyJson.data || []).map((f: any) => ({
            id: f.id,
            fullName: f.full_name || '',
            phone: f.phone || '',
            job: f.job || '',
            relation: f.relation || '',
          }))
        );
      }
      if (careerJson.success) {
        setCareerChanges(
          (careerJson.data || []).map((r: any) => ({
            id: r.id,
            order_number: r.order_number || '',
            position: r.position || '',
            effective_date: r.effective_date || '',
            contract_end_date: r.contract_end_date || '',
          }))
        );
      }
      if (terminationJson.success) {
        setContractTerminations(
          (terminationJson.data || []).map((r: any) => ({
            id: r.id,
            termination_order_number: r.termination_order_number || '',
            termination_date: r.termination_date || '',
            reason: r.reason || '',
          }))
        );
      }
      if (awardJson.success) {
        setUserAwards(
          (awardJson.data || []).map((r: any) => ({
            id: r.id,
            award_type: r.award_type,
            award_name: r.award_name || '',
            award_date: r.award_date || '',
          }))
        );
      }
    } catch (err) {
      console.error(err);
      message.error('Хэрэглэгчийн мэдээлэл ачаалах үед алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Хэрэглэгчийн дэлгэрэнгүй';
    setGeneralEditing(false);
    fetchData();
  }, [userId]);

  const uploadProfileImage = async (file: File) => {
    if (!userId) return;
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/${userId}/profile-image`, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Цээж зураг хадгалахад алдаа');
      message.success('Цээж зураг хадгалагдлаа');
      if (json.data) setUser(json.data);
      else fetchData();
    } catch (err) {
      console.error(err);
      message.error(err instanceof Error ? err.message : 'Цээж зураг хадгалахад алдаа гарлаа');
    } finally {
      setImageUploading(false);
    }
  };

  const actionColumns: ColumnsType<ActionRow> = [
    { title: 'Гарчиг', dataIndex: 'title' },
    { title: 'Тайлбар', dataIndex: 'description', render: (v) => v || '—' },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      render: (v) => <Tag color={v === 'done' ? 'green' : 'blue'}>{v || 'open'}</Tag>,
    },
    {
      title: 'Түвшин',
      dataIndex: 'priority',
      render: (v) => v || 'medium',
    },
    {
      title: 'Огноо',
      dataIndex: 'createdAt',
      render: (v) => new Date(v).toLocaleString(),
    },
    {
      title: 'Үйлдэл',
      key: 'action',
      render: (_, record) => (
        <Popconfirm
          title="Энэ мөрийг устгах уу?"
          okText="Тийм"
          cancelText="Үгүй"
          onConfirm={() => deleteDisciplinaryAction(record.id)}
        >
          <Button danger type="text" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const saveGeneralInfo = async () => {
    if (!userId) return;
    const values = await generalForm.validateFields();
    setGeneralSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Хадгалах үед алдаа');
      message.success('Үндсэн мэдээлэл хадгалагдлаа');
      setGeneralEditing(false);
      fetchData();
    } catch (err) {
      console.error(err);
      message.error('Үндсэн мэдээлэл хадгалахад алдаа гарлаа');
    } finally {
      setGeneralSaving(false);
    }
  };

  const addSchool = async () => {
    const values = await schoolForm.validateFields();
    if (!userId) return;
    setSchoolSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/education`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          school_name: values.schoolName,
          major: values.major,
          degree: values.degree,
          graduation_year: values.graduationYear,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Хадгалах үед алдаа");
      schoolForm.resetFields();
      message.success("Төгссөн сургууль нэмэгдлээ");
      fetchData();
    } catch (err) {
      console.error(err);
      message.error("Төгссөн сургууль хадгалахад алдаа гарлаа");
    } finally {
      setSchoolSaving(false);
    }
  };

  const deleteSchool = async (id: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/education/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Устгах үед алдаа");
      message.success("Төгссөн сургууль устгагдлаа");
      fetchData();
    } catch (err) {
      console.error(err);
      message.error("Төгссөн сургууль устгах үед алдаа гарлаа");
    }
  };

  const addFamily = async () => {
    const values = await familyForm.validateFields();
    if (!userId) return;
    setFamilySaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/family_member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          full_name: values.fullName,
          phone: values.phone,
          job: values.job,
          relation: values.relation,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Хадгалах үед алдаа');
      familyForm.resetFields();
      message.success('Гэр бүлийн гишүүн нэмэгдлээ');
      fetchData();
    } catch (err) {
      console.error(err);
      message.error('Гэр бүлийн гишүүн хадгалахад алдаа гарлаа');
    } finally {
      setFamilySaving(false);
    }
  };

  const deleteFamily = async (id: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/family_member/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Устгах үед алдаа');
      message.success('Гэр бүлийн гишүүн устгагдлаа');
      fetchData();
    } catch (err) {
      console.error(err);
      message.error('Гэр бүлийн гишүүн устгах үед алдаа гарлаа');
    }
  };

  const addEmergency = async () => {
    const values = await emergencyForm.validateFields();
    if (!userId) return;
    setEmergencySaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/emergency_contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, user_id: userId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Хадгалах үед алдаа');
      emergencyForm.resetFields();
      message.success('Яаралтай холбоо барих хүн нэмэгдлээ');
      fetchData();
    } catch (err) {
      console.error(err);
      message.error('Яаралтай холбоо барих хүн хадгалахад алдаа гарлаа');
    } finally {
      setEmergencySaving(false);
    }
  };

  const deleteEmergency = async (id: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/emergency_contact/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Устгах үед алдаа');
      message.success('Яаралтай холбоо барих хүн устгагдлаа');
      fetchData();
    } catch (err) {
      console.error(err);
      message.error('Яаралтай холбоо барих хүн устгах үед алдаа гарлаа');
    }
  };

  const addDisciplinaryAction = async () => {
    if (!userId) return;
    const values = await disciplineForm.validateFields();
    setActionSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, user_id: userId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Алдаа гарлаа');
      message.success('Сахилгын арга хэмжээ нэмэгдлээ');
      disciplineForm.resetFields();
      fetchData();
    } catch (err) {
      console.error(err);
      message.error('Сахилгын арга хэмжээ нэмэх үед алдаа гарлаа');
    } finally {
      setActionSaving(false);
    }
  };

  const deleteDisciplinaryAction = async (actionId: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/action/${actionId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Устгах үед алдаа гарлаа');
      message.success('Сахилгын арга хэмжээ устгагдлаа');
      fetchData();
    } catch (err) {
      console.error(err);
      message.error('Сахилгын арга хэмжээ устгах үед алдаа гарлаа');
    }
  };

  const schoolColumns: ColumnsType<SchoolRow> = [
    { title: 'Сургууль', dataIndex: 'schoolName' },
    { title: 'Мэргэжил', dataIndex: 'major' },
    { title: 'Зэрэг', dataIndex: 'degree' },
    { title: 'Төгссөн он', dataIndex: 'graduationYear' },
    {
      title: 'Үйлдэл',
      key: 'action',
      render: (_, record) => (
        <Button danger type="text" icon={<DeleteOutlined />} onClick={() => deleteSchool(record.id)} />
      ),
    },
  ];

  const familyColumns: ColumnsType<FamilyRow> = [
    { title: 'Овог нэр', dataIndex: 'fullName' },
    { title: 'Утас', dataIndex: 'phone', render: (v) => v || '—' },
    { title: 'Ажил', dataIndex: 'job', render: (v) => v || '—' },
    { title: 'Хэн болох', dataIndex: 'relation', render: (v) => v || '—' },
    {
      title: 'Үйлдэл',
      key: 'action',
      render: (_, record) => (
        <Button danger type="text" icon={<DeleteOutlined />} onClick={() => deleteFamily(record.id)} />
      ),
    },
  ];

  const emergencyColumns: ColumnsType<EmergencyRow> = [
    { title: 'Нэр', dataIndex: 'name' },
    { title: 'Хамаарал', dataIndex: 'relation' },
    { title: 'Утас', dataIndex: 'phone' },
    { title: 'Хаяг', dataIndex: 'address' },
    {
      title: 'Үйлдэл',
      key: 'action',
      render: (_, record) => (
        <Button danger type="text" icon={<DeleteOutlined />} onClick={() => deleteEmergency(record.id)} />
      ),
    },
  ];

  const items = [
    {
      key: 'general',
      label: 'Үндсэн мэдээлэл',
      children: (
        <Card
          loading={loading}
          title="Үндсэн мэдээлэл"
          extra={
            !generalEditing ? (
              <Button type="text" icon={<EditOutlined />} onClick={startGeneralEdit} title="Засах" />
            ) : null
          }
          styles={{ body: { paddingTop: generalEditing ? 16 : 8 } }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              marginBottom: 24,
              paddingBottom: 24,
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <Upload
              showUploadList={false}
              accept="image/jpeg,image/png,image/webp"
              beforeUpload={(file) => {
                uploadProfileImage(file);
                return false;
              }}
              disabled={imageUploading}
            >
              <div style={{ position: 'relative', cursor: imageUploading ? 'wait' : 'pointer' }}>
                <Spin spinning={imageUploading}>
                  <Avatar
                    size={120}
                    src={user?.profile_image}
                    icon={<UserOutlined />}
                    style={{ border: '2px solid #f0f0f0' }}
                  />
                </Spin>
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#1677ff',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #fff',
                  }}
                >
                  <CameraOutlined />
                </div>
              </div>
            </Upload>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                Цээж зураг
              </Text>
              <Text type="secondary">Зураг дээр дарж шинэчилнэ. JPG, PNG, WEBP — хамгийн ихдээ 5MB.</Text>
            </div>
          </div>
          {!generalEditing ? (
            <Descriptions
              column={2}
              bordered
              size="middle"
              labelStyle={{ width: '28%', fontWeight: 600, background: '#fafafa' }}
              contentStyle={{ fontWeight: 500 }}
            >
              <Descriptions.Item label="ID">{displayValue(user?.id)}</Descriptions.Item>
              <Descriptions.Item label="Нэвтрэх нэр">{displayValue(user?.username)}</Descriptions.Item>
              <Descriptions.Item label="И-мэйл">{displayValue(user?.email)}</Descriptions.Item>
              <Descriptions.Item label="Утас">{displayValue(user?.phone)}</Descriptions.Item>
              <Descriptions.Item label="Эрх" span={2}>
                <Tag color="blue">{displayValue(user?.roleRecord?.name || user?.role)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Хэлтсийн дугаар">
                {displayValue(user?.department_number)}
              </Descriptions.Item>
              <Descriptions.Item label="Хувийн хэргийн дугаар">
                {displayValue(user?.personal_case_number)}
              </Descriptions.Item>
              <Descriptions.Item label="Төслийн дугаар">{displayValue(user?.project_number)}</Descriptions.Item>
              <Descriptions.Item label="Албан тушаал">{displayValue(user?.position)}</Descriptions.Item>
              <Descriptions.Item label="Хүйс">{genderLabel(user?.gender)}</Descriptions.Item>
              <Descriptions.Item label="Регистрийн дугаар">{displayValue(user?.register_number)}</Descriptions.Item>
              <Descriptions.Item label="Sap дугаар">{displayValue(user?.sap_number)}</Descriptions.Item>
              <Descriptions.Item label="Нийгмийн даатгал төлсөн жил">
                {displayValue(user?.social_insurance_years)}
              </Descriptions.Item>
              <Descriptions.Item label="Жолооны үнэмлэхний ангилал">
                {displayValue(user?.driver_license_class)}
              </Descriptions.Item>
              <Descriptions.Item label="Жолооны үнэмлэхний дугаар">
                {displayValue(user?.driver_license_number)}
              </Descriptions.Item>
              <Descriptions.Item label="Жолоочны үнэмлэхний хүчинтэй огноо">
                {displayValue(user?.driver_license_expiry)}
              </Descriptions.Item>
              <Descriptions.Item label="Харъяалал">{displayValue(user?.affiliation)}</Descriptions.Item>
              <Descriptions.Item label="Оршин суугаа хаяг" span={2}>
                {displayValue(user?.residential_address)}
              </Descriptions.Item>
              <Descriptions.Item label="Иргэний үнэмлэх дээрхи гэрийн хаяг" span={2}>
                {displayValue(user?.id_card_home_address)}
              </Descriptions.Item>
              <Descriptions.Item label="Банкны дансны дугаар">
                {displayValue(user?.bank_account_number)}
              </Descriptions.Item>
              <Descriptions.Item label="Компаний цахим хаяг">
                {displayValue(user?.company_email)}
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <Form form={generalForm} layout="vertical" requiredMark={false}>
              <Descriptions
                column={2}
                bordered
                size="middle"
                style={{ marginBottom: 24 }}
                labelStyle={{ width: '28%', fontWeight: 600, background: '#fafafa' }}
              >
                <Descriptions.Item label="ID">{displayValue(user?.id)}</Descriptions.Item>
                <Descriptions.Item label="Нэвтрэх нэр">{displayValue(user?.username)}</Descriptions.Item>
                <Descriptions.Item label="И-мэйл">{displayValue(user?.email)}</Descriptions.Item>
                <Descriptions.Item label="Утас">{displayValue(user?.phone)}</Descriptions.Item>
                <Descriptions.Item label="Эрх" span={2}>
                  <Tag color="blue">{displayValue(user?.roleRecord?.name || user?.role)}</Tag>
                </Descriptions.Item>
              </Descriptions>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '0 24px',
                }}
              >
                <Form.Item name="department_number" label="Хэлтсийн дугаар">
                  <Input placeholder="Хэлтсийн дугаар" />
                </Form.Item>
                <Form.Item name="personal_case_number" label="Хувийн хэргийн дугаар">
                  <Input placeholder="Хувийн хэргийн дугаар" />
                </Form.Item>
                <Form.Item name="project_number" label="Төслийн дугаар">
                  <Input placeholder="Төслийн дугаар" />
                </Form.Item>
                <Form.Item name="position" label="Албан тушаал">
                  <Input placeholder="Албан тушаал" />
                </Form.Item>
                <Form.Item name="gender" label="Хүйс">
                  <Select
                    allowClear
                    placeholder="Сонгох"
                    options={[
                      { value: 'male', label: 'Эр' },
                      { value: 'female', label: 'Эм' },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="register_number" label="Регистрийн дугаар">
                  <Input placeholder="Регистрийн дугаар" />
                </Form.Item>
                <Form.Item name="sap_number" label="Sap дугаар">
                  <Input placeholder="Sap дугаар" />
                </Form.Item>
                <Form.Item name="social_insurance_years" label="Нийгмийн даатгал төлсөн жил">
                  <Input placeholder="Жил" />
                </Form.Item>
                <Form.Item name="driver_license_class" label="Жолооны үнэмлэхний ангилал">
                  <Input placeholder="B, C, CE..." />
                </Form.Item>
                <Form.Item name="driver_license_number" label="Жолооны үнэмлэхний дугаар">
                  <Input placeholder="Үнэмлэхний дугаар" />
                </Form.Item>
                <Form.Item name="driver_license_expiry" label="Жолоочны үнэмлэхний хүчинтэй огноо">
                  <Input placeholder="YYYY-MM-DD" />
                </Form.Item>
                <Form.Item name="affiliation" label="Харъяалал">
                  <Input placeholder="Харъяалал" />
                </Form.Item>
                <Form.Item name="residential_address" label="Оршин суугаа хаяг" style={{ gridColumn: '1 / -1' }}>
                  <Input placeholder="Оршин суугаа хаяг" />
                </Form.Item>
                <Form.Item name="id_card_home_address" label="Иргэний үнэмлэх дээрхи гэрийн хаяг" style={{ gridColumn: '1 / -1' }}>
                  <Input placeholder="Иргэний үнэмлэх дээрхи гэрийн хаяг" />
                </Form.Item>
                <Form.Item name="bank_account_number" label="Банкны дансны дугаар">
                  <Input placeholder="Банкны дансны дугаар" />
                </Form.Item>
                <Form.Item name="company_email" label="Компаний цахим хаяг">
                  <Input placeholder="company@example.com" />
                </Form.Item>
              </div>
              <Space style={{ marginTop: 8 }}>
                <Button type="primary" loading={generalSaving} onClick={saveGeneralInfo}>
                  Хадгалах
                </Button>
                <Button onClick={cancelGeneralEdit}>Цуцлах</Button>
              </Space>
            </Form>
          )}
        </Card>
      ),
    },
    {
      key: 'employment',
      label: 'Ажлын мэдээлэл',
      children: (
        <EmploymentTab
          userId={userId}
          user={user}
          careerChanges={careerChanges}
          contractTerminations={contractTerminations}
          userAwards={userAwards}
          loading={loading}
          onRefresh={fetchData}
        />
      ),
    },
    {
      key: 'school',
      label: 'Төгссөн сургууль',
      children: (
        <Card>
          <Form form={schoolForm} layout="inline" style={{ marginBottom: 16 }}>
            <Form.Item name="schoolName" rules={[{ required: true, message: 'Сургууль' }]}>
              <Input placeholder="Сургуулийн нэр" />
            </Form.Item>
            <Form.Item name="major" rules={[{ required: true, message: 'Мэргэжил' }]}>
              <Input placeholder="Мэргэжил" />
            </Form.Item>
            <Form.Item name="degree">
              <Input placeholder="Зэрэг" />
            </Form.Item>
            <Form.Item name="graduationYear">
              <Input placeholder="Төгссөн он" />
            </Form.Item>
            <Button type="primary" icon={<PlusOutlined />} loading={schoolSaving} onClick={addSchool} />
          </Form>
          <Table rowKey="id" columns={schoolColumns} dataSource={schools} pagination={false} />
        </Card>
      ),
    },
    {
      key: 'family',
      label: 'Гэр бүлийн байдал',
      children: (
        <Card>
          <Form form={familyForm} layout="inline" style={{ marginBottom: 16 }}>
            <Form.Item name="fullName" rules={[{ required: true, message: 'Овог нэр' }]}>
              <Input placeholder="Овог нэр" />
            </Form.Item>
            <Form.Item name="phone">
              <Input placeholder="Утас" />
            </Form.Item>
            <Form.Item name="job">
              <Input placeholder="Ажил" />
            </Form.Item>
            <Form.Item name="relation">
              <Input placeholder="Хэн болох" />
            </Form.Item>
            <Button type="primary" icon={<PlusOutlined />} loading={familySaving} onClick={addFamily} />
          </Form>
          <Table rowKey="id" columns={familyColumns} dataSource={families} pagination={false} />
        </Card>
      ),
    },
    {
      key: 'emergency',
      label: 'Яаралтай үед холбоо барих хүмүүс',
      children: (
        <Card>
          <Form form={emergencyForm} layout="inline" style={{ marginBottom: 16 }}>
            <Form.Item name="name" rules={[{ required: true, message: 'Нэр' }]}>
              <Input placeholder="Нэр" />
            </Form.Item>
            <Form.Item name="relation">
              <Input placeholder="Хамаарал" />
            </Form.Item>
            <Form.Item name="phone" rules={[{ required: true, message: 'Утас' }]}>
              <Input placeholder="Утас" />
            </Form.Item>
            <Form.Item name="address">
              <Input placeholder="Хаяг" style={{ width: 280 }} />
            </Form.Item>
            <Button type="primary" icon={<PlusOutlined />} loading={emergencySaving} onClick={addEmergency} />
          </Form>
          <Table rowKey="id" columns={emergencyColumns} dataSource={emergencies} pagination={false} />
        </Card>
      ),
    },
    {
      key: 'disciplinary',
      label: 'Сахилгын арга хэмжээ',
      children: (
        <Card>
          <Form form={disciplineForm} layout="inline" style={{ marginBottom: 16 }}>
            <Form.Item name="title" rules={[{ required: true, message: 'Гарчиг' }]}>
              <Input placeholder="Арга хэмжээний гарчиг" style={{ width: 220 }} />
            </Form.Item>
            <Form.Item name="description">
              <Input placeholder="Тайлбар" style={{ width: 260 }} />
            </Form.Item>
            <Form.Item name="status" initialValue="open">
              <Select style={{ width: 130 }} options={[{ value: 'open', label: 'open' }, { value: 'done', label: 'done' }]} />
            </Form.Item>
            <Form.Item name="priority" initialValue="medium">
              <Select
                style={{ width: 130 }}
                options={[{ value: 'low', label: 'low' }, { value: 'medium', label: 'medium' }, { value: 'high', label: 'high' }]}
              />
            </Form.Item>
            <Button type="primary" icon={<PlusOutlined />} loading={actionSaving} onClick={addDisciplinaryAction} />
          </Form>
          <Table rowKey="id" columns={actionColumns} dataSource={actions} pagination={{ pageSize: 8 }} />
        </Card>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={() => router.push('/admin/user')}>Буцах</Button>
        <Title level={4} style={{ margin: 0 }}>Хэрэглэгчийн дэлгэрэнгүй</Title>
        <Text type="secondary">{user?.username ? `(${user.username})` : ''}</Text>
      </Space>

      <Tabs defaultActiveKey="general" items={items} />
    </div>
  );
}

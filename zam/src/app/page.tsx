'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from 'antd';

export default function Home() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const openNotification = (type: string, message: string) => {
    alert(`${type.toUpperCase()}: ${message}`);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      openNotification('error', 'Нэвтрэх нэр болон нууц үгээ оруулна уу!');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        openNotification('success', 'Амжилттай нэвтрэлээ!');

        const { token, user } = data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('permissions', JSON.stringify(user.permissions));
        localStorage.setItem('role', user.role?.toString() ?? '');
        localStorage.setItem('username', user.username);

        router.push('/admin');
      } else {
        openNotification('error', data.message || 'Нэвтрэх нэр эсвэл нууц үг буруу байна!');
      }
    } catch (error) {
      console.error(error);
      openNotification('error', 'Сервертэй холбогдож чадсангүй!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-gray-800">
      {/* Hero Section */}
      <section className="bg-[url('/bg.png')] bg-cover bg-center text-white h-[90vh] flex flex-col justify-center items-center text-center p-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">Зам бүтээдэг хүч – Ирээдүйг бүтээгч бид</h1>
        <p className="max-w-xl text-lg md:text-xl mb-6">
          Бид авто зам, гүүр, дэд бүтцийн төслүүдийг чанар стандартын дагуу гүйцэтгэдэг үндэсний компани.
        </p>
        <div className="flex gap-4">
          <Button type="primary" className="bg-blue-600 hover:bg-blue-700">Апп татах</Button>
          <Button type="default" className="text-white border-white hover:bg-white hover:text-blue-600">Төслүүд үзэх</Button>
        </div>
      </section>

      {/* About Us */}
      <section className="py-16 px-6 bg-gray-100 text-center">
        <h2 className="text-3xl font-bold mb-4">Бидний тухай</h2>
        <p className="max-w-3xl mx-auto text-lg">
          Үлэмжийн зам LLC нь 2008 оноос хойш авто зам, гүүрийн барилга угсралт, засвар арчлалтаар мэргэшсэн үндэсний хэмжээний компани юм.
        </p>
      </section>

      {/* Projects Section */}
      <section className="py-16 px-6 bg-white">
        <h2 className="text-3xl font-bold text-center mb-10">Төслүүд</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((project) => (
            <div key={project} className="rounded-xl overflow-hidden shadow-lg">
              <Image src={`/p${project}.png`} alt={`Project ${project}`} width={500} height={300} className="w-full object-cover" />
              <div className="p-4">
                <h3 className="font-semibold text-xl mb-2">Төсөл {project}</h3>
                <p>Авто замын 30 км урттай шинэчлэлтийн төсөл, 2024 онд ашиглалтад орсон.</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* App Download Section */}
      <section className="py-16 px-6 bg-gray-50 text-center">
        <h2 className="text-3xl font-bold mb-4">Аппликэйшн татах</h2>
        <p className="mb-6">Манай апп-аар дамжуулан төслийн мэдээлэл, замын мэдээ, захиалга авах боломжтой.</p>
        <div className="flex justify-center gap-6">
          <Image src="/playstore.png" alt="Play Store" width={150} height={50} />
          <Image src="/appstore.png" alt="App Store" width={150} height={50} />
        </div>
      </section>

      {/* Login Section */}
      <section className="py-16 px-6 bg-[url('/road.jpg')] bg-cover bg-center text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Нэвтрэх</h2>
        <form onSubmit={handleLogin} className="max-w-md mx-auto space-y-4 backdrop-blur-sm bg-black/30 p-6 rounded">
          <input
            type="text"
            placeholder="Нэвтрэх нэр"
            className="w-full p-2 border rounded text-black"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Нууц үг"
            className="w-full p-2 border rounded text-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="primary" htmlType="submit" className="w-full" loading={loading}>Нэвтрэх</Button>
        </form>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-6 bg-white text-center">
        <h2 className="text-3xl font-bold mb-4">Холбоо барих</h2>
        <p>Утас: 7000-0000 | Имэйл: info@roadmaster.mn</p>
        <p>Хаяг: Улаанбаатар хот, Сүхбаатар дүүрэг, 1-р хороо, Энхтайваны өргөн чөлөө</p>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center py-6">
        <p>&copy; {new Date().getFullYear()} RoadMaster LLC. Бүх эрх хуулиар хамгаалагдсан.</p>
      </footer>
    </main>
  );
}

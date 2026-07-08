import Image from 'next/image';

export default function PublicBgImage({
  src,
  alt,
  priority = false,
  sizes = '(max-width: 768px) 100vw, 50vw',
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
}) {
  if (src.startsWith('http')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      className="object-cover"
      sizes={sizes}
    />
  );
}

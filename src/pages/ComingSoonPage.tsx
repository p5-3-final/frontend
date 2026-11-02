export interface ComingSoonPageProps {
  title: string;
}

export function ComingSoonPage({ title }: ComingSoonPageProps) {
  return <h1 className="text-xl font-bold">{title}</h1>;
}

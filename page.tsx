import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-warm-50">
      {/* Nav */}
      <nav className="border-b border-warm-100 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-8 h-8 bg-coral-500 rounded-full flex items-center justify-center text-white font-bold">
              💊
            </span>
            <span className="font-bold text-warm-900 text-lg">
              Farmácia Amiga
            </span>
          </Link>
          <div className="hidden md:flex gap-6 text-sm font-medium text-warm-900">
            <a href="#como-funciona" className="hover:text-coral-500">
              Como funciona
            </a>
            <a href="#planos" className="hover:text-coral-500">
              Planos
            </a>
            <a href="#contato" className="hover:text-coral-500">
              Contato
            </a>
          </div>
          <div className="flex gap-2">
            <Link
              href="/entrar"
              className="px-4 py-2 text-sm font-semibold text-warm-900 hover:text-coral-500"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="px-4 py-2 text-sm font-semibold bg-coral-500 text-white rounded-full hover:bg-coral-600 transition"
            >
              Começar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block px-3 py-1 bg-coral-100 text-coral-700 rounded-full text-xs font-semibold mb-4">
              Para farmácias e seus pacientes
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-warm-900 leading-tight">
              Seu paciente nunca mais esquece o remédio na hora.
            </h1>
            <p className="mt-6 text-lg text-warm-900/80 leading-relaxed">
              Alertas por WhatsApp e aplicativo, chat direto com o farmacêutico
              e orientação profissional sem precisar enfrentar uma fila.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/cadastro?tipo=farmacia"
                className="px-6 py-3 bg-coral-500 text-white rounded-full font-semibold hover:bg-coral-600 transition text-center"
              >
                Sou farmácia — testar grátis
              </Link>
              <Link
                href="/cadastro?tipo=paciente"
                className="px-6 py-3 border-2 border-warm-900 text-warm-900 rounded-full font-semibold hover:bg-warm-900 hover:text-white transition text-center"
              >
                Sou paciente
              </Link>
            </div>
            <p className="mt-4 text-xs text-warm-900/60">
              60 dias grátis para a primeira farmácia da sua cidade.
            </p>
          </div>

          <div className="relative">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-warm-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-coral-100 rounded-full flex items-center justify-center text-2xl">
                  🔔
                </div>
                <div>
                  <div className="font-bold text-warm-900">
                    Próxima dose em 15 min
                  </div>
                  <div className="text-sm text-warm-900/60">
                    Dona Maria, 72 anos
                  </div>
                </div>
              </div>
              <div className="bg-coral-50 border-l-4 border-coral-500 rounded-lg p-4 text-sm text-warm-900">
                <strong>14:00</strong> — Hora do seu medicamento prescrito pelo
                Dr. Silva. Tome com água.
              </div>
              <div className="mt-4 flex gap-2 text-xs">
                <span className="px-3 py-1 bg-emerald-600 text-white rounded-full font-semibold">
                  ✓ Tomei
                </span>
                <span className="px-3 py-1 bg-warm-100 text-warm-900 rounded-full font-semibold">
                  Adiar 10 min
                </span>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-emerald-600 text-white rounded-2xl px-4 py-3 shadow-lg text-sm font-semibold">
              💬 Chat direto com o farmacêutico
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-warm-900 text-center mb-12">
            Como funciona
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                n: "1",
                t: "A farmácia cadastra o paciente",
                d: "Nome, remédios, horários. Em 2 minutos.",
              },
              {
                n: "2",
                t: "O paciente recebe os alertas",
                d: "WhatsApp e app, com mensagem de voz para quem não lê bem.",
              },
              {
                n: "3",
                t: "Comunicação direta",
                d: "Chat farmacêutico ↔ paciente. Orientação sem fila.",
              },
            ].map((s) => (
              <div
                key={s.n}
                className="bg-warm-50 rounded-2xl p-6 border border-warm-100"
              >
                <div className="w-12 h-12 bg-coral-500 text-white rounded-full flex items-center justify-center font-extrabold text-xl mb-4">
                  {s.n}
                </div>
                <h3 className="font-bold text-lg text-warm-900 mb-2">{s.t}</h3>
                <p className="text-warm-900/70">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="py-20 bg-warm-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-warm-900 text-center mb-4">
            Planos
          </h2>
          <p className="text-center text-warm-900/70 mb-12">
            Para farmácias. Pacientes usam gratuitamente.
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl p-8 border border-warm-100">
              <div className="text-sm font-semibold text-warm-900/60 uppercase tracking-wide">
                Básico
              </div>
              <div className="mt-2 text-4xl font-extrabold text-warm-900">
                R$ 149
                <span className="text-base font-normal text-warm-900/60">
                  /mês
                </span>
              </div>
              <ul className="mt-6 space-y-2 text-sm text-warm-900">
                <li>✓ Até 100 pacientes</li>
                <li>✓ Alertas por WhatsApp e app</li>
                <li>✓ Chat farmacêutico ↔ paciente</li>
                <li>✓ Dashboard de recompras</li>
              </ul>
            </div>
            <div className="bg-coral-50 rounded-2xl p-8 border-2 border-coral-500 relative">
              <div className="absolute -top-3 right-6 bg-coral-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Mais escolhido
              </div>
              <div className="text-sm font-semibold text-coral-700 uppercase tracking-wide">
                Profissional
              </div>
              <div className="mt-2 text-4xl font-extrabold text-warm-900">
                R$ 299
                <span className="text-base font-normal text-warm-900/60">
                  /mês
                </span>
              </div>
              <ul className="mt-6 space-y-2 text-sm text-warm-900">
                <li>✓ Pacientes ilimitados</li>
                <li>✓ Tudo do Básico</li>
                <li>✓ Módulo TeleFarmácia (opcional)</li>
                <li>✓ Suporte prioritário</li>
              </ul>
            </div>
          </div>
          <p className="text-center text-xs text-warm-900/60 mt-8">
            TeleFarmácia é um módulo opcional. Pagamentos via Mercado Pago.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section id="contato" className="py-20 bg-emerald-700 text-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold mb-4">
            Quer ser a primeira farmácia piloto da sua cidade?
          </h2>
          <p className="text-white/80 mb-8">
            60 dias grátis, acompanhamento direto do fundador, treinamento
            incluso.
          </p>
          <Link
            href="/cadastro?tipo=farmacia"
            className="inline-block px-8 py-4 bg-coral-500 text-white rounded-full font-bold hover:bg-coral-600 transition"
          >
            Quero testar com minha farmácia
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-warm-900 text-warm-50 py-12">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          <div>
            <div className="font-bold text-lg mb-2">Farmácia Amiga</div>
            <p className="text-sm text-warm-50/60">
              Operada por Surf Soul Labs · Santa Catarina, Brasil
            </p>
          </div>
          <div>
            <div className="font-semibold mb-2">Legal</div>
            <ul className="space-y-1 text-sm">
              <li>
                <Link
                  href="/privacidade"
                  className="text-warm-50/80 hover:text-coral-500"
                >
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link
                  href="/termos"
                  className="text-warm-50/80 hover:text-coral-500"
                >
                  Termos de Uso
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">Encarregado (DPO)</div>
            <a
              href="mailto:dpo@farmaciaamiga.com.br"
              className="text-sm text-warm-50/80 hover:text-coral-500"
            >
              dpo@farmaciaamiga.com.br
            </a>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 mt-8 pt-8 border-t border-warm-50/10 text-xs text-warm-50/50">
          © 2026 Surf Soul Labs. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}

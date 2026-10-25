export const metadata = { title: "Termos de Uso — Farmácia Amiga" };

export default function TermosPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-10 prose prose-sm md:prose-base">
      <h1>Termos de Uso</h1>
      <p className="text-sm text-gray-500">Última atualização: 24/10/2026 · Versão 1.0</p>

      <h2>1. Aceite</h2>
      <p>Ao usar a Farmácia Amiga você concorda com estes Termos. Se não concorda, não use o serviço.</p>

      <h2>2. O que é a Farmácia Amiga</h2>
      <p>Plataforma SaaS que conecta farmácias e pacientes para alertas de medicação, atendimento farmacêutico e, opcionalmente, TeleFarmácia.</p>

      <h2>3. O que a Farmácia Amiga NÃO é</h2>
      <ul>
        <li>Não é um serviço médico</li>
        <li>Não substitui consulta presencial com médico ou farmacêutico</li>
        <li>Não emite prescrição médica</li>
        <li>Não faz diagnóstico clínico</li>
        <li>Em caso de emergência: ligue para o SAMU (192) ou vá ao pronto-socorro</li>
      </ul>

      <h2>4. Cadastro</h2>
      <p>Você deve ser maior de 18 anos. Dados fornecidos devem ser verdadeiros. A senha é pessoal e intransferível. Se suspeitar de acesso indevido, comunique imediatamente.</p>

      <h2>5. TeleFarmácia (quando disponível)</h2>
      <ul>
        <li>Serviço opcional contratado pela sua farmácia</li>
        <li>Modelo de créditos: 4 gratuitos/mês (1/semana, não cumulativos)</li>
        <li>Créditos adicionais podem ser comprados</li>
        <li>Atendimentos NÃO são gravados por padrão</li>
        <li>O farmacêutico pode encaminhar você a um médico quando necessário</li>
      </ul>

      <h2>6. Pagamentos</h2>
      <ul>
        <li>Processados pelo Mercado Pago</li>
        <li>Compras de créditos são finais (sem reembolso automático)</li>
        <li>Direito de arrependimento de 7 dias conforme Art. 49 CDC (desde que crédito não tenha sido usado)</li>
      </ul>

      <h2>7. Responsabilidade da farmácia</h2>
      <p>A farmácia é responsável pela qualidade e correção das informações inseridas sobre seus pacientes (medicação, posologia, horários). A Farmácia Amiga é operador técnico, não assume responsabilidade clínica.</p>

      <h2>8. Condutas proibidas</h2>
      <ul>
        <li>Criar múltiplas contas para obter créditos gratuitos extras</li>
        <li>Compartilhar conta com terceiros</li>
        <li>Tentar burlar a segurança</li>
        <li>Usar o serviço para fins ilegais ou abusivos</li>
      </ul>
      <p>Violações resultam em suspensão imediata, sem direito a reembolso de créditos.</p>

      <h2>9. Suspensão e cancelamento</h2>
      <p>Você pode cancelar a qualquer momento em "Meus dados" → "Excluir conta". A farmácia pode encerrar o serviço com aviso de 30 dias.</p>

      <h2>10. Limitação de responsabilidade</h2>
      <p>Fazemos nosso melhor para que o serviço esteja sempre disponível, mas não garantimos 100% de uptime. Alertas podem atrasar por motivos técnicos. Nunca dependa EXCLUSIVAMENTE do app para medicação crítica — mantenha alternativas (alarme, família).</p>

      <h2>11. Alterações destes termos</h2>
      <p>Mudanças materiais serão comunicadas com 30 dias de antecedência. O uso continuado após a alteração significa aceite.</p>

      <h2>12. Lei aplicável e foro</h2>
      <p>Legislação brasileira. Foro: comarca de Florianópolis/SC, salvo competência especial do CDC.</p>

      <h2>13. Contato</h2>
      <p><a href="mailto:contato@farmaciaamiga.com.br">contato@farmaciaamiga.com.br</a></p>

      <hr />
      <p className="text-xs text-gray-500">⚠️ Template inicial. Advogado deve revisar antes do lançamento.</p>
    </main>
  );
}

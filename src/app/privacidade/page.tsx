export const metadata = {
  title: "Política de Privacidade — Farmácia Amiga",
  description: "Como a Farmácia Amiga trata seus dados pessoais e de saúde conforme a LGPD.",
};

export default function PrivacidadePage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-10 prose prose-sm md:prose-base">
      <h1>Política de Privacidade</h1>
      <p className="text-sm text-gray-500">Última atualização: 24/10/2026 · Versão 1.0</p>
      <p>A <strong>Farmácia Amiga</strong>, operada por <strong>Surf Soul Labs</strong>, respeita sua privacidade e segue a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).</p>

      <h2>1. Quem somos</h2>
      <p>A Farmácia Amiga é uma plataforma SaaS que conecta farmácias e pacientes. Atuamos como <strong>Operador</strong> de dados em nome das farmácias contratantes, que são as <strong>Controladoras</strong> dos dados dos seus pacientes.</p>

      <h2>2. Encarregado (DPO)</h2>
      <p>Marcos Selinger — <a href="mailto:dpo@farmaciaamiga.com.br">dpo@farmaciaamiga.com.br</a></p>

      <h2>3. Quais dados tratamos</h2>
      <ul>
        <li><strong>Dados cadastrais:</strong> nome, email, telefone, CPF.</li>
        <li><strong>Dados de saúde (sensíveis):</strong> medicamentos em uso, posologia, horários de administração, conteúdo de atendimento farmacêutico, mensagens entre você e o farmacêutico.</li>
        <li><strong>Dados de pagamento:</strong> processados integralmente pelo Mercado Pago — nós não armazenamos número de cartão.</li>
        <li><strong>Dados de uso:</strong> logs de acesso, data e hora de interações.</li>
      </ul>

      <h2>4. Para que usamos</h2>
      <ul>
        <li>Enviar alertas de horário de medicação</li>
        <li>Permitir comunicação com o farmacêutico da sua farmácia</li>
        <li>Oferecer TeleFarmácia (quando contratada pela sua farmácia)</li>
        <li>Processar pagamentos de créditos</li>
        <li>Cumprir obrigações legais (ex: retenção fiscal)</li>
      </ul>

      <h2>5. Base legal</h2>
      <ul>
        <li><strong>Dados sensíveis de saúde:</strong> consentimento específico e destacado (Art. 11, I, LGPD)</li>
        <li><strong>Dados cadastrais:</strong> execução de contrato (Art. 7, V, LGPD)</li>
        <li><strong>Pagamentos:</strong> cumprimento de obrigação legal (Art. 7, II, LGPD)</li>
      </ul>

      <h2>6. Com quem compartilhamos</h2>
      <ul>
        <li><strong>Google (Firebase):</strong> hospedagem de dados em São Paulo (região southamerica-east1)</li>
        <li><strong>Vercel:</strong> hospedagem da aplicação (pode ter servidores nos EUA)</li>
        <li><strong>Mercado Pago:</strong> processamento de pagamentos</li>
        <li><strong>Twilio:</strong> envio de WhatsApp (sem incluir nome do medicamento na mensagem)</li>
        <li><strong>Google Cloud TTS:</strong> conversão texto-para-voz (apenas mensagem genérica, sem nome de medicamento)</li>
      </ul>

      <h2>7. Transferência internacional</h2>
      <p>Alguns de nossos fornecedores (Vercel, Mercado Pago, Google) podem processar dados fora do Brasil. Garantimos que esses fornecedores atendam a padrões equivalentes à LGPD.</p>

      <h2>8. Retenção</h2>
      <ul>
        <li>Dados ativos: enquanto você estiver cadastrado + 90 dias</li>
        <li>Dados de pagamento: 5 anos (obrigação fiscal — Art. 173 CTN)</li>
        <li>Logs de auditoria: 2 anos</li>
        <li>Chat/atendimento: 1 ano</li>
      </ul>

      <h2>9. Seus direitos (Art. 18 LGPD)</h2>
      <p>Você pode, a qualquer momento:</p>
      <ul>
        <li>Acessar seus dados</li>
        <li>Corrigir dados incompletos ou desatualizados</li>
        <li>Pedir exclusão dos dados (com exceção dos retidos por lei)</li>
        <li>Pedir portabilidade (exportação em formato aberto)</li>
        <li>Revogar consentimentos</li>
        <li>Obter informação sobre com quem compartilhamos</li>
      </ul>
      <p>Prazo de resposta: até 15 dias. Para exercer: acesse "Meus dados" no app ou escreva para o DPO.</p>

      <h2>10. Segurança</h2>
      <ul>
        <li>Criptografia em trânsito (HTTPS/TLS)</li>
        <li>Criptografia em repouso (padrão Google Cloud)</li>
        <li>Controle de acesso baseado em papéis (RBAC)</li>
        <li>Isolamento multi-tenant (farmácia A não acessa B)</li>
        <li>Logs de auditoria</li>
      </ul>

      <h2>11. Incidentes</h2>
      <p>Em caso de vazamento, notificaremos a ANPD e os titulares afetados em até 2 dias úteis, conforme Art. 48 LGPD.</p>

      <h2>12. Alterações desta política</h2>
      <p>Mudanças materiais serão comunicadas por email + aviso no app. A versão anterior fica disponível por 5 anos para consulta.</p>

      <h2>13. Contato</h2>
      <p>DPO: <a href="mailto:dpo@farmaciaamiga.com.br">dpo@farmaciaamiga.com.br</a><br />ANPD: <a href="https://www.gov.br/anpd">gov.br/anpd</a></p>

      <hr />
      <p className="text-xs text-gray-500">⚠️ Este documento é um template inicial. A versão final deve ser revisada por advogado especialista em LGPD e saúde antes do lançamento comercial.</p>
    </main>
  );
}
